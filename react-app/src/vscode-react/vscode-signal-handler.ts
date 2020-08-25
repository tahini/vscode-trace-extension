import { ISignalHandler } from '../utils/ISignalHandler';

interface vscode {
    postMessage(message: any): void;
}

// declare function acquireVsCodeApi(): vscode;
declare const vscode: vscode;

export class VsCodeSignalHandler implements ISignalHandler {

}