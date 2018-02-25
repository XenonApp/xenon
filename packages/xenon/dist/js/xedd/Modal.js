'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _api = require('./api');

var _cache = require('../cache');

var cache = _interopRequireWildcard(_cache);

var _local_store = require('../local_store');

var localStore = _interopRequireWildcard(_local_store);

var _FileBrowser = require('./FileBrowser');

var _FileBrowser2 = _interopRequireDefault(_FileBrowser);

var _Form = require('./Form');

var _Form2 = _interopRequireDefault(_Form);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Modal extends _react2.default.Component {
    constructor(props) {
        super(props);

        this.connect = async config => {
            this.config = config;
            if (this.props.config) {
                cache.set('xeddConfig', config);
                await localStore.set('xeddConfig', config);
            } else {
                await localStore.set('xedd', config);
            }
            this.updateFiles('/');
        };

        this.handleInput = (input, e) => {
            this.setState({ [input]: e.target.value });
        };

        this.handleSelect = path => {
            this.props.onSelect({
                url: this.config.url,
                user: this.config.user,
                password: this.config.password,
                path: path
            });
        };

        this.updateFiles = async path => {
            let files;
            try {
                files = await (0, _api.readDir)(this.config.url, path, this.config.user, this.config.password);
            } catch (err) {
                return this.setState({ hint: err.message });
            }

            let back = false;
            if (path === this.paths[this.paths.length - 2]) {
                back = true;
                this.paths.pop();
            }

            if (path !== '/') {
                files.unshift({
                    title: '..',
                    key: 'back',
                    path: back ? this.paths[this.paths.length - 2] : this.paths[this.paths.length - 1]
                });
                if (!back) {
                    this.paths.push(path);
                }
            } else {
                this.paths = ['/'];
            }

            this.setState({ files });
        };

        this.config = null;
        this.paths = [];

        this.state = {
            files: []
        };
    }

    render() {
        return _react2.default.createElement(
            'div',
            { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
            _react2.default.createElement(
                'div',
                { style: { flex: '0 1 auto' } },
                _react2.default.createElement('img', { src: './img/zed-small.png', className: 'logo' }),
                this.props.config ? _react2.default.createElement(
                    'h1',
                    null,
                    'Setup Xedd Server and Select Configuration Directory'
                ) : _react2.default.createElement(
                    'h1',
                    null,
                    'Open Xedd Folder'
                )
            ),
            _react2.default.createElement(
                'div',
                { style: { position: 'absolute', top: '15px', right: '16px', fontSize: '14px' } },
                _react2.default.createElement(
                    'button',
                    null,
                    'What is this?'
                ),
                _react2.default.createElement(
                    'button',
                    { onClick: this.props.onSelect },
                    'Cancel'
                )
            ),
            _react2.default.createElement(_Form2.default, { config: this.props.config, onConnect: this.connect }),
            _react2.default.createElement(_FileBrowser2.default, { files: this.state.files, onClick: this.updateFiles, onSelect: this.handleSelect })
        );
    }
}

exports.default = Modal;
//# sourceMappingURL=Modal.js.map