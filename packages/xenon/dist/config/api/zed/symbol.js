'use strict';

module.exports = {
    updateSymbols: function (path, symbols) {
        return sandboxRequest("zed/symbol", "updateSymbols", [path, symbols]);
    },
    getSymbols: function (opts) {
        return sandboxRequest("zed/symbol", "getSymbols", [opts]);
    }
};
//# sourceMappingURL=symbol.js.map