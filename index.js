const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const Repl = require('repl');
const MemoryStream = require('memorystream');

let win, repl;

const input = new MemoryStream(), output = new MemoryStream();
// Tell the repl that these streams are raw TTY as hterm is handling these.
input.isTTY = input.isRaw = output.isTTY = output.isRaw = true;

app.on('ready', () => {
  win = new BrowserWindow({ width: 800, height: 600 });
  
  win.setMenu(null);
  
  ipcMain.on('terminal-ready', initIPC);

  win.loadURL(url.format({
    pathname: path.join(__dirname, './static/index.html'),
    protocol: 'file:',
    slashes: true
  }));

  win.on('closed', () => {
    win = null;
    if(repl) repl.close();
  });
});

function initIPC() {
  ipcMain.on('input', (e, a) => {
    input.write(Buffer.from(a, 'utf8'));
  });

  output.on('readable', () => {
    win.webContents.send('output', output.read().toString('utf8').replace(/\r\n|\r|\n/g, '\r\n'));
  });
  
  repl = Repl
  .start({ input, output })
  .on('close', () => {
    repl = null;
    if(win) win.close();
  });
}

app.on('window-all-closed', () => {
  if(process.platform !== 'darwin')
    app.quit();
})

app.on('activate', () => {
  if(win === null)
    createWindow();
});