import { ISignalHandler } from '../utils/ISignalHandler';

// eslint-disable-next-line
interface vscode {
    postMessage(message: any): void;
}

// declare function acquireVsCodeApi(): vscode;
declare const vscode: vscode;

export class VsCodeSignalHandler implements ISignalHandler {

}