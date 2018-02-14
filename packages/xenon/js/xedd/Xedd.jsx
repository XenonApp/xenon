import React from 'react';
import styled from 'styled-components';
import { getVersion, readDir } from './api';
import * as cache from '../cache';
import * as localStore from '../local_store';
import FileBrowser from './FileBrowser.jsx';

const ButtonsDiv = styled.div`
    position: absolute;
    top: 15px;
    right: 16px;
    font-size: 14px;
`;

const StyledInput = styled.input`
    margin-top: 2px;
    width: 20%;
`;

const HintDiv = styled.div`
    color: red;
`;

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
            this.setState({ hint: err.message });
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
        const files = await readDir(this.state.url, path, this.state.user, this.state.password); 
        
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
        } else {
            this.paths = [];
        }
        
        if (!back) {
            this.paths.push(path);
        }
        
        console.log(this.paths);
        this.setState({ files });
    };
    
    render() {
        return (
            <div>
                <img src="./img/zed-small.png" className="logo" />
                <h1>Setup Xedd Server and Select Configuration Directory</h1>
                <ButtonsDiv>
                    <button>What is this?</button>
                </ButtonsDiv>
                <div id="container">
                    <form id="zedd-form">
                        <input type="text" onChange={this.handleInput.bind(this, 'url')} style={{width: '40%'}} placeholder="URL" value={this.state.url} />
                        <StyledInput type="text" placeholder="Username" onChange={this.handleInput.bind(this, 'user')} value={this.state.user} />
                        <StyledInput type="password" placeholder="Password" onChange={this.handleInput.bind(this, 'password')} value={this.state.password} />
                        <button onClick={this.connect}>Connect</button>
                        {this.state.hint ? <HintDiv>{this.state.hint}</HintDiv> : null}
                    </form>
                    <FileBrowser files={this.state.files} onClick={this.updateFiles} onSelect={this.props.onSelect} />
                </div>
            </div>
        );
    }
}

export default Xedd;