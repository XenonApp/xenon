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

async function install(name) {
    const results = await utils.view(name, 'xenon');
    if (!results) {
        throw new Error(`${name} is not a xenon package.`);
    }
    return utils.install(name, {dir: config.getDir()});
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
    async exec() {
        const name = await ui.prompt({
            message: "Package to install:",
            input: "",
            width: 400,
            height: 150
        });
        
        if (!name) {
            return;
        }

        try {
            await install(name);
            await config.addPackage(name);
        
        
            if (fs.isConfig) {
                fs.reloadFileList();
            }
        
            return ui.prompt({
                message: "Package installed successfully!",
                width: 300,
                height: 150
            });
        } catch(err) {
            return ui.prompt({
                message: `Package installation failed.  Please check the package name. ${err}`,
                width: 300,
                height: 150
            });
        }
    }
});

module.exports = api;