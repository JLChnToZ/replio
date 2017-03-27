'use strict';
const path = require('path');
const fs = require('fs');
const os = require('os');

function getPathsBuilder() {
  let _cwd, _path;
  return function* () {
    if(!_cwd) _cwd = process.cwd();
    yield _cwd;
    if(!_path) _path = process.env.PATH.split(path.delimiter);
    yield* _path;
  };
}

// Workaround for Windows executable extensions matching
function getExtensionsBuilder(targetPath) {
  const tryExt = os.platform() !== 'win32' || path.extname(targetPath).length;
  let _pathext;
  return function* () {
    if(tryExt) {
      yield targetPath;
      return;
    }
    if(!_pathext) _pathext = process.env.PATHEXT.split(path.delimiter);
    for(const ext of _pathext) yield targetPath + ext;
    yield targetPath;
  };
}

function resolve(targetPath) {
  const getPaths = getPathsBuilder();
  const getExtensions = getExtensionsBuilder(targetPath);
  for(const basePath of getPaths())
    for(const extPath of getExtensions()) {
      const resolvedPath = path.resolve(basePath, extPath);
      if(fs.existsSync(resolvedPath)) {
        const stats = fs.statSync(resolvedPath);
        if(stats.isFile()) return resolvedPath;
      }
    }
  throw new Error(`"${targetPath}" does not exist.`);
}

module.exports.resolve = resolve;
