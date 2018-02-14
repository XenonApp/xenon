import React from 'react';
import ReactDOM from 'react-dom';
import Xedd from './xedd/Xedd.jsx';

const api = {};

api.open = function() {
    return new Promise(resolve => {
        ReactDOM.render(<Xedd onSelect={resolve} />, document.getElementById('modal'));
    });
};

module.exports = api;