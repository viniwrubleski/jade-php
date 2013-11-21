
module.exports = function (jade) {
    if (!jade) {
        jade = require('jade');
    }

    // Precisa sobrescrever para retirar validação JS
    jade.Lexer.prototype.code = function () {
        var captures;
        if (captures = /^(!?=|-)[ \t]*([^\n]+)/.exec(this.input)) {
            this.consume(captures[0].length);
            var flags = captures[1];
            captures[1] = captures[2];
            var tok = this.tok('code', captures[1]);
            tok.escape = flags.charAt(0) === '=';
            tok.buffer = flags.charAt(0) === '=' || flags.charAt(1) === '=';
            // if (tok.buffer) assertExpression(captures[1])
            return tok;
        }
    };

    jade.Compiler.prototype.visitCode = function (code) {
        var val = code.val;

        if (code.buffer) {
            if (code.escape) {
                val = 'htmlspecialchars(' + val + ', ENT_QUOTES, \'UTF-8\')';
            }

            val = 'echo ' + val + ';'
        }

        this.buffer('<?php ' + val + ' ?>');
    };

};
