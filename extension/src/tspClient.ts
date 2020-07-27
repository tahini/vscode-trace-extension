import { TspClient } from 'tsp-typescript-client/lib/protocol/tsp-client';
import * as vscode from 'vscode';

function createTspClient() {
    const tsConfig = vscode.workspace.getConfiguration('trace-compass.traceserver');
    let traceServerUrl = tsConfig.get<string>("url");
    return new TspClient(traceServerUrl);
}

export function updateTspClient() {
    tspClientInstance = createTspClient();
}

let tspClientInstance = createTspClient();

export const tspClient = () => tspClientInstance;