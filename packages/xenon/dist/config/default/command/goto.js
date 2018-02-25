"use strict";

var session = xenon.session;

module.exports = function (info) {
    session.goto(info.destination);
};
//# sourceMappingURL=goto.js.map