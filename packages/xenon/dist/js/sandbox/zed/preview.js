'use strict';

module.exports = {
    showPreview: function (html, open) {
        require("../../preview").showPreview(html, open);
        return Promise.resolve();
    }
};
//# sourceMappingURL=preview.js.map