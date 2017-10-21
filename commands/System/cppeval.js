const { Command, util } = require('../../index');
const now = require('performance-now');
const fsn = require('fs-nextra');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            aliases: ['cppev', 'c++eval', 'c++ev'],
            permLevel: 10,
            mode: 2,

            usage: '<cppcode:string>',
            description: 'Evaluates arbitrary C++.'
        });
    }

    async run(msg, [args]) {
        const start = now();
        const { input } = this.parse(args);
        await fsn.outputFileAtomic('/bwd/cpp/eval.cpp', input);
        const error = await this.compile(start);
        if (error !== null) return msg.send(error);
        const { success, result } = await this.execute();
        return msg.send(`${success ? '⚙ **Compiled and executed:**' : '❌ **Error:**'} Took ${(now() - start).toFixed(5)}μs${util.codeBlock('cpp', result)}`);
    }

    compile(start) {
        return util.exec('g++ /bwd/cpp/eval.cpp -o /bwd/cpp/eval.out')
            .then(() => null)
            .catch(error => `Failed to compile (${(now() - start).toFixed(5)}μs). ${util.codeBlock('cpp', error)}`);
    }

    execute() {
        return util.exec('/bwd/cpp/eval.out')
            .then(result => ({ success: true, result: result.stdout }))
            .catch(error => ({ success: false, result: error }));
    }

    /**
     * Blep
     * @param {string} code The code to process
     * @returns {{ type: ('raw'|'function'), input: string }}
     */
    parse(code) {
        const params = code.split('\n');
        switch (params[0]) {
            case '--raw': return { type: 'raw', input: params.slice(1).join('\n') };
            case '--fn':
            case '--function': return { type: 'function', input: TEMPLATES.function(params.slice(1).join('\n')) };
            default: return { type: 'function', input: TEMPLATES.function(code) };
        }
    }

};

const TEMPLATES = {
    function: (code) => `
#include <iostream>

int main()
{
    ${code}

    return 0;
}
    `
};