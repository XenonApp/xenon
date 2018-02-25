'use strict';

const config = require('./config');

let apiProm;
if (CHROME) {
    apiProm = Promise.resolve({trackEvent: function() {}});
} else {
    apiProm = require("./analytics_tracker.nw")(config);
}
module.exports = apiProm;
