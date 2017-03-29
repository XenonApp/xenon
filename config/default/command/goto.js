var session = xenon.session;

module.exports = function(info) {
    session.goto(info.destination);
};
