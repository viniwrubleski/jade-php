
module.exports = function (jade) {
    if (!jade) {
        jade = require('jade');
    }

    jade.filters.php = function (text) {
        return '<?php ' + text + ' ?>';
    };
};
