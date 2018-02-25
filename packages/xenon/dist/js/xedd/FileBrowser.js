'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _cache = require('../cache');

var cache = _interopRequireWildcard(_cache);

var _local_store = require('../local_store');

var localStore = _interopRequireWildcard(_local_store);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class FileBrowser extends _react2.default.Component {
    constructor(props) {
        super(props);

        this.handleClick = file => {
            this.setState({ selected: file.path });
        };

        this.handleDoubleClick = file => {
            this.props.onClick(file.path);
            this.setState({ selected: '' });
        };

        this.select = async () => {
            this.props.onSelect(this.state.selected);
        };

        this.state = {
            selected: ''
        };
    }

    render() {
        const files = this.props.files.map(file => _react2.default.createElement(
            'li',
            { key: file.key,
                onClick: this.handleClick.bind(this, file),
                onDoubleClick: this.handleDoubleClick.bind(this, file),
                className: file.path === this.state.selected ? 'selected' : '' },
            file.title
        ));
        return _react2.default.createElement(
            'div',
            { style: { flex: 1, display: 'flex', flexDirection: 'column' } },
            _react2.default.createElement(
                'ul',
                { style: { flex: 1, overflowY: 'scroll' } },
                files
            ),
            _react2.default.createElement(
                'div',
                { style: { flex: '0 1 auto' } },
                _react2.default.createElement(
                    'button',
                    { style: { float: 'right' }, onClick: this.select },
                    'Select'
                )
            )
        );
    }
}

exports.default = FileBrowser;
//# sourceMappingURL=FileBrowser.js.map