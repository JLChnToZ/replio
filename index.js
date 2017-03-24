const { app } = require('electron');
const TerminalHost = require('./lib/termhost');
const Shell = require('./lib/shellbase');
const ReplShell = require('./lib/shells/repl');
const TelnetShell = require('./lib/shells/telnet');

function createWindow(ShellType) {
  if(!ShellType) ShellType = ReplShell;
  const shell = new ShellType();
  const host = new TerminalHost(shell);
  if(ShellType === ReplShell)
    registerHelperToRepl(shell);
  return host;
}

function registerHelperToRepl(shell) {
  const console = shell.console;
  shell.repl.defineCommand('spawn', {
    help: 'Spawn a new REPL instance',
    action() {
      console.log('Spawning new REPL instance...');
      createWindow(ReplShell);
      this.displayPrompt();
    }
  });
  shell.repl.defineCommand('testing', {
    help: 'Open an empty echo shell window for testing',
    action() {
      console.log('Opening new window with devTools...');
      const host = createWindow(Shell);
      host.window.webContents.openDevTools();
      this.displayPrompt();
    }
  });
  shell.repl.defineCommand('telnet', {
    help: 'Connect to telnet host',
    action() {
      let host, port, encoding;
      Promise
      .resolve(new Promise(fufill => this.question('Remote Host: ', fufill)))
      .then(ans => { host = ans || 'localhost'; })
      .then(() => new Promise(fufill => this.question('Port (23): ', fufill)))
      .then(ans => { try { port = parseInt(ans) || 23; } catch(e) { port = 23; }})
      .then(() => new Promise(fufill => this.question('Encoding (utf8): ', fufill)))
      .then(ans => { encoding = ans || 'utf8'; })
      .then(() => {
        console.log(`Connecting to ${host}:${port} in ${encoding}...`)
        shell.attachedHost.pushShell(new TelnetShell(host, port, encoding));
        this.displayPrompt();
      })
      .catch(err => console.err(err.stack || err));
    }
  });
}

app.on('ready', createWindow.bind(this, null));

app.on('window-all-closed', () => {
  if(process.platform !== 'darwin')
    app.quit();
})

app.on('activate', () => {
  if(ShellHost.count() <= 0)
    createWindow();
});
