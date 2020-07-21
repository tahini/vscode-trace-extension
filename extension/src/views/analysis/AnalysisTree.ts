import * as vscode from 'vscode';
import * as path from 'path';
import { OutputDescriptor } from 'tsp-typescript-client/lib/models/output-descriptor';

export class AnalysisProvider implements vscode.TreeDataProvider<Analysis> {

  private descriptors: OutputDescriptor[] = [];
  private _onDidChangeTreeData: vscode.EventEmitter<Analysis | undefined> = new vscode.EventEmitter<Analysis | undefined>();
  readonly onDidChangeTreeData: vscode.Event<Analysis | undefined> = this._onDidChangeTreeData.event;

  getTreeItem(element: Analysis): vscode.TreeItem {
    return element;
  }

  getChildren(element?: Analysis): Thenable<Analysis[]> {
    if (element) {
      return Promise.resolve([]);
    } else {
      if (this.descriptors.length === 0) {
        return Promise.resolve([]);
      } else {
        return Promise.resolve(this.descriptors.map(d => new Analysis(d.name)));
      }
    }
  }

  refresh(descriptors: OutputDescriptor[]): void {
    this.descriptors = descriptors;
    this._onDidChangeTreeData.fire(undefined);
  }
}

class Analysis extends vscode.TreeItem {
  constructor(
    public readonly name: string,
  ) {
    super(name);
  }

  get tooltip(): string {
    return `${this.name}`;
  }

  get description(): string {
    return "";
  }

  iconPath = {
    light: path.join(__dirname, '..', '..', '..', 'resources', 'light', 'refresh.svg'),
    dark: path.join(__dirname, '..', '..', '..', 'resources', 'dark', 'refresh.svg')
  };
}