var callsite = require('callsite')
var swig = require('swig')
var path = require('path')
var _ = require('lodash')
var moment = require('moment')
var fs = require('fs')

var fontCss = fs.readFileSync(path.join(__dirname, './css/font.css'), 'utf8')
var headerHTML = fs.readFileSync(path.join(__dirname, './templates/header.html'), 'utf8')

module.exports = function(conf) {
    swig.setDefaults({ cache: false });

    function relativeDate(date) { return moment(date).fromNow(); }
    swig.setFilter('relativeDate', relativeDate);

    function render(templateName, context) {
        context = _.extend(context || {}, {config: conf, fontCss: fontCss, header: headerHTML});
        var stack = callsite();
        var requester = stack[1].getFileName();
        var callerDir = path.dirname(requester);
        var templatePath = path.join(callerDir, templateName);

        return swig.renderFile(templatePath, context);
    }

    return render;
}
