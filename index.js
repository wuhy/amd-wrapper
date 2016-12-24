/**
 * @file convert common js module to amd module
 * @author sparklewhy@gmail.com
 */

'use strict';

var path = require('path');

function normalize(sourcePath) {
    return sourcePath.replace(/\\/g, '/');
}

function getPackageConfigLocation(pkgName, currDir, requireConfig) {
    var baseUrl = requireConfig.baseUrl || '.';
    var packages = requireConfig.packages || [];

    var pkgConf = null;
    packages.some(function (item) {
        if (item.name === pkgName) {
            pkgConf = item;
            return true;
        }
    });

    if (!pkgConf) {
        return;
    }

    var basePath = path.resolve(currDir, baseUrl);
    return normalize(
        path.resolve(basePath, pkgConf.location || pkgName)
    );
}

function resolveRequireId(match, requireId, context, options) {
    var fullFilePath = context.fullFilePath;
    var componentDir = context.componentDir;
    var currDir = context.currDir;
    var componentDirPath = context.componentDirPath;

    var extensions = options.extensions || ['.js'];
    var requireConfig = options.requireConfig || {};
    if (typeof requireConfig === 'function') {
        requireConfig = requireConfig();
    }

    var result;
    var resolve = require('resolve');

    // relative id
    if (/^\./.test(requireId)) {
        var baseDir = normalize(path.dirname(fullFilePath));

        result = resolve.sync(requireId, {
            basedir: baseDir,
            moduleDirectory: componentDir,
            extensions: extensions
        });
        result = normalize(path.relative(baseDir, result)).replace(/\.js$/, '');
        if (!/^\./.test(result)) {
            result = './' + result;
        }

        return match.replace(requireId, result);
    }
    else if (requireId.split('/').length > 1) {
        var parts = requireId.split('/');
        if (parts.length <= 1) {
            // ignore require pkg name resolve, the resolve determined
            // by amd require.config
            return match;
        }

        var pkgName = parts.shift();
        var pkgLocation = getPackageConfigLocation(pkgName, currDir, requireConfig);
        if (!pkgLocation) {
            return match;
        }

        result = normalize(resolve.sync(requireId, {
            basedir: currDir,
            moduleDirectory: componentDir,
            extensions: extensions
        })).replace(componentDirPath, '').replace(/\.js$/, '');

        if (pkgLocation) {
            var pkgNameRegexp = new RegExp('^' + pkgName + '\/');
            pkgLocation = pkgLocation
                .replace(componentDirPath, '')
                .replace(pkgNameRegexp, '');
            result = result
                .replace(pkgNameRegexp, '')
                .replace(new RegExp('^' + pkgLocation + '\/'), '');
            result = pkgName + '/' + result;
        }
        return match.replace(requireId, result);
    }

    return match;
}

function transformRequirePath(content, options) {
    var currDir = normalize(options.projectRoot || process.cwd());
    var filePath = options.filePath;
    var fullFilePath = path.resolve(currDir, filePath);
    var componentDir = options.componentDirName || 'node_modules';
    var componentDirPath = normalize(path.join(currDir, componentDir, '/'));
    var debug = options.debug;

    return content.replace(
        /\Wrequire\(\s*(['"])([^'"]+)\1\s*\)/g,
        function (match, quot, requireId) {
            try {
                return resolveRequireId(match, requireId, {
                    currDir: currDir,
                    componentDir: componentDir,
                    componentDirPath: componentDirPath,
                    fullFilePath: fullFilePath
                }, options);
            }
            catch (ex) {
                debug && fis.log.warn('resolve %s in %s fail', requireId, filePath);

                // ignore resolve
                return match;
            }
        }
    );
}

/**
 * transform common js module to amd module code
 *
 * @param {string} code the code to transform
 * @param {Object=} options the options to transform
 * @param {boolean=} options.resolveRequire whether resolve require module id to
 *        ensure the amd module loader require work, by default false
 * @param {string} options.filePath the file path host the code
 * @param {string|function():Object} options.requireConfig the amd require config
 * @param {string=} options.projectRoot the project root absolute path, by default
 *        the execute directory currently
 * @param {string=} options.componentDirName the directory to install the package
 *        to resolve, by default `node_modules`
 * @param {Array.<string>=} options.extensions array of file extensions to search
 *        the require module in order, by default, ['.js']
 * @param {boolean=} options.debug whether to output resolve fail module info
 * @param {boolean=} options.checkUMD whether check `UMD` module style,
 *        if the code exists `UMD` define, the transform will ignore, by default false
 * @return {string}
 */
function transformToAMD(code, options) {
    if (!/^\s*define\s*\(\s*/.test(code)) {
        if (options && options.checkUMD) {
            // remove comment
            var tmp = code.replace(/(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg, '');
            // check whether has umd definition
            if (/\Wdefine\s*\(/.test(tmp)
                && /\Wdefine\.amd\W/.test(tmp)
            ) {
                return code;
            }
        }


        if (options && options.resolveRequire) {
            code = transformRequirePath(
                code, options
            );
        }

        return 'define(function (require, exports, module) {'
            + code + '\n});\n';
    }

    return code;
}

module.exports = exports = transformToAMD;


