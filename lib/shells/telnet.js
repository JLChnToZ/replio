'use strict';
const net = require('net');
const iconv = require('iconv-lite');
const Shell = require('../shellbase');

class TelnetShell extends Shell {
  constructor(host, port, encoding) {
    super();
    this.encoding = encoding || 'utf8';
    const conn = net.connect(port || 23, host || '127.0.0.1');
    conn.on('connect', this.connect.bind(this));
    conn.on('error', this.error.bind(this));
    conn.on('data', this.read.bind(this));
    conn.on('close', this.end.bind(this));
    this.conn = conn;
  }
  connect() {
    this.setTitle();
  }
  setTitle() {
    if(this.attachedHost && this.conn)
      this.attachedHost.window.setTitle(`telnet://${this.conn.remoteAddress}:${this.conn.remotePort}`);
  }
  error(err) {
    if(this.attachedHost)
      this.attachedHost.write(`\nError: ${err.stack || err}\n\n`);
    else
      console.error(err.stack || err);
  }
  read(data) {
    if(this.attachedHost) {
      if(this.encoding !== 'utf8')
        data = iconv.decode(data, this.encoding);
      this.attachedHost.write(data);
      return;
    }
    if(!this.bufferedData)
      this.bufferedData = [];
    this.bufferedData.push(data);
  }
  write(buffer) {
    if(this.encoding !== 'utf8') {
      if(buffer instanceof Buffer)
        buffer = iconv.decode(buffer, 'utf8');
      buffer = iconv.encode(buffer, this.encoding);
    }
    if(this.conn)
      this.conn.write(buffer);
  }
  close() {
    if(this.conn)
      this.conn.end();
  }
  end() {
    this.conn = null;
    super.end();
  }
  attach(host) {
    super.attach(host);
    this.setTitle();
    if(this.conn && this.conn.connecting) {
      this.conn.resume();
      if(this.bufferedData) {
        this.read(Buffer.concat(this.bufferedData));
        this.bufferedData = null;
      }
    }
  }
  detach(host) {
    super.detach(host);
    if(this.conn && this.conn.connecting)
      this.conn.pause();
  }
}

module.exports = TelnetShell;
