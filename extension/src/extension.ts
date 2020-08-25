'use strict';
import * as vscode from 'vscode';
import { TracesProvider, traceHandler } from "./views/traces/TracesTree";
import { AnalysisProvider, analysisHandler } from "./views/analysis/AnalysisTree";
import { updateTspClient } from "./tspClient";

export function activate(context: vscode.ExtensionContext) {

  vscode.window.createTreeView('traces', {
    treeDataProvider: new TracesProvider(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : "")
  });
  const analysisProvider = new AnalysisProvider();
  vscode.window.createTreeView('analysis', {
    treeDataProvider: analysisProvider
  });
  const handler = traceHandler(analysisProvider);

  context.subscriptions.push(vscode.commands.registerCommand("traces.openTrace", (trace) => {
    handler(context, trace);
  }));

  context.subscriptions.push(vscode.commands.registerCommand("outputs.openOutput", (output) => {
    analysisHandler(context, output);
  }));

  // Listening to configuration change for the trace server URL
	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {

		if (e.affectsConfiguration('trace-compass.traceserver.url') || e.affectsConfiguration('trace-compass.traceserver.apiPath')) {
      updateTspClient();
		}

	}));

}