/**
 * Inputs: lines, cursor
 */
module.exports = function(info) {
    var command = info.inputs.lines[info.inputs.cursor.row].match(/^   `(.*)`$/)[1];
    if (command) {
        xenon.session.callCommand(info.path, command);
    }
};
