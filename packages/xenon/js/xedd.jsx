import React from 'react';
import ReactDOM from 'react-dom';
import Xedd from './xedd/Xedd.jsx';

const api = {};

api.open = function() {
    ReactDOM.render(<Xedd/>, document.getElementById('modal'));
    return new Promise((resolve, reject) => {});
};

module.exports = api;