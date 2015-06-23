var callsite = require('callsite')
var swig = require('swig')
var path = require('path')
var _ = require('lodash')
var moment = require('moment')

module.exports = function(conf) {
    swig.setDefaults({ cache: false });

    function relativeDate(date) { return moment(date).fromNow(); }
    swig.setFilter('relativeDate', relativeDate);

    module.exports = render;

    function render(templateName, context) {
        context = _.extend(context || {}, {config: conf});
        var stack = callsite(),
            requester = stack[1].getFileName(),
            callerDir = path.dirname(requester),
            templatePath = path.join(callerDir, templateName);

        return swig.renderFile(templatePath, context);
    }

    return render;
}
