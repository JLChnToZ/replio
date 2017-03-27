'use strict';
const TelnetShell = require('../shells/telnet');
const splitArgv = require('argv-split');

module.exports = function(shell) {
  const console = shell.console;
  shell.repl.defineCommand('telnet', {
    help: 'Connect to telnet host',
    action(command) {
      if(!command) {
        console.log('Usage: .telnet host [port] [encoding]');
        this.displayPrompt();
        return;
      }
      let host = 'localhost', port = 23, encoding = 'utf8';
      const argv = splitArgv(command);
      switch(argv.length) {
        case 3: encoding = argv[2];
        case 2: port = parseInt(argv[1]);
        case 1: host = argv[0];
      }
      console.log(`Connecting to ${host}:${port} in ${encoding}...`);
      shell.attachedHost.pushShell(new TelnetShell(host, port, encoding));
      this.displayPrompt();
    }
  });
};
