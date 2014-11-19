
module.exports = function (jade) {
    var isConstant = require('constantinople');
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

        if (code.block) {
            if (!code.buffer) this.buf.push('{');
            this.visit(code.block);
            if (!code.buffer) this.buf.push('}');
        }
    };

    jade.Compiler.prototype.attrs = function(attrs){
        var buf = []
          , classes = []
          , escaped = {}
          , constant = attrs.every(function (attr) { return isConstant(attr.val) })
          , inherits = false;

        if (this.terse) buf.push('terse: true');

        attrs.forEach(function(attr){
            if (attr.name == 'attributes') {
                return inherits = true;
            }

            var val = attr.val;
            if (!isConstant(val)) {
                if (attr.escaped) {
                    val = 'htmlspecialchars(' + val + ', ENT_QUOTES, \'UTF-8\')';
                }

                val = '"<?php echo ' + val + '; ?>"';
                escaped[attr.name] = false;
            } else {
                escaped[attr.name] = attr.escaped;
            }

            if (attr.name == 'class') {
                classes.push('(' + val + ')');
            } else {
                var pair = "'" + attr.name + "':(" + val + ')';
                buf.push(pair);
            }
        });

        if (classes.length) {
            buf.push('"class": [' + classes.join(',') + ']');
        }

        return {
            buf: buf.join(', '),
            escaped: JSON.stringify(escaped),
            inherits: inherits,
            constant: constant
        };
    };

};
