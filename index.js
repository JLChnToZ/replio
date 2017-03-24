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
  shell.repl.defineCommand('.', {
    help: '',
    action(secret) {
      switch(secret) {
        case 'starwars': // Nothing but easter eggs
          new TerminalHost(new TelnetShell('towel.blinkenlights.nl'));
        break;
      }
      this.displayPrompt();
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
