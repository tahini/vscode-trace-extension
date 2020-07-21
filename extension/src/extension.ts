'use strict';
import * as vscode from 'vscode';
import { TracesProvider, traceHandler } from "./views/traces/TracesTree";
import { AnalysisProvider } from "./views/analysis/AnalysisTree";

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

}