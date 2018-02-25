'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _api = require('./api');

var _local_store = require('../local_store');

var localStore = _interopRequireWildcard(_local_store);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Form extends _react2.default.Component {
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
            const config = {
                url: this.state.url,
                user: this.state.user,
                password: this.state.password
            };

            this.props.onConnect(config);
        };

        this.handleInput = (input, e) => {
            this.setState({ [input]: e.target.value });
        };

        this.state = {
            url: 'http://localhost:7337',
            user: '',
            password: '',
            hint: ''
        };
    }

    componentDidMount() {
        const key = this.props.config ? 'xeddConfig' : 'xedd';
        localStore.get(key).then(config => {
            if (config) {
                this.setState({
                    url: config.url,
                    user: config.user,
                    password: config.password
                });
            }
        });
    }

    render() {
        return _react2.default.createElement(
            'form',
            { style: { flex: '0 1 auto' } },
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
        );
    }
}

exports.default = Form;
//# sourceMappingURL=Form.js.map