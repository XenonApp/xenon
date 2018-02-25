import React from 'react';
import ReactDOM from 'react-dom';
import Modal from './xedd/Modal';

const api = {};

api.openConfig = function() {
    return new Promise(resolve => {
        ReactDOM.render(<Modal config onSelect={resolve} />, document.getElementById('modal'));
    });
};

api.open = function() {
    var el = $("<div id='modal' class='modal-view'></div>");
    $("body").append(el);
    return new Promise(resolve => {
        function select(res) {
            el.remove();
            resolve(res);
        }

        ReactDOM.render(<Modal onSelect={select} />, document.getElementById('modal'));
    });
};

module.exports = api;
