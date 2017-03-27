'use strict';
const ExecShell = require('../shells/exec');

module.exports = function(shell) {
  const console = shell.console;
  shell.repl.defineCommand('exec', {
    help: 'Execute an external command',
    action(command) {
      if(!command) {
        console.log('Usage: .exec [cwd] command [arg0 [arg1 [arg2...]]]');
        this.displayPrompt();
        return;
      }
      try {
        console.log(`Execute "${command}"...`);
        shell.attachedHost.pushShell(new ExecShell(command));
      } catch(err) {
        console.log(err.stack || err);
      } finally {
        this.displayPrompt();
      }
    }
  });
};
