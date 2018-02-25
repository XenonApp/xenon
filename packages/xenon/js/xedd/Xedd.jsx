import React from 'react';
import styled from 'styled-components';
import { getVersion, readDir } from './api';
import * as cache from '../cache';
import * as localStore from '../local_store';
import FileBrowser from './FileBrowser.jsx';

class Xedd extends React.Component {
    constructor(props) {
        super(props);

        this.paths = [];

        this.state = {
            url: 'http://localhost:7337',
            user: '',
            password: '',
            hint: '',
            files: []
        };
    }

    connect = async (e) => {
        e.preventDefault();
        if (this.state.url.indexOf('http') !== 0) {
            this.setState({ hint: 'The url must start with http' });
        }
        try {
            await getVersion(this.state.url, this.state.user, this.state.password);
        } catch(err) {
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

    handleInput = (input, e) => {
        this.setState({ [input]: e.target.value });
    };

    updateFiles = async (path) => {
        let files;
        try {
            files = await readDir(this.state.url, path, this.state.user, this.state.password);
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
                    <h1>Setup Xedd Server and Select Configuration Directory</h1>
                </div>
                <div style={{position: 'absolute', top: '15px', right: '16px', fontSize: '14px'}}>
                    <button>What is this?</button>
                </div>
                <form id="zedd-form" style={{flex: '0 1 auto'}}>
                    <input type="text" onChange={this.handleInput.bind(this, 'url')} style={{width: '40%', marginRight: '5px'}} placeholder="URL" value={this.state.url} />
                    <input style={{marginTop: '2px', width: '20%', marginRight: '5px'}} type="text" placeholder="Username" onChange={this.handleInput.bind(this, 'user')} value={this.state.user} />
                    <input style={{marginTop: '2px', width: '20%', marginRight: '5px'}} type="password" placeholder="Password" onChange={this.handleInput.bind(this, 'password')} value={this.state.password} />
                    <button onClick={this.connect}>Connect</button>
                    {this.state.hint ? <div style={{color: 'red'}}>{this.state.hint}</div> : null}
                </form>
                <FileBrowser files={this.state.files} onClick={this.updateFiles} onSelect={this.props.onSelect} />
            </div>
        );
    }
}

export default Xedd;
