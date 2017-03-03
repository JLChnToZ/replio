(function() {
  'use strict';
  const fs = require('fs');
  const http = require('http');
  const repl = require('repl');
  const express = require('express');
  const websocketStream = require('websocket-stream');

  function run(options) {
    options = options || {};
    const app = express();
    const server = http.createServer(app);
    websocketStream.createServer(Object.assign({ server, path: '/' }, options.ws || {}), (stream) => {
      // Tell a lie to readable: let it treat the stream as TTY.
      stream.isTTY = true;
      stream.isRaw = true;
      stream.setRawMode = (mode) => {
        stream.isRaw = mode;
      };
      const instance = repl.start(Object.assign({ input: stream, output: stream }, options.repl || {}));
      let closed = false;
      stream.on('close', () => {
        if(closed) return;
        closed = true;
        instance.close();
      });
      instance.on('close', () => {
        if(closed) return;
        closed = true;
        stream.end();
      });
    });
    app.use(express.static('static'));
    server.listen(options.port || 9999);
  };

  if(require.main === module) {
    const configPath = './config.json';
    run(fs.existsSync(configPath) && JSON.parse(fs.readFileSync(configPath, 'utf8')));
  } else {
    module.exports = run;
  }
})();
