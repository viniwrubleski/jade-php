module.exports = function (jade) {
    if (typeof jade === 'undefined') {
        jade = require('jade');
    }
    require('./lib/filters')(jade);
    require('./lib/compiler')(jade);
};
