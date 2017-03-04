const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const Repl = require('repl');
const MemoryStream = require('memorystream');

const instances = {};

function getTTYStream() {
  const stream = new MemoryStream();
  stream.isTTY = stream.isRaw = true;
  return stream;
}

function createWindow() {
  const instance = {
    input: getTTYStream(),
    output: getTTYStream(),
    repl: null,
    win: new BrowserWindow({ width: 800, height: 600 })
  };
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
    pathname: path.join(__dirname, './static/index.html'),
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
  instance.repl = Repl.start({
    input: instance.input,
    output: instance.output
  }).on('close', () => {
    instance.repl = null;
    if(instance.win)
      instance.win.close();
  });
  instance.repl.defineCommand('spawn', {
    help: 'Spawn a new REPL instance',
    action() {
      createWindow();
      instance.output.write('Spawning new instance...\n', 'utf8');
      this.displayPrompt();
    }
  });
});

ipcMain.on('input', (e, data) => {
  const instance = instances[e.sender.id];
  if(!instance) return;
  instance.input.write(Buffer.from(data, 'utf8'));
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