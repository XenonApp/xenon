'use strict';

const semver = require('semver');
const utils = require('@xenonapp/xenpm-utils');

const Range = global.ace.require("ace/range").Range;

const command = require('./command');
const config = require('./config');
const configfs = require('./configfs');
const editor = require('./editor');
const eventbus = require('./eventbus');
const fs = require('./fs');
const goto = require('./goto');
const sessionManager = require('./session_manager');
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

async function getInstalledPackageDetails() {
    let packages = await getInstalledPackages();
    const promises = [];
    for (const name in packages) {
        promises.push(configfs.readFile(`/node_modules/${name}/package.json`));
    }

    packages = await Promise.all(promises);
    return packages.map(pkg => JSON.parse(pkg));
}

async function getInstalledPackages() {
    const results = await utils.list({dir: config.getDir()});
    const packages = results.dependencies;
    for (const name in packages) {
        if (!packages[name].version) {
            delete packages[name];
        }
    }
    return packages;
}

async function install(packages) {
    const promises = [];
    for (const name of packages) {
        promises.push(utils.view(name, 'keywords').then(results => {
            if (!results || results.indexOf('xenon-package') === -1) {
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
        const packageNames = config.getPackages();
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

async function installCommand() {
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
        await install([name]);
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

async function listAvailablePackages() {
    const edit = editor.getActiveEditor();
    // const session = await sessionManager.go('zed::xenpm::available', edit, edit.getSession());
    const packages = await utils.searchByScope('xenonapp');

    // console.log(packages);

    // const append = function(text) {
    //     session.insert({
    //         row: session.getLength(),
    //         column: 0
    //     }, text);
    // }

    // // Replace all text
    // const lineCount = session.getLength();
    // const range = new Range(0, 0, lineCount, session.getLine(lineCount - 1).length);
    // session.replace(range, "Installed packages\n==================\n");

    // append("\nCommands: [Install New]      [Update All]\n");
    // var pkg;
    // if (packages.length === 0) {
    //     append("\nYou do not have any packages installed.\n", function() {});
    // } else {
    //     for (const pkg of packages) {
    //         append("\n" + pkg.name + "\n");
    //         append("Version: " + pkg.version + "\n");
    //         append("Description: " + pkg.description + "\n");
    //         append("Commands: [Uninstall]      [Update]\n");
    //     }
    // }

    // session.selection.clearSelection();
    // session.selection.moveCursorToPosition({
    //     row: 0,
    //     column: 0
    // });
}

async function listInstalledPackages() {
    const edit = editor.getActiveEditor();
    const session = await sessionManager.go('zed::xenpm::installed', edit, edit.getSession());
    const packages = await getInstalledPackageDetails();

    const append = function(text) {
        session.insert({
            row: session.getLength(),
            column: 0
        }, text);
    }

    // Replace all text
    const lineCount = session.getLength();
    const range = new Range(0, 0, lineCount, session.getLine(lineCount - 1).length);
    session.replace(range, "Installed packages\n==================\n");

    append("\nCommands: [Install New]      [Update All]\n");
    var pkg;
    if (packages.length === 0) {
        append("\nYou do not have any packages installed.\n", function() {});
    } else {
        for (const pkg of packages) {
            append("\n" + pkg.name + "\n");
            append("Version: " + pkg.version + "\n");
            append("Description: " + pkg.description + "\n");
            append("Commands: [Uninstall]      [Update]\n");
        }
    }

    session.selection.clearSelection();
    session.selection.moveCursorToPosition({
        row: 0,
        column: 0
    });
}

async function uninstall(name) {
    return utils.uninstall(name, {dir: config.getDir()});
}

async function update(name) {
    const [newest, json] = await Promise.all([
        utils.view(name, 'version'),
        configfs.readFile(`/node_modules/${name}/package.json`)
    ]);

    const current = JSON.parse(json).version;
    if (!semver.gt(newest, current)) {
        return false;
    }
    await utils.install(name, {dir: config.getDir()});
    return true;
}

async function updateAll() {
    const packageNames = config.getPackages();
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

command.define('Installed Packages:Execute Command', {
    internal: true,
    readOnly: true,
    async exec() {
        const edit = editor.getActiveEditor();
        const session = edit.getSession();
        const pos = session.selection.getCursor();
        const lines = session.getDocument().getAllLines();

        function giveFeedback(message) {
            if (message) {
                ui.prompt({
                    message,
                    width: 300,
                    height: 150
                });
            }
            listInstalledPackages();
        }

        function giveError(err) {
            ui.prompt({
                message: ""+err,
                width: 300,
                height: 150
            });
        }

        function reloadConfig() {
            if (fs.isConfig) {
                return goto.fetchFileList();
            }
            config.loadConfiguration();
        }

        var line = lines[pos.row];

        try {
            if (pos.row === 3 && line === "Commands: [Install New]      [Update All]") {
                if (pos.column >= 10 && pos.column <= 23) {
                    await installCommand();
                    return listInstalledPackages();
                } else if (pos.column >= 29) {
                    await updateAll();
                    reloadConfig();
                    giveFeedback("Packages updated!");
                }
            } else if (line === "Commands: [Uninstall]      [Update]") {
                const name = lines[pos.row - 3];
                if (pos.column >= 10 && pos.column <= 21) {
                    console.log(`Unstalling ${name}`);
                    await uninstall(name);
                    await config.removePackage(name);
                    reloadConfig();
                    giveFeedback(`${name} uninstalled!`);
                } else if (pos.column >= 27 && pos.column <= 35) {
                    const updated = await update(name);
                    if (updated) {
                        reloadConfig();
                        giveFeedback(`${name} updated!`);
                    } else {
                        giveFeedback(`${name} is already up to date.`)
                    }
                }
            }
        } catch(err) {
            giveError(err);
        }
    }
});

command.define('Tools:XeNPM:Install', {
    doc: 'Prompt to install a package.',
    readOnly: true,
    exec: installCommand
});

command.define('Tools:XeNPM:Installed Packages', {
    doc: 'List packages that are already installed.',
    readOnly: true,
    exec: listInstalledPackages
});

command.define('Tools:XeNPM:Available Packages', {
    doc: 'List packages that are available to install.',
    readOnly: true,
    exec: listAvailablePackages
});

module.exports = api;
