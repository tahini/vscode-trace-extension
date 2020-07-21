import { Trace as TspTrace } from 'tsp-typescript-client/lib/models/trace';
import { Query } from 'tsp-typescript-client/lib/models/query/query';
import { TspClientResponse } from 'tsp-typescript-client/lib/protocol/tsp-client-response';
import { TspClient } from 'tsp-typescript-client/lib/protocol/tsp-client';
import { tspClient } from "../tspClient";

class TraceManager {

  /**
     * Open a given trace on the server
     * @param traceURI Trace URI to open
     * @param traceName Optional name for the trace. If not specified the URI name is used
     * @returns The opened trace
     */
  async openTrace(traceURI: string, traceName: string): Promise<TspTrace | undefined> {
    const traceResponse = await tspClient.openTrace(new Query({
      'name': traceName,
      'uri': traceURI
    }));
    const openedTrace = traceResponse.getModel();
    if (openedTrace && traceResponse.isOk()) {
      return openedTrace;
    } else if (openedTrace && traceResponse.getStatusCode() === 409) {
      // Repost with a suffix as long as there are conflicts
      const handleConflict = async function (tspClient: TspClient, tryNb: number): Promise<TspClientResponse<TspTrace>> {
        const suffix = '(' + tryNb + ')';
        return tspClient.openTrace(new Query({
          'name': traceName + suffix,
          'uri': traceURI
        }));
      };
      let conflictResolutionResponse = traceResponse;
      let i = 1;
      while (conflictResolutionResponse.getStatusCode() === 409) {
        conflictResolutionResponse = await handleConflict(tspClient, i);
        i++;
      }
      const trace = conflictResolutionResponse.getModel();
      if (trace && conflictResolutionResponse.isOk()) {
        return trace;
      }
    }
    // TODO Handle trace open errors
    return undefined;
  }
}
export const traceManager = new TraceManager();