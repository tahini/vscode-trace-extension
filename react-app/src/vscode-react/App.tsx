import * as React from 'react';
import './App.css';
import { Experiment } from 'tsp-typescript-client/lib/models/experiment';
import { TspClient } from 'tsp-typescript-client/lib/protocol/tsp-client';
import { OutputDescriptor } from 'tsp-typescript-client/lib/models/output-descriptor';
import { VsCodeSignalHandler } from './vscode-signal-handler';
import { TraceContextComponent } from '../trace-viewer/trace-context-component';


const logo = require("../logo.svg") as string;

interface TraceContextProps {
}

interface TraceContextState {
  experiment: Experiment | undefined;
  tspClient: TspClient | undefined;
  outputs: OutputDescriptor[];
}

class App extends React.Component<TraceContextProps, TraceContextState>  {
  private _signalHandler: VsCodeSignalHandler;

  constructor(props: TraceContextProps) {
    super(props);
    this.state = {
      experiment: undefined,
      tspClient: undefined,
      outputs: []
    };
    this._signalHandler = new VsCodeSignalHandler;
    window.addEventListener('message', event => {

      const message = event.data; // The JSON data our extension sent
      switch (message.command) {
        case "set-experiment":
          this.setState({experiment: message.data});
          break;
        case "set-tspClient":
          this.setState({tspClient: message.data});
          break;
        case "add-output":
          console.log("Adding outputs", message.data);
          this.setState({outputs: [...this.state.outputs, message.data] });
          break;
      }
    });
  }

  public render() {
    return (
      <div className="App">
        { this.state.experiment && this.state.tspClient && <TraceContextComponent 
          experiment={this.state.experiment} 
          tspClient={this.state.tspClient} 
          signalHandler={this._signalHandler}
          outputs={this.state.outputs}></TraceContextComponent>
        }
      </div>
    );
  }
}

export default App;
