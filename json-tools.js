#!/usr/bin/env node

import yargs from 'yargs';
import fs from 'fs';

const argv = yargs(process.argv.slice(2))    
    .usage('$0 [-s] [-a <sort_array_keys>] [-n] [-f <input_file>] [-o <output_file>]')
    .option('s', { alias: 'sort-keys', describe: 'sort objects keys', type: 'boolean' })
    .option('a', { alias: 'sort-arrays', describe: 'sort arrays of objects comparing by given attributes, comma separated (e.g. "id,name")', type: 'string' })
    .option('n', { alias: 'remove-nulls', describe: 'remove attributes with null values', type: 'boolean'} )
    .option('f', { alias: 'input-file', describe: 'input from given file rather than from stdin', type: 'string' })
    .option('o', { alias: 'output-file', describe: 'output to given file rather than to stdout', type: 'string' })
    .example('$0 -s -a id -f in.json -o out.json', 'Read json from file in.json, sort objects keys, sort arrays of objects by object id, remove null attributes, write result to out.json.')
    .argv;

function run(argv) {        
    const inputStr = fs.readFileSync(argv['f'] || 0, 'utf-8');
    const inputJson = JSON.parse(inputStr);    
    
    const sortKeys = argv['s'];
    const sortArrKeys = argv['a'] ? argv['a'].split(',').map(s => s.trim()) : null;      
    const outputJson = processJson(inputJson, sortKeys, sortArrKeys);
    
    const replacer = argv['n'] ? ( (_k, v) => v != null ? v : undefined ) : null;
    const outputStr = JSON.stringify(outputJson, replacer, 2);
    fs.writeFileSync(argv['o'] || 1, outputStr);
}

function processJson(x, sortKeys, sortArrKeys) {    
    if (typeof x !== 'object' || !x) {
        return x;
    }
    if (Array.isArray(x)) {
        const sorted = sortArrKeys ? sortArray(x, sortArrKeys) : x;
        return sorted.map(i => processJson(i, sortKeys, sortArrKeys));
    }
    const keys = sortKeys ? Object.keys(x).sort() : Object.keys();
    return keys.reduce((o, k) => ({...o, [k]: processJson(x[k], sortKeys, sortArrKeys)}), {});
}

function sortArray(x, sortArrKeys) {    
    const cmpKeys = (a,b) => {        
        if (a == null) {
            return b != null ? 1 : 0;
        }
        if (b == null) {
            return a != null ? -1 : 0;
        }
        if (typeof a === 'number' && typeof b === 'number') {
            return a - b;
        }
        if (typeof a === 'string' && typeof b === 'string') {
            return a.localeCompare(b);
        }
        return 0;
    };
    const sorter = (o1,o2) => {
        for (const k of sortArrKeys) {
            const c = cmpKeys(o1[k], o2[k]);
            if (c !== 0) {
                return c;
            }                    
        }    
        return 0;
    }
    if (x.every(i => i && i.constructor === Object)) {        
        return x.sort(sorter);
    }
    return x;
}

run(argv);