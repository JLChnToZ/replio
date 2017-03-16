const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const Repl = require('repl');
const MemoryStream = require('memorystream');

const instances = {};

function createWindow() {
  const instance = {
    input: new MemoryStream(),
    output: new MemoryStream(),
    repl: null,
    win: new BrowserWindow({ width: 800, height: 600 })
  };
  instance.input.isRaw = true;
  instance.output.isTTY = true;
  const id = instance.win.webContents.id;
  instances[id] = instance;
  instance.output.on('readable', () => {
    if(!instance.win) return;
    instance.win.webContents.send('output',
      instance.output.read()
      .toString('utf8')
      .replace(/\r\n|\r|\n/g, '\r\n')
    );
  });
  instance.win.setMenu(null);
  instance.win.loadURL(url.format({
    pathname: path.resolve(__dirname, './static/index.html'),
    protocol: 'file:',
    slashes: true
  }));
  instance.win.on('closed', () => {
    instance.win = null;
    if(instance.repl)
      instance.repl.close();
    delete instances[id];
  });
}

ipcMain.on('terminal-ready', (e) => {
  const instance = instances[e.sender.id];
  if(!instance) return;
  instance.output.write('\x1b[36;01mReplio Standalone\x1b[0m - An experimental REPL shell for Node.js/Electron\n', 'utf8');
  instance.output.write('Type `.help` for list of available commands\n\n', 'utf8');
  instance.repl = Repl.start(instance).on('close', () => {
    instance.repl = null;
    if(instance.win)
      instance.win.close();
  });
  instance.repl.defineCommand('spawn', {
    help: 'Spawn a new REPL instance',
    action() {
      instance.output.write('Spawning new instance...\n\n', 'utf8');
      createWindow();
      this.displayPrompt();
    }
  });
  instance.repl.defineCommand('devtools', {
    help: 'Open developer tools for current window',
    action(mode) {
      instance.output.write('Opening developer tools...\n\n', 'utf8');
      instance.win.webContents.openDevTools({ mode });
      this.displayPrompt();
    }
  });
});

ipcMain.on('input', (e, data) => {
  const instance = instances[e.sender.id];
  if(!instance) return;
  instance.input.write(Buffer.from(data, 'utf8'));
});

ipcMain.on('resize', (e, columns, rows) => {
  const instance = instances[e.sender.id];
  if(!instance) return;
  Object.assign(instance.output, { columns, rows });
  instance.output.emit('resize');
});

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if(process.platform !== 'darwin')
    app.quit();
})

app.on('activate', () => {
  for(let id in instances)
    return;
  createWindow();
});
