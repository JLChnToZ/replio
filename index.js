const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const TerminalHost = require('./lib/termhost');
const Shell = require('./lib/shellbase');
const ReplShell = require('./lib/shells/repl');

if(process.execPath.indexOf('electron-prebuilt') > -1)
  require('electron-local-crash-reporter').start();

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
  const commandsPath = './lib/commands';
  fs.readdirSync(path.join(__dirname, commandsPath))
  .forEach(file => require(`${commandsPath}/${file}`)(shell));
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
