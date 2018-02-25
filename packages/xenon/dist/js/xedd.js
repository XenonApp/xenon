'use strict';

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _Modal = require('./xedd/Modal');

var _Modal2 = _interopRequireDefault(_Modal);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const api = {};

api.openConfig = function () {
    return new Promise(resolve => {
        _reactDom2.default.render(_react2.default.createElement(_Modal2.default, { config: true, onSelect: resolve }), document.getElementById('modal'));
    });
};

api.open = function () {
    var el = $("<div id='modal' class='modal-view'></div>");
    $("body").append(el);
    return new Promise(resolve => {
        function select(res) {
            el.remove();
            resolve(res);
        }

        _reactDom2.default.render(_react2.default.createElement(_Modal2.default, { onSelect: select }), document.getElementById('modal'));
    });
};

module.exports = api;
//# sourceMappingURL=xedd.js.map