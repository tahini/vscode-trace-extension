import { Trace } from 'tsp-typescript-client/lib/models/trace';
import { TspClient } from 'tsp-typescript-client/lib/protocol/tsp-client';
import { Query } from 'tsp-typescript-client/lib/models/query/query';
import { OutputDescriptor } from 'tsp-typescript-client/lib/models/output-descriptor';
import { TspClientResponse } from 'tsp-typescript-client/lib/protocol/tsp-client-response';
import { getTspClient } from "../tspClient";

export class TraceManager {

    private fOpenedTraces: Map<string, Trace> = new Map();

    /**
     * Get an array of opened traces
     * @returns Array of Trace
     */
    async getOpenedTraces(): Promise<Trace[]> {
        const openedTraces: Array<Trace> = [];
        // Look on the server for opened trace
        const tracesResponse = await getTspClient().fetchTraces();
        if (tracesResponse.isOk()) {
            openedTraces.push(...tracesResponse.getModel());
        }
        return openedTraces;
    }

    /**
     * Get a specific trace information
     * @param traceUUID Trace UUID
     */
    async getTrace(traceUUID: string): Promise<Trace | undefined> {
        // Check if the trace is in "cache"
        let trace = this.fOpenedTraces.get(traceUUID);

        // If the trace is undefined, check on the server
        if (!trace) {
            const traceResponse = await getTspClient().fetchTrace(traceUUID);
            if (traceResponse.isOk()) {
                trace = traceResponse.getModel();
            }
        }
        return trace;
    }

    /**
     * Get an array of OutputDescriptor for a given trace
     * @param traceUUID Trace UUID
     */
    async getAvailableOutputs(traceUUID: string): Promise<OutputDescriptor[] | undefined> {
        // Check if the trace is opened
        const trace = this.fOpenedTraces.get(traceUUID);
        if (trace) {
            const outputsResponse = await getTspClient().experimentOutputs(trace.UUID);
            return outputsResponse.getModel();
        }
        return undefined;
    }

    /**
     * Open a given trace on the server
     * @param traceURI Trace URI to open
     * @param traceName Optional name for the trace. If not specified the URI name is used
     * @returns The opened trace
     */
    async openTrace(traceURI: string, traceName: string): Promise<Trace | undefined> {
        const traceResponse = await getTspClient().openTrace(new Query({
            'name': traceName,
            'uri': traceURI
        }));
        const openedTrace = traceResponse.getModel();
        if (openedTrace && traceResponse.isOk()) {
            this.addTrace(openedTrace);
            return openedTrace;
        } else if (openedTrace && traceResponse.getStatusCode() === 409) {
            // Repost with a suffix as long as there are conflicts
            const handleConflict = async function (tspClient: TspClient, tryNb: number): Promise<TspClientResponse<Trace>> {
                const suffix = '(' + tryNb + ')';
                return tspClient.openTrace(new Query({
                    'name': traceName + suffix,
                    'uri': traceURI
                }));
            };
            let conflictResolutionResponse = traceResponse;
            let i = 1;
            while (conflictResolutionResponse.getStatusCode() === 409) {
                conflictResolutionResponse = await handleConflict(getTspClient(), i);
                i++;
            }
            const trace = conflictResolutionResponse.getModel();
            if (trace && conflictResolutionResponse.isOk()) {
                this.addTrace(trace);
                return trace;
            }
        }
        // TODO Handle trace open errors
        return undefined;
    }

    /**
     * Update the trace with the latest info from the server.
     * @param traceName Trace name to update
     * @returns The updated trace or undefined if the trace was not open previously
     */
    async updateTrace(traceUUID: string): Promise<Trace | undefined> {
        const currentTrace = this.fOpenedTraces.get(traceUUID);
        if (currentTrace) {
            const traceResponse = await getTspClient().fetchTrace(currentTrace.UUID);
            const trace = traceResponse.getModel();
            if (trace && traceResponse.isOk) {
                this.fOpenedTraces.set(traceUUID, trace);
                return trace;
            }
        }

        return undefined;
    }

    /**
     * Close the given on the server
     * @param traceUUID Trace UUID
     */
    async closeTrace(traceUUID: string): Promise<void> {
        const traceToClose = this.fOpenedTraces.get(traceUUID);
        if (traceToClose) {
            await getTspClient().deleteTrace(traceUUID);
            this.removeTrace(traceUUID);
        }
    }

    private addTrace(trace: Trace) {
        this.fOpenedTraces.set(trace.UUID, trace);
    }

    private removeTrace(traceUUID: string): Trace | undefined {
        const deletedTrace = this.fOpenedTraces.get(traceUUID);
        this.fOpenedTraces.delete(traceUUID);
        return deletedTrace;
    }
}
