'use strict';

const config = require('./config');
const configFs = require('./config_fs');
const db = require('./db');
const fs = require('./fs');
const http = require('./http');
const index = require('./index');
const preview = require('./preview');
const session = require('./session');
const symbol = require('./symbol');
const ui = require('./ui');
const util = require('./util');

global.xenon = {
    config,
    configFs,
    db,
    fs,
    http,
    index,
    preview,
    session,
    symbol,
    ui,
    util,
    lib: {
        async: require('./lib/async'),
        beautify: require('./lib/beautify'),
        treehugger: {
            traverse: require('./lib/treehugger/traverse'),
            python: {
                parse: require('./lib/treehugger/python/parse'),
                skulpt: require('./lib/treehugger/python/skulpt.min')
            }
        }
    }
};