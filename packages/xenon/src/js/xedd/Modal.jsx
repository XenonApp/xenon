import React from 'react';
import { readDir } from './api';
import * as cache from '../cache';
import * as localStore from '../local_store';
import FileBrowser from './FileBrowser';
import Form from './Form';

class Modal extends React.Component {
    constructor(props) {
        super(props);

        this.config = null;
        this.paths = [];

        this.state = {
            files: []
        };
    }

    connect = async (config) => {
        this.config = config;
        if (!this.props.config) {
            await localStore.set('xedd', config);
        }
        this.updateFiles('/');
    };

    handleInput = (input, e) => {
        this.setState({ [input]: e.target.value });
    };

    handleSelect = async (path) => {
        if (this.props.config) {
            this.config.path = path;
            cache.set('xeddConfig', this.config);
            await localStore.set('xeddConfig', this.config);
        }
        this.props.onSelect({
            url: this.config.url,
            user: this.config.user,
            password: this.config.password,
            path: path
        });
    }

    updateFiles = async (path) => {
        let files;
        try {
            files = await readDir(this.config.url, path, this.config.user, this.config.password);
        } catch(err) {
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

    render() {
        return (
            <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
                <div style={{flex: '0 1 auto'}}>
                    <img src="./img/zed-small.png" className="logo" />
                    { this.props.config ? <h1>Setup Xedd Server and Select Configuration Directory</h1> : <h1>Open Xedd Folder</h1> }
                </div>
                <div style={{position: 'absolute', top: '15px', right: '16px', fontSize: '14px'}}>
                    <button>What is this?</button>
                    <button onClick={this.props.onSelect}>Cancel</button>
                </div>
                <Form config={this.props.config} onConnect={this.connect} />
                <FileBrowser files={this.state.files} onClick={this.updateFiles} onSelect={this.handleSelect} />
            </div>
        );
    }
}

export default Modal;
