
module.exports = function (jade) {
    var isConstant = require('constantinople');
    if (!jade) {
        jade = require('jade');
    }

    var characterParser = require('character-parser');

    function assertExpression(exp) {
        // this verifies that a JavaScript expression is valid
        // Fix this for php
        return true;
    }
    function assertNestingCorrect(exp) {
        //this verifies that code is properly nested, but allows
        //invalid JavaScript such as the contents of `attributes`
        var res = characterParser(exp)
        if (res.isNesting()) {
            throw new Error('Nesting must match on expression `' + exp + '`')
        }
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

    jade.Lexer.prototype.attrs = function() {
        if ('(' == this.input.charAt(0)) {
            var index = this.bracketExpression().end
                , str = this.input.substr(1, index-1)
                , tok = this.tok('attrs')
                , equals = this.colons ? ':' : '=';

            if (equals === ':') {
                console.warn('`:` in jade is deprecated, please use `=`');
            }

            assertNestingCorrect(str);

            var quote = '';
            function interpolate(attr) {
                return attr.replace(/(\\)?#\{(.+)/g, function(_, escape, expr){
                    if (escape) return _;
                    try {
                        var range = characterParser.parseMax(expr);
                        if (expr[range.end] !== '}') return _.substr(0, 2) + interpolate(_.substr(2));
                        assertExpression(range.src)
                        return quote + " + (" + range.src + ") + " + quote + interpolate(expr.substr(range.end + 1));
                    } catch (ex) {
                        return _.substr(0, 2) + interpolate(_.substr(2));
                    }
                });
            }

            this.consume(index + 1);
            tok.attrs = {};
            tok.escaped = {};

            var escapedAttr = true
            var key = '';
            var val = '';
            var interpolatable = '';
            var state = characterParser.defaultState();
            var loc = 'key';
            function isEndOfAttribute(i) {
                if (key.trim() === '') return false;
                if (i === str.length) return true;
                if (loc === 'key') {
                    if (str[i] === ' ' || str[i] === '\n') {
                        for (var x = i; x < str.length; x++) {
                            if (str[x] != ' ' && str[x] != '\n') {
                                if (str[x] === '=' || str[x] === '!' || str[x] === ',') return false;
                                else return true;
                            }
                        }
                    }
                    return str[i] === ','
                } else if (loc === 'value' && !state.isNesting()) {
                    try {
                        Function('', 'return (' + val + ');');
                        if (str[i] === ' ' || str[i] === '\n') {
                            for (var x = i; x < str.length; x++) {
                                if (str[x] != ' ' && str[x] != '\n') {
                                    if (characterParser.isPunctuator(str[x]) && str[x] != '"' && str[x] != "'") return false;
                                    else return true;
                                }
                            }
                        }
                        return str[i] === ',';
                    } catch (ex) {
                        return false;
                    }
                }
            }
            for (var i = 0; i <= str.length; i++) {
                if (isEndOfAttribute(i)) {
                    val = val.trim();
                    if (val) assertExpression(val)
                    key = key.trim();
                    key = key.replace(/^['"]|['"]$/g, '');
                    tok.escaped[key] = escapedAttr;
                    tok.attrs[key] = '' == val ? true : val;
                    key = val = '';
                    loc = 'key';
                    escapedAttr = false;
                } else {
                    switch (loc) {
                        case 'key-char':
                            if (str[i] === quote) {
                                loc = 'key';
                                if (i + 1 < str.length && [' ', ',', '!', equals, '\n'].indexOf(str[i + 1]) === -1)
                                    throw new Error('Unexpected character ' + str[i + 1] + ' expected ` `, `\\n`, `,`, `!` or `=`');
                            } else if (loc === 'key-char') {
                                key += str[i];
                            }
                            break;
                        case 'key':
                            if (key === '' && (str[i] === '"' || str[i] === "'")) {
                                loc = 'key-char';
                                quote = str[i];
                            } else if (str[i] === '!' || str[i] === equals) {
                                escapedAttr = str[i] !== '!';
                                if (str[i] === '!') i++;
                                if (str[i] !== equals) throw new Error('Unexpected character ' + str[i] + ' expected `=`');
                                loc = 'value';
                                state = characterParser.defaultState();
                            } else {
                                key += str[i]
                            }
                            break;
                        case 'value':
                            state = characterParser.parseChar(str[i], state);
                            if (state.isString()) {
                                loc = 'string';
                                quote = str[i];
                                interpolatable = str[i];
                            } else {
                                val += str[i];
                            }
                            break;
                        case 'string':
                            state = characterParser.parseChar(str[i], state);
                            interpolatable += str[i];
                            if (!state.isString()) {
                                loc = 'value';
                                val += interpolate(interpolatable);
                            }
                            break;
                    }
                }
            }

            if ('/' == this.input.charAt(0)) {
                this.consume(1);
                tok.selfClosing = true;
            }

            return tok;
        }
    },

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
