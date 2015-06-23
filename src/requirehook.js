exports.install = function() {
    var path = require('path')
    var Module = require('module')

    // hook into _resolveFilename (used by `require`) to make it easier to include libs

    var resolveFilename = Module._resolveFilename;

    Module._resolveFilename = function( request, parent ) {
        return /^:/.test( request ) ?
            resolveFilename( path.join(__dirname, request.substr(1))) :
            resolveFilename( request, parent )
    };
}
