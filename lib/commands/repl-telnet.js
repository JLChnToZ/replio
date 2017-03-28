'use strict';
const TelnetShell = require('../shells/telnet');
const splitArgv = require('argv-split');

module.exports.priority = 3;

function parseAndConnect(command) {
  let host = 'localhost', port = 23, encoding = 'utf8';
  const argv = Array.isArray(command) ? command : splitArgv(command);
  switch(argv.length) {
    case 3: encoding = argv[2];
    case 2: port = parseInt(argv[1]);
    case 1: host = argv[0];
  }
  return new TelnetShell(host, port, encoding);
}

module.exports.register = function(shell) {
  const console = shell.console;
  shell.repl.defineCommand('telnet', {
    help: 'Connect to telnet host',
    action(command) {
      if(!command) {
        console.log('Usage: .telnet host [port] [encoding]');
        this.displayPrompt();
        return;
      }
      const telnetShell = parseAndConnect(command);
      console.log(`Connecting to ${telnetShell.host}:${telnetShell.port} in ${telnetShell.encoding}...`);
      shell.attachedHost.pushShell(telnetShell);
      this.displayPrompt();
    }
  });
};

module.exports.run = function(command, next) {
  command = Array.isArray(command) ? command : splitArgv(command);
  if(!command.length || command[0] !== 'telnet')
    return next();
  command.shift();
  return parseAndConnect(command);
};
