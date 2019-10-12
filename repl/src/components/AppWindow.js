/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { remote, ipcRenderer } from "electron";

const isDevelopment = process.env.NODE_ENV !== "production";

const { BrowserWindow } = remote;

const DEFAULT_HOST = "flok-hub.herokuapp.com";
const DEFAULT_PORT = 443;
const DEFAULT_REPL = "tidal";
const DEFAULT_SECURE = true;

const KNOWN_REPLS = ["tidal", "sclang", "foxdot"];

const REPLS = {
  tidal: { name: "TidalCycles" },
  sclang: { name: "SuperCollider" },
  foxdot: { name: "FoxDot" }
};

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      host: DEFAULT_HOST,
      port: DEFAULT_PORT,
      secure: DEFAULT_SECURE,
      repl: DEFAULT_REPL,
      starting: false
    };

    this.replWindows = {};

    this.onTextChange = this.onTextChange.bind(this);
    this.onCheckboxChange = this.onCheckboxChange.bind(this);
    this.onClose = this.onClose.bind(this);
    this.onStart = this.onStart.bind(this);
  }

  onTextChange(e) {
    const { id, value } = e.target;
    this.setState({ [id]: value });
  }

  onCheckboxChange(e) {
    const { id, checked } = e.target;
    this.setState({ [id]: checked });
  }

  // eslint-disable-next-line class-methods-use-this
  onClose() {
    const window = remote.getCurrentWindow();
    window.close();
  }

  onStart() {
    this.setState({ starting: true });

    const replWindow = new BrowserWindow({
      webPreferences: { nodeIntegration: true },
      parent: remote.getCurrentWindow(),
      width: 640,
      height: 480,
      frame: false,
      show: false
    });

    const id = this.replWindows.length;
    this.replWindows[id] = replWindow;

    if (isDevelopment) {
      replWindow.loadURL(
        `http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}?route=repl`
      );
    } else {
      replWindow.loadURL(`file://${__dirname}/index.html?route=repl`);
    }

    replWindow.once("ready-to-show", () => {
      replWindow.show();
      this.setState({ starting: false });
    });

    replWindow.on("closed", () => {
      delete this.replWindows[id];
    });

    ipcRenderer.send("start-repl", this.state);
    ipcRenderer.on("data", (_event, arg) => {
      console.log("data", arg);
    });
  }

  render() {
    const { host, port, secure, repl, starting } = this.state;

    return (
      <div>
        <h1>flok REPL</h1>
        <form>
          <label htmlFor="host">
            Host
            <input
              id="host"
              type="text"
              value={host}
              onChange={this.onTextChange}
            />
          </label>

          <label htmlFor="port">
            Port
            <input
              id="port"
              type="text"
              value={port}
              onChange={this.onTextChange}
            />
          </label>

          <label htmlFor="secure">
            Secure?
            <input
              id="secure"
              type="checkbox"
              checked={secure}
              onChange={this.onCheckboxChange}
            />
          </label>

          <label htmlFor="repl">
            REPL
            <select id="repl" defaultValue={repl} onChange={this.onTextChange}>
              {KNOWN_REPLS.map(key => (
                <option key={key} value={key}>
                  {REPLS[key].name}
                </option>
              ))}
            </select>
          </label>

          <div className="buttons">
            <input
              type="button"
              value="Start"
              onClick={this.onStart}
              disabled={starting}
            />
            <input type="button" value="Close" onClick={this.onClose} />
          </div>
        </form>
      </div>
    );
  }
}

export default App;
