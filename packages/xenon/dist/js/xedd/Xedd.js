'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _styledComponents = require('styled-components');

var _styledComponents2 = _interopRequireDefault(_styledComponents);

var _api = require('./api');

var _cache = require('../cache');

var cache = _interopRequireWildcard(_cache);

var _local_store = require('../local_store');

var localStore = _interopRequireWildcard(_local_store);

var _FileBrowser = require('./FileBrowser.jsx');

var _FileBrowser2 = _interopRequireDefault(_FileBrowser);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Modal extends _react2.default.Component {
    constructor(props) {
        super(props);

        this.connect = async e => {
            e.preventDefault();
            if (this.state.url.indexOf('http') !== 0) {
                this.setState({ hint: 'The url must start with http' });
            }
            try {
                await (0, _api.getVersion)(this.state.url, this.state.user, this.state.password);
            } catch (err) {
                return this.setState({ hint: err.message });
            }
            cache.set('url', this.state.url);
            cache.set('user', this.state.user);
            cache.set('password', this.state.password);
            await localStore.set('xedd', {
                url: this.state.url,
                user: this.state.user,
                password: this.state.password
            });
            this.updateFiles('/');
        };

        this.handleInput = (input, e) => {
            this.setState({ [input]: e.target.value });
        };

        this.updateFiles = async path => {
            let files;
            try {
                files = await (0, _api.readDir)(this.state.url, path, this.state.user, this.state.password);
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

        this.paths = [];

        this.state = {
            url: 'http://localhost:7337',
            user: '',
            password: '',
            hint: '',
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
                _react2.default.createElement(
                    'h1',
                    null,
                    'Setup Xedd Server and Select Configuration Directory'
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
                    { onSelect: this.props.onSelect },
                    'Cancel'
                )
            ),
            _react2.default.createElement(
                'form',
                { id: 'zedd-form', style: { flex: '0 1 auto' } },
                _react2.default.createElement('input', { type: 'text', onChange: this.handleInput.bind(this, 'url'), style: { width: '40%', marginRight: '5px' }, placeholder: 'URL', value: this.state.url }),
                _react2.default.createElement('input', { style: { marginTop: '2px', width: '20%', marginRight: '5px' }, type: 'text', placeholder: 'Username', onChange: this.handleInput.bind(this, 'user'), value: this.state.user }),
                _react2.default.createElement('input', { style: { marginTop: '2px', width: '20%', marginRight: '5px' }, type: 'password', placeholder: 'Password', onChange: this.handleInput.bind(this, 'password'), value: this.state.password }),
                _react2.default.createElement(
                    'button',
                    { onClick: this.connect },
                    'Connect'
                ),
                this.state.hint ? _react2.default.createElement(
                    'div',
                    { style: { color: 'red' } },
                    this.state.hint
                ) : null
            ),
            _react2.default.createElement(_FileBrowser2.default, { files: this.state.files, onClick: this.updateFiles, onSelect: this.props.onSelect })
        );
    }
}

exports.default = Xedd;
//# sourceMappingURL=Xedd.js.map