'use strict';

const fs = xenon.fs;
const tslint = require('tslint');
const Linter = tslint.Linter;
const Configuration = tslint.Configuration;

const options = {
    formatter: "json"
};

let configResults = null;

module.exports = async function(info) {
    const fileContents = info.inputs.text;
    const projectPath = await fs.getProjectPath();
    const fileName = `${projectPath}/${info.path}`;
    const linter = new Linter(options);
    
    if (!configResults) {
        const configLoad = Configuration.findConfiguration(null, fileName);
        configResults = configLoad.results;
    }
    linter.lint(fileName, fileContents, configResults);
    const results = JSON.parse(linter.getResult().output);
    
    const errors = [];
    
    if (results) {
        results.forEach(err => {
            errors.push({
                row: err.startPosition.line,
                column: err.startPosition.character,
                endColumn: err.endPosition.character,
                text: err.failure,
                type: 'warning'
            });
        });
    }
    
    return errors;
};