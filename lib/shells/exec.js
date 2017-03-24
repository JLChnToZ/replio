'use strict'
const readline = require('readline');
const splitArgv = require('argv-split');
const pty = require('node-pty');
const Shell = require('../shellbase');

class ExecShell extends Shell {
  constructor(command, cwd, env) {
    super();
    const argv = splitArgv(command);
    env = env || process.env;
    this.proc = pty.spawn(argv.shift(), argv, {
      name: 'xterm-color',
      cols: 80, rows: 30,
      cwd, env
    });
    this.proc.on('data', this.read.bind(this));
    this.proc.on('exit', this.end.bind(this));
    this.proc.on('error', err => console.error(err.stack || err));
  }
  read(data) {
    if(!data || !data.length) return;
    if(this.attachedHost) {
      this.attachedHost.write(data);
      return;
    }
    if(!this.bufferedData)
      this.bufferedData = [];
    this.bufferedData.push(data);
  }
  write(buffer) {
    if(buffer instanceof Buffer)
      buffer = buffer.toString('utf8');
    buffer = buffer.replace(/\r\n|(?!\r)\n/, '\r');
    if(this.proc) this.proc.write(buffer);
  }
  resize(columns, rows) {
    super.resize(columns, rows);
    setImmediate(() => {
      if(this.proc) this.proc.resize(columns, rows);
    });
  }
  close() {
    if(this.proc) this.proc.kill();
  }
  end() {
    if(this.proc) this.proc.destroy();
    this.proc = null;
    super.end();
  }
  attach(host) {
    super.attach(host);
    if(this.bufferedData) {
      this.read(Buffer.concat(this.bufferedData));
      this.bufferedData = null;
    }
  }
}

module.exports = ExecShell;
