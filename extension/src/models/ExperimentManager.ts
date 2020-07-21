import { Trace } from 'tsp-typescript-client/lib/models/trace';
import { TspClient } from 'tsp-typescript-client/lib/protocol/tsp-client';
import { Query } from 'tsp-typescript-client/lib/models/query/query';
import { Experiment } from 'tsp-typescript-client/lib/models/experiment';
import { TspClientResponse } from 'tsp-typescript-client/lib/protocol/tsp-client-response';
import { OutputDescriptor } from 'tsp-typescript-client/lib/models/output-descriptor';
import { tspClient } from '../tspClient';

export class ExperimentManager {
  /**
       * Open a given experiment on the server
       * @param experimentURI experiment URI to open
       * @param experimentName Optional name for the experiment. If not specified the URI name is used
       * @returns The opened experiment
       */
  async openExperiment(experimentName: string, traces: Array<Trace>): Promise<Experiment | undefined> {
    const name = experimentName;

    const traceURIs = new Array<string>();
    for (let i = 0; i < traces.length; i++) {
      traceURIs.push(traces[i].UUID);
    }

    const experimentResponse = await tspClient.createExperiment(new Query({
      'name': name,
      'traces': traceURIs
    }));
    const opendExperiment = experimentResponse.getModel();
    if (opendExperiment && experimentResponse.isOk()) {
      return opendExperiment;
    } else if (opendExperiment && experimentResponse.getStatusCode() === 409) {
      // Repost with a suffix as long as there are conflicts
      const handleConflict = async function (tspClient: TspClient, tryNb: number): Promise<TspClientResponse<Experiment>> {
        const suffix = '(' + tryNb + ')';
        return tspClient.createExperiment(new Query({
          'name': name + suffix,
          'traces': traceURIs
        }));
      };
      let conflictResolutionResponse = experimentResponse;
      let i = 1;
      while (conflictResolutionResponse.getStatusCode() === 409) {
        conflictResolutionResponse = await handleConflict(tspClient, i);
        i++;
      }
      const experiment = conflictResolutionResponse.getModel();
      if (experiment && conflictResolutionResponse.isOk()) {
        return experiment;
      }
    }
    // TODO Handle any other experiment open errors
    return undefined;
  }

  /**
 * Get an array of OutputDescriptor for a given experiment
 * @param experimentUUID experiment UUID
 */
  async getAvailableOutputs(experimentUUID: string): Promise<OutputDescriptor[] | undefined> {
    const outputsResponse = await tspClient.experimentOutputs(experimentUUID);
    return outputsResponse.getModel();
  }
}
export const experimentManager = new ExperimentManager();