'use strict';

const semver = require('semver');
const utils = require('xenpm-utils');

const command = require('./command');
const config = require('./config');
const configfs = require('./configfs');
const eventbus = require('./eventbus');
const fs = require('./fs');
const goto = require('./goto');
const ui = require('./ui');

const DAY = 24 * 60 * 60 * 1000; // number of ms in a day

const api = {
    hook() {
        eventbus.on("configchanged", async () => {
            await installFromConfig();
            autoUpdate();
        });
    }
};

async function autoUpdate() {
    const data = localStorage.xenpmLastUpdated ? localStorage.xenpmLastUpdated : 0;
    const lastUpdated = parseInt(data, 10);
    
    if (Date.now() - lastUpdated < DAY) {
        return;
    }
    
    console.log("XeNPM: Checking for updates...");
    localStorage.xenpmLastUpdated = Date.now();
    const anyUpdates = await updateAll();
    if (anyUpdates) {
        if (fs.isConfig) {
            return goto.fetchFileList();
        }
        return config.loadConfiguration();
    }
}

async function getInstalledPackages() {
    const results = await utils.list({dir: config.getDir()});
    return results.dependencies;
}

async function install(packages) {
    const promises = [];
    for (const name of packages) {
        promises.push(utils.view(name, 'xenon').then(results => {
            if (!results) {
                throw new Error(`${name} is not a xenon package.`);
            }
        }));
    }
    
    // Don't care about this beyond that it doesn't throw the error
    await Promise.all(promises);
    
    return utils.install(packages, {dir: config.getDir()});
}

async function installAll() {
    try {
        let packageNames = config.getPackages();
        
        // TODO: remove concern for outdated packages
        packageNames = packageNames.filter(name => name.slice(0, 3) !== 'gh:')
        
        const packages = await getInstalledPackages();
        
        let notYetInstalled = packageNames;
        if (packages) {
            notYetInstalled = packageNames.filter(name => !packages[name]);
        }
        
        console.log("These packages should be installed:", notYetInstalled);
        
        await install(notYetInstalled);
        return notYetInstalled.length > 0;
    } catch(err) {
        console.error("Error installing packages", "" + err);
    }
}


async function installFromConfig() {
    console.log("Installing packages");
    const anyUpdates = await installAll()
    if (anyUpdates) {
        if (fs.isConfig) {
            return goto.fetchFileList();
        }
        return config.loadConfiguration();
    }
}

async function updateAll() {
    let packageNames = config.getPackages();
    // TODO: remove concern for outdated packages
    packageNames = packageNames.filter(name => name.slice(0, 3) !== 'gh:')
    
    const promises = [];
    
    for (const name of packageNames) {
        const promise = Promise.all([
            utils.view(name, 'version'),
            configfs.readFile(`/node_modules/${name}/package.json`)
        ]).then(([newest, json]) => {
            if (!newest || !json) {
                return false;
            }
            
            json = JSON.parse(json);
            const current = json.version;
            
            if (semver.gt(newest, current)) {
                return name;
            }
            return false;
        });
        promises.push(promise);
    }
    
    let packages = await Promise.all(promises);
    packages = packages.filter(pkg => pkg !== false);
    console.log('These packages should be updated:', packages);
    
    if (packages.length > 0) {
        await utils.install(packages, {dir: config.getDir()});
    }
    
    return packages.length;
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