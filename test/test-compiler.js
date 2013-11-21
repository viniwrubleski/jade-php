var assert = require('assert');
var jade = require('jade');
require('../lib/compiler.js')(jade);

describe('php compiler', function () {
    it('should compile lines', function () {
        var html = jade.render('- echo \'teste\';');
        assert.equal(html, '<?php echo \'teste\'; ?>');
    });

    describe('should replace', function () {
        it('escaped values', function () {
            var html = jade.render('title= \'teste\'');
            assert.equal(html, '<title><?php echo htmlspecialchars(\'teste\', ENT_QUOTES, \'UTF-8\'); ?></title>');
        });

        it('unescaped values', function () {
            var html = jade.render('title!= \'teste\'');
            assert.equal(html, '<title><?php echo \'teste\'; ?></title>');
        });
    });
});
