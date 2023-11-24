const hermesParser = require('hermes-parser');
const {transformFromAstSync} = require('@babel/core');
const fs = require('fs');

module.exports = {
    transform,
    setup,
}

let hasSetup = false;

function setup() {
    hasSetup = true;
    const sourceAst = hermesParser.parse("'use strict';", {
        babel: true,
        sourceType: 'unambiguous',
    })
    transformFromAstSync(sourceAst, null, {
        configFile: false,
        presets: ['@babel/preset-env']
    });
}

async function transform(filename) {
    if (!hasSetup) {
        throw new Error('Not set up');
    }
    const start = performance.now();
    const src = await fs.promises.readFile(filename, 'utf8');
    const readFileTime = performance.now() - start;

    try {
    const sourceAst = hermesParser.parse(src, {
        babel: true,
        sourceType: 'unambiguous',
    })
    const parseTime = performance.now() - readFileTime - start;
    const result = transformFromAstSync(sourceAst, null, {
        configFile: false,
        presets: ['@babel/preset-env']
    });
    const transformTime = performance.now() - (parseTime + readFileTime + start);

    return {
        result: result?.code,
        extra: {
            parseTime,
            readFileTime,
            transformTime,
            workerTime: performance.now() - start,
        }
    };
    } catch (error) {
        return {
            error: error.message
        }
    }
}