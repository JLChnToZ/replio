'use strict';
const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const TerminalHost = require('./lib/termhost');
const Shell = require('./lib/shellbase');
const ReplShell = require('./lib/shells/repl');

if(app.makeSingleInstance((argv, cwd) => createWindow(getArgv(argv), cwd)))
  return app.quit();

const shells = ((cmdsPath, pattern) =>
  fs.readdirSync(path.join(__dirname, cmdsPath))
  .filter(file => !!file.match(pattern))
  .map(file => require(`${cmdsPath}/${file}`))
  .sort((l, r) => r.priority - l.priority)
)('./lib/commands', /^repl-[\w-]+\.js$/);

function getArgv(argv) {
  if(!argv) argv = process.argv;
  argv.shift();
  if(process.defaultApp) argv.shift();
  return argv;
}

function createWindow(command, cwd) {
  command = command || '';
  let skip, shell;
  const skipFn = () => { skip = true; };
  for(const shellDef of shells) {
    skip = false;
    shell = shellDef.run(command, skipFn, cwd);
    if(!skip) break;
  }
  if(skip) {
    shell = new ReplShell();
    registerHelperToRepl(shell);
  }
  const host = new TerminalHost(shell);
  return host;
}

function registerHelperToRepl(shell) {
  const console = shell.console;
  shell.repl.defineCommand('spawn', {
    help: 'Spawn a new REPL instance',
    action() {
      console.log('Spawning new REPL instance...');
      createWindow();
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
  shells.forEach(s => s.register(shell));
}

const argv = getArgv();
const cwd = process.cwd();
const appdataPath = path.resolve(app.getPath('appData'), './replio');
if(!fs.existsSync(appdataPath)) fs.mkdirSync(appdataPath);
process.chdir(appdataPath);

app.on('ready', createWindow.bind(this, argv, cwd));

app.on('window-all-closed', () => {
  if(process.platform !== 'darwin')
    app.quit();
})

app.on('activate', () => {
  if(ShellHost.count() <= 0)
    createWindow(argv, cwd);
});
