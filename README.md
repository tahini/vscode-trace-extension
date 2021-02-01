# VSCode Trace Extension

This project started from the [vscode webview react project](https://github.com/rebornix/vscode-webview-react). It works this way, with the extension itself being in the `ext-src` directory and the react application being in the `src` directory.

## Installation instructions

Migrated the code from the prototype to this repository

It depends on the trace viewer plugins from the [theia trace extension package](https://github.com/theia-ide/theia-trace-extension/). So it needs to be cloned and built before building the vscode extension.

```
git clone git@github.com:theia-ide/theia-trace-extension.git
cd theia-trace-extension
yarn
```

Then from this repo, add symlinks to the trace viewer packages after having run `yarn` on the project

```
yarn
mkdir node_modules/@trace-viewer
cd node_modules/@trace-viewer
ln -s /path/to/theia-trace-extension/packages/base ./
ln -s /path/to/theia-trace-extension/packages/react-components ./
cd ../..
```

After making changes on this repo and before running the vscode extension, run the `yarn build` command

```
yarn build
```

## Running the extension

Then from vscode, press `f5` to run the extension.

For now, only traces at the root of the workspace will be 

Open the `Trace Explorer` view (`View` -> `Open view...`).

Only the directories at the root of the folder are considered as traces and will appear under `Traces` in the Trace Explorer.

To open the trace, click on the icon link at the right of the view, next to the selected trace

The analysis tab should be populated. Again, click on the icon to open the view in the webview panel.

_It is still a prototype, don't try anything fancy._