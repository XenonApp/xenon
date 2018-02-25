"use strict";

var session = xenon.session;
var preview = xenon.preview;

module.exports = function (data) {
   return session.getText(data.path).then(function (text) {
      return preview.showPreview(text);
   });
};
//# sourceMappingURL=preview.js.map