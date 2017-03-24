'use strict';
const Repl = require('repl');
const TTYProxyShell = require('./ttyproxy');

class ReplShell extends TTYProxyShell {
  constructor() {
    super();
    const shell = this;
    const input = this.input, output = this.output;
    const console = this.console;
    console.log('\x1b[36;01mReplio Standalone\x1b[0m - An experimental REPL shell for Node.js/Electron');
    console.log('Type `.help` for list of available commands\n');

    const repl = this.repl = Repl.start(this);
    repl.on('close', this.end.bind(this));
    repl.defineCommand('devtools', {
      help: 'Open developer tools for current window',
      action(mode) {
        console.log('Opening developer tools...');
        if(shell.attachedHost)
          shell.attachedHost.window.webContents.openDevTools({ mode });
        this.displayPrompt();
      }
    });
  }
  close() {
    if(this.repl) this.repl.close();
  }
  end() {
    this.repl = null;
    super.end();
  }
  attach(host) {
    super.attach(host);
    host.window.setTitle('Replio Standalone - Electron (Node.js) REPL');
  }
}

module.exports = ReplShell;
