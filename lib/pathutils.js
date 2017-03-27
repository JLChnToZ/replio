'use strict';
const path = require('path');
const fs = require('fs');

function* getPaths() {
  yield process.cwd();
  yield* process.env.PATH.split(path.delimiter);
}

function resolve(targetPath) {
  for(const basePath of getPaths()) {
    const resolvedPath = path.resolve(basePath, targetPath);
    if(fs.existsSync(resolvedPath)) return resolvedPath;
  }
  throw new Error(`"${targetPath}" does not exist.`);
}

module.exports.resolve = resolve;
