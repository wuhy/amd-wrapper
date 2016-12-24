amd-wrapper
======

[![Dependency Status](https://david-dm.org/wuhy/amd-wrapper.svg)](https://david-dm.org/wuhy/amd-wrapper) [![devDependency Status](https://david-dm.org/wuhy/amd-wrapper/dev-status.svg)](https://david-dm.org/wuhy/amd-wrapper#info=devDependencies) [![NPM Version](https://img.shields.io/npm/v/amd-wrapper.svg?style=flat)](https://npmjs.org/package/amd-wrapper)

> A node utility to simple wrapping CommonJs file to AMD. Optionally, resolving the require module id to ensure the require id can work in AMD environment.

## How to use

### Install

```shell
npm install amd-wrapper --save
```
### Usage

```javasript
var amdWrap = require('amd-wrapper');

// only simple wrapping like this
// define(function (require, exports, module) { ... })
var result = amdWrap('code'); 

result = amdWrap('code', { // resolve require id
    resolveRequire: true, 
    filePath: 'a/b.js',
    requireConfig: {
        baseUrl: 'src',
        packages: []
    },
    projectRoot: 'root absolute path',
    componentDirName: 'dep'
});
```

### Options

* code `string`: the code to transform

* options `Object` `optional`: the options to transform

* options.resolveRequire `boolean` `optional`: whether resolve require module id to ensure the amd module loader require work, by default false

* options.filePath `string`: the file path host the code

* options.requireConfig `string|function():Object`: the amd require config

* options.projectRoot `string`: the project root absolute path, by default the execute directory currently

* ptions.componentDirName `string` `optional`: the directory to install the package to resolve, by default `node_modules`

* options.extensions `Array.<string>` `optional`: array of file extensions to search the require module in order, by default, `['.js']`

* checkUMD `boolean` `optional`: whether check `UMD` module style, if the code exists `UMD` define, the transform will ignore, by default `false`

* options.debug `boolean` `optional`: whether to output resolve fail module info, by default `false`


