import React from 'react';
import * as cache from '../cache';
import * as localStore from '../local_store';

class FileBrowser extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selected: ''
        };
    }

    handleClick = (file) => {
        this.setState({ selected: file.path });
    };

    handleDoubleClick = (file) => {
        this.props.onClick(file.path);
        this.setState({ selected: '' });
    };

    select = async () => {
        await localStore.set('configDir', this.state.selected);
        cache.set('configDir', this.state.selected);
        this.props.onSelect();
    }

    render() {
        const files = this.props.files.map(file => (
            <li key={file.key}
                onClick={this.handleClick.bind(this, file)}
                onDoubleClick={this.handleDoubleClick.bind(this, file)}
                className={ file.path === this.state.selected ? 'selected' : ''}>
            {file.title}</li>
        ));
        return (
            <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                <ul style={{flex: 1, overflowY: 'scroll'}}>{files}</ul>
                <div style={{flex: '0 1 auto'}}>
                    <button style={{float: 'right'}} onClick={this.select}>Select</button>
                </div>
            </div>
        );
    }
}

export default FileBrowser;
