const app = require('express')();
const fs = require('fs');
const path = require('path');
const packageVersion = require('./package.json').version;

module.exports = function(config) {
    const root = path.resolve(config.get('root'));
    const enableRun = !config.get("remote") || config.get("enable-run");

    if (config.get('user') || config.get('pass')) {
        const user = config.get('user');
        const pass = config.get('pass');
        const base64 = new Buffer(`${user}:${pass}`).toString('base64');

        app.use(function(req, res, next) {
            if (req.headers.authorization !== `Basic ${base64}`) {
                return res.status(401).send('Unauthorized');
            }
            next();
        });
    }

    app.get('/version', function(req, res) {
        res.send({ version: packageVersion });
    });

    app.get('/capabilities', function(req, res) {
        res.send({ run: !!enableRun });
    });

    app.get('/read/\*', function(req, res) {
        const filePath = path.resolve(root, req.params[0]);

        fs.stat(filePath, function(err, stat) {
            if (err) {
                return res.status(404).send("Path not found");
            }

            res.statusCode = 200;
            if (stat.isDirectory()) {
                fs.readdir(filePath, function(err, list) {
                    list = list.map(name => {
                        return new Promise(resolve => {
                            fs.stat(path.resolve(filePath, name), (err, stat) => {
                                if (err) {
                                    return resolve(null);
                                }
                                if (stat.isDirectory()) {
                                    return resolve(`${name}/`);
                                } else {
                                    return resolve(name);
                                }
                            });
                        });
                    });
                    Promise.all(list)
                        .then(list => list.filter(name => name !== null))
                        .then(list => res.send(list));
                });
            } else { // File
                res.sendFile(filePath);
            }
        });
    });

    return app;
};
