'use strict';

var events = require("./lib/events");
var api = new events.EventEmitter(false);

window.eventbus = api;
module.exports = api;
