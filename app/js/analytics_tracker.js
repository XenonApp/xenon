'use strict';

const config = require('./config');

var apiProm = require("./analytics_tracker.nw")(config);
module.exports = apiProm;
