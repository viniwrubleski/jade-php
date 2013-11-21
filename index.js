
module.exports = function (jade) {
    require('./lib/filters')(jade);
    require('./lib/compiler')(jade);
};
