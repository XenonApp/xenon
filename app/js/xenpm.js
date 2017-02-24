'use strict';

const utils = require('xenpm-utils');

const command = require('./command');
const config = require('./config');
const eventbus = require('./eventbus');
const fs = require('./fs');
const goto = require('./goto');
const ui = require('./ui');

const api = {
    hook() {
        eventbus.on("configchanged", () => {
            // installFromConfig().then(() => {
            //     autoUpdate();
            // });
            installFromConfig();
        });
    }
};

function autoUpdate() {
    
}

function getInstalledPackages() {
    return utils.list({dir: config.getDir()}).then(results => {
        return results.dependencies;
    });
}

function install(name) {
    return utils.view(name).then(json => {
        if (!json.xenon) {
            throw new Error(`${name} is not a xenon package.`);
        }
        return utils.install(name, {dir: config.getDir()});
    });
}

function installAll() {
    let packageNames = config.getPackages();
    
    // TODO: remove concern for outdated packages
    packageNames = packageNames.filter(name => name.slice(0, 3) !== 'gh:')
    
    return getInstalledPackages().then(function(packages) {
        var notYetInstalled = packageNames.filter(name => !packages[name]);
        console.log("These packages should be installed:", notYetInstalled);
        
        var packagePromises = notYetInstalled.map(function(name) {
            console.log("Now installing", name);
            return install(name);
        });
        
        return Promise.all(packagePromises).then(function() {
            return notYetInstalled.length > 0;
        }, function(err) {
            console.error("Error installing packages", "" + err);
        });
    });
}


function installFromConfig() {
    console.log("Installing packages");
    return installAll().then(function(anyUpdates) {
        if (anyUpdates) {
            if (fs.isConfig) {
                return goto.fetchFileList();
            }
            config.reload();
        }
    });
}

command.define('Tools:XeNPM:Install', {
    doc: 'Prompt to install a package.',
    readOnly: true,
    exec() {
        return ui.prompt({
            message: "Package to install:",
            input: "",
            width: 400,
            height: 150
        }).then(name => {
            if (!name) {
                return;
            }
    
            return install(name).then(() => {
                return config.addPackage(name);
            }).then(() => {
                if (fs.isConfig) {
                    fs.reloadFileList();
                }
                return ui.prompt({
                    message: "Package installed successfully!",
                    width: 300,
                    height: 150
                });
            });
        }).catch(() => {
            return ui.prompt({
                message: "Package installation failed.  Please check the package name.",
                width: 300,
                height: 150
            });
        });
    }
});

module.exports = api;