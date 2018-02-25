'use strict';

const remote = require('electron').remote;
const Menu = remote.Menu;

const command = require('./command');
const config = require('./config');
const editor = require('./editor');
const eventbus = require('./eventbus');
const template = require('./menu/template');
const utils = require('../shared/utils');
const win = require('./window');

var api = {
    disabled: false,
    hook: function () {
        eventbus.on("switchsession", function (edit, newSession) {
            if (config.getPreference("showMenus")) {
                api.updateMenu(newSession);
            }
        });
        eventbus.on("configchanged", function () {
            if (config.getPreference("showMenus")) {
                try {
                    api.updateMenu(editor.getActiveSession());
                } catch (e) {
                    console.error("Error", e);
                }
            } else {
                api.hideMenu();
            }
        });
    },
    updateMenu: function (session) {
        const currentTemplate = template.slice();
        const dashRegExp = /-/g;
        function updateTemplate(node, index, parent) {
            if (Array.isArray(node)) {
                node.forEach(updateTemplate);
            } else if (node.label) {
                if (node.command) {
                    const cmd = command.lookup(node.command);
                    if (!cmd || !command.isVisible(session, cmd)) {
                        return parent.splice(index, 1);
                    }
                    let key = command.identifyCurrentKey(node.command);
                    if (key) {
                        key = key.split('|');
                        key = key[0].replace(dashRegExp, '+');
                        node.accelerator = key;
                    }
                    const edit = editor.getActiveEditor();
                    node.click = () => command.exec(cmd.name, edit, edit.getSession());
                }
                if (node.submenu) {
                    updateTemplate(node.submenu);
                }
            }
        }
        updateTemplate(currentTemplate);
        setMenu(Menu.buildFromTemplate(currentTemplate));
    },
    hideMenu: function () {
        if (!utils.isMacOS()) {
            win.setMenu(null);
        }
    }
};

function setMenu(menu) {
    if (utils.isMacOS()) {
        Menu.setApplicationMenu(menu);
    } else {
        win.setMenu(menu);
    }
}

module.exports = api;
//# sourceMappingURL=menu.js.map