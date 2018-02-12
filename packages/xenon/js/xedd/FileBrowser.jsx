import React from 'react';
import { readDir } from './api';

class FileBrowser extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selected: ''
        };
    }
    
    handleClick = (file) => {
        this.setState({ selected: file.key });
    };
    
    handleDoubleClick = (file) => {
        this.props.onClick(file.path);
        this.setState({ selected: '' });
    };
    
    render() {
        const files = this.props.files.map(file => (
            <li key={file.key} 
                onClick={this.handleClick.bind(this, file)}
                onDoubleClick={this.handleDoubleClick.bind(this, file)}
                className={ file.key === this.state.selected ? 'selected' : ''}>
            {file.title}</li>
        ));
        return (
            <ul>{files}</ul>
        );
    }
}

export default FileBrowser;