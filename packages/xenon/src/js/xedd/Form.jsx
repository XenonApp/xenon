import React from 'react';
import { getVersion } from './api';
import * as localStore from '../local_store';

class Form extends React.Component {
    constructor(props) {
        super(props);

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
        const config = {
            url: this.state.url,
            user: this.state.user,
            password: this.state.password
        };

        this.props.onConnect(config);
    };

    handleInput = (input, e) => {
        this.setState({ [input]: e.target.value });
    };

    render() {
        return (
            <form style={{flex: '0 1 auto'}}>
                <input type="text" onChange={this.handleInput.bind(this, 'url')} style={{width: '40%', marginRight: '5px'}} placeholder="URL" value={this.state.url} />
                <input style={{marginTop: '2px', width: '20%', marginRight: '5px'}} type="text" placeholder="Username" onChange={this.handleInput.bind(this, 'user')} value={this.state.user} />
                <input style={{marginTop: '2px', width: '20%', marginRight: '5px'}} type="password" placeholder="Password" onChange={this.handleInput.bind(this, 'password')} value={this.state.password} />
                <button onClick={this.connect}>Connect</button>
                {this.state.hint ? <div style={{color: 'red'}}>{this.state.hint}</div> : null}
            </form>
        );
    }
}

export default Form;
