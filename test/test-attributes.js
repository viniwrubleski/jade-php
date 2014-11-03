var assert = require('assert');
var jade = require('jade');
require('../lib/compiler.js')(jade);

describe('php attribute compiler', function () {
    it('should compile attributes', function () {
        var html = jade.render('a(href=test(), id!=test2(), data-teste="teste") Test');
        assert.equal(html, '<a href="<?php echo htmlspecialchars(test(), ENT_QUOTES, \'UTF-8\'); ?>" id="<?php echo test2(); ?>" data-teste="teste">Test</a>');
    });
});
