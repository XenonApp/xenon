const async = require('async');
const chokidar = require('chokidar');
const nodeFs = require("fs");
const path = require("path");

const spawn = require("child_process").spawn;

class XFS {
    constructor(dir) {
        this.filename;
        this.rootPath = dir;
        this.watcher = null;
        this.listeners = {
            add: [],
            change: [],
            unlink: []
        };

        // Support opening a single file
        var stats = nodeFs.statSync(this.rootPath);
        var newRoot, vcsStat;
        if (stats.isFile()) {
            var vcsFound = false;
            this.filename = this.rootPath;
            do {
                // Scan up the file tree looking for version control dirs.
                newRoot = path.dirname(this.rootPath);
                if (newRoot == this.rootPath) {
                    // No VCS found, give up.
                    this.rootPath = path.dirname(this.filename);
                    break;
                } else {
                    this.rootPath = newRoot;
                }
                [".bzr", ".git", ".svn", ".hg", ".fslckout", "_darcs", "CVS"].some(function(vcs) {
                    try {
                        vcsStat = nodeFs.statSync(path.join(this.rootPath, vcs));
                        vcsFound = true;
                        return true;
                    } catch(ignore) {}
                });
            } while (!vcsFound);
            this.filename = this.stripRoot(this.filename).slice(1);
        }
    }

    close() {
        if (this.watcher) {
            this.watcher.close();
        }
    }

    on(event, listener) {
        if (this.listeners[event]) {
            this.listeners[event].push(listener);
        }
    }

    off(event, listener) {
        if (this.listeners[event]) {
            const i = this.listeners[event].indexOf(listener);
            if (i > -1) {
                this.listeners[event].splice(i, 1);
            }
        }
    }

    dirname(path) {
        if (path[path.length - 1] === '/') {
            path = path.substring(0, path.length - 1);
        }
        var parts = path.split("/");
        return parts.slice(0, parts.length - 1).join("/");
    }

    stripRoot(filename) {
        return filename.substring(this.rootPath.length);
    }

    addRoot(filename) {
        return this.rootPath + filename;
    }

    mkdirs(path) {
        return new Promise((resolve, reject) => {
            var parts = path.split("/");
            if (parts.length === 1) {
                resolve();
            } else {
                this.mkdirs(parts.slice(0, parts.length - 1).join("/")).then(function() {
                    nodeFs.exists(path, function(exists) {
                        if (exists) {
                            resolve();
                        } else {
                            nodeFs.mkdir(path, function(err) {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve(err);
                                }
                            });
                        }
                    });
                }, reject);
            }
        });
    }

    listFiles() {
        var files = [];

        return new Promise((resolve, reject) => {
            function readDir(dir, callback) {
                nodeFs.readdir(dir, function(err, entries) {
                    if (err) {
                        return callback(err);
                    }
                    async.each(entries, function(entry, next) {
                        var fullPath = dir + "/" + entry;
                        nodeFs.stat(fullPath, function(err, stat) {
                            if (err) {
                                console.error(`Cannot stat file/directory: ${fullPath}`);
                                return next();
                            }
                            if (stat.isDirectory()) {
                                readDir(fullPath, next);
                            } else {
                                files.push(fullPath);
                                next();
                            }
                        });
                    }, callback);
                });
            }
            readDir(this.rootPath, (err) => {
                if (err) {
                    return reject(err);
                }
                resolve(files.map(file => this.stripRoot(file)));
            });
        });
    }

    readFile(path, binary) {
        if (path === "/.zedstate" && this.filename) {
            return Promise.resolve(JSON.stringify({
                "session.current": ["/" + this.filename]
            }));
        }
        var fullPath = this.addRoot(path);
        return new Promise(function(resolve, reject) {
            nodeFs.readFile(fullPath, {
                encoding: binary ? 'binary' : 'utf8'
            }, function(err, contents) {
                if (err) {
                    return reject(err);
                }
                resolve(contents);
            });
        });
    }

    writeFile(path, content, binary) {
        if (path === "/.zedstate" && this.filename) {
            return Promise.resolve();
        }
        var fullPath = this.addRoot(path);
        // First ensure parent dir exists
        return this.mkdirs(this.dirname(fullPath)).then(function() {
            return new Promise(function(resolve, reject) {
                nodeFs.writeFile(fullPath, content, {
                    encoding: binary ? 'binary' : 'utf8'
                }, function(err) {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                });
            });
        });
    }

    deleteFile(path) {
        var fullPath = this.addRoot(path);
        return new Promise(function(resolve, reject) {
            nodeFs.unlink(fullPath, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    watch(ignored) {
        if (this.watcher !== null) {
            this.watcher.close();
        }

        const defaultIgnore = [
            '.bzr',
            '.git',
            '.svn',
            '.hg',
            '.fslckout',
            '_darcs',
            'CVS',
            '.zedstate'
        ];
        if (Array.isArray(ignored)) {
            ignored = ignored.map(i => {
                if (i[0] === '/') {
                    return i.slice(1);
                }
                return i;
            });
            ignored = defaultIgnore.concat(ignored);
        } else if (ignored) {
            if (ignored[0] === '/') {
                defaultIgnore.push(ignored.slice(1));
            } else {
                defaultIgnore.push(ignored);
            }
            ignored = defaultIgnore;
        } else {
            defaultIgnore.push('node_modules');
            defaultIgnore.push('**/node_modules');
            ignored = defaultIgnore;
        }

        this.watcher = chokidar.watch(this.rootPath, {
            ignored: ignored,
            ignoreInitial: true,
            persistent: true,
            cwd: this.rootPath
        });

        this.watcher.on('add', (path) => {
            this.listeners.add.forEach(listener => listener(`/${path}`));
        });
        this.watcher.on('change', (path) => {
            this.listeners.change.forEach(listener => listener(`/${path}`));
        });
        this.watcher.on('unlink', (path) => {
            this.listeners.unlink.forEach(listener => listener(`/${path}`));
        });
        this.watcher.on('error', error => console.error(error));
    }

    getProjectPath() {
        return this.rootPath;
    }

    getCapabilities() {
        return {
            run: true
        };
    }

    run(command, stdin) {
        return new Promise((resolve) => {
            var p = spawn(command[0], command.slice(1), {
                cwd: this.rootPath,
                env: process.env
            });
            var chunks = [];
            if (stdin) {
                p.stdin.end(stdin);
            }
            p.stdout.on("data", function(data) {
                chunks.push(data);
            });
            p.stderr.on("data", function(data) {
                chunks.push(data);
            });
            p.on("close", function() {
                resolve(chunks.join(''));
            });
            p.on("error", function(err) {
                // Not rejecting to be compatible with webfs implementation
                resolve(chunks.join('') + err.message);
            });
        });
    }
}

module.exports = XFS;
