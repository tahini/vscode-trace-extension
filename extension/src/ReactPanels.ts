import * as path from 'path';
import * as vscode from 'vscode';
import { Experiment } from 'tsp-typescript-client/lib/models/experiment';
import { getTspClient } from "./tspClient";
import { OutputDescriptor } from 'tsp-typescript-client/lib/models/output-descriptor';

// inspired by https://github.com/rebornix/vscode-webview-react
// TODO: manage mutiple panels (currently just a hack around, need to be fixed)

/**
 * Manages react webview panels
 */
export class ReactPanel {
	/**
	 * Track the currently panels. Only allow a single panel to exist at a time.
	 */
	public static activePanels = {} as {
		[key: string]: ReactPanel | undefined
	};

	private static readonly viewType = 'react';
	private static currentPanel: ReactPanel | undefined;

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionPath: string;
	private _disposables: vscode.Disposable[] = [];
	private _experiment: Experiment | undefined = undefined;

	public static createOrShow(extensionPath: string, name: string): ReactPanel {
		const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

		// If we already have a panel, show it.
		// Otherwise, create a new panel.
		let openedPanel = ReactPanel.activePanels[name];
		if (openedPanel) {
			openedPanel._panel.reveal(column);
		} else {
			openedPanel = new ReactPanel(extensionPath, column || vscode.ViewColumn.One, name);
			ReactPanel.activePanels[name] = openedPanel;
		}
		ReactPanel.currentPanel = openedPanel;
		return openedPanel;
	}

	public static addOutputToCurrent(descriptor: OutputDescriptor) {
		ReactPanel.currentPanel!.addOutput(descriptor);
	}

	private constructor(extensionPath: string, column: vscode.ViewColumn, name: string) {
		this._extensionPath = extensionPath;

		// Create and show a new webview panel
		this._panel = vscode.window.createWebviewPanel(ReactPanel.viewType, name, column, {
			// Enable javascript in the webview
			enableScripts: true,

			// And restric the webview to only loading content from our extension's `media` directory.
			localResourceRoots: [
				vscode.Uri.file(path.join(this._extensionPath, 'build/react-app'))
			]
		});

		// Post the tspTypescriptClient
		this._panel.webview.postMessage({command: "set-tspClient", data: getTspClient()});

		// Set the webview's initial html content 
		this._panel.webview.html = this._getHtmlForWebview();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programatically
		this._panel.onDidDispose(() => {
			this.dispose();
			ReactPanel.activePanels[name] = undefined;
			return this._disposables;

		});

		this._panel.onDidChangeViewState(e => {
			if (e.webviewPanel.active) {
				console.log("TODO: Fire panel active event");
			}
		});

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(message => {
			console.log("REceived a message", message);
			switch (message.command) {
				case 'alert':
					vscode.window.showErrorMessage(message.text);
					return;
			}
		}, null, this._disposables);
	}

	public doRefactor() {
		// Send a message to the webview webview.
		// You can send any JSON serializable data.
		this._panel.webview.postMessage({ command: 'refactor' });
	}

	public dispose() {
		// ReactPanel.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	setExperiment(experiment: Experiment) {
		this._experiment = experiment;
		this._panel.webview.postMessage({command: "set-experiment", data: experiment});
	}

	addOutput(descriptor: OutputDescriptor) {
		this._panel.webview.postMessage({command: "add-output", data: descriptor});
	}

	private _getHtmlForWebview() {
		const manifest = require(path.join(this._extensionPath, 'build/react-app', 'asset-manifest.json'));
		const mainScript = manifest.files['main.js'];
		const mainStyle = manifest.files['main.css'];

		const scriptPathOnDisk = vscode.Uri.file(path.join(this._extensionPath, 'build/react-app', mainScript));
		const scriptUri = scriptPathOnDisk.with({ scheme: 'vscode-resource' });
		const stylePathOnDisk = vscode.Uri.file(path.join(this._extensionPath, 'build/react-app', mainStyle));
		const styleUri = stylePathOnDisk.with({ scheme: 'vscode-resource' });

		// Use a nonce to whitelist which scripts can be run
		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
				<meta name="theme-color" content="#000000">
				<title>React App</title>
				<link rel="stylesheet" type="text/css" href="${styleUri}">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-resource: https:; script-src 'nonce-${nonce}';style-src vscode-resource: 'unsafe-inline' http: https: data:;">
				<base href="${vscode.Uri.file(path.join(this._extensionPath, 'build/react-app')).with({ scheme: 'vscode-resource' })}/">
			</head>

			<body>
				<noscript>You need to enable JavaScript to run this app.</noscript>
				<div id="root"></div>

				<script nonce="${nonce}">
					const vscode = acquireVsCodeApi();
				</script>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}

function getNonce() {
	let text = "";
	const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}