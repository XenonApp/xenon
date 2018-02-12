import * as header from 'basic-auth-header';

export async function getVersion(url, user, pass) {
    return new Promise(function(resolve, reject) {
        // Only check http(s) links
        if (url.indexOf("http") !== 0) {
            return reject();
        }
        $.ajax({
            type: "POST",
            url: url,
            data: {
                action: 'version'
            },
            username: user || undefined,
            password: pass || undefined,
            success: function() {
                resolve();
            },
            error: function(err) {
                reject(err.statusText);
            },
            dataType: "text"
        });
    });
}

export async function readDir(url, path, user, pass) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            type: "GET",
            url: url + path,
            username: user || undefined,
            password: pass || undefined,
            success: function(text) {
                var entries = text.split("\n");
                var dirs = [];
                entries.forEach(function(entry) {
                    if (entry[entry.length - 1] === '/') {
                        dirs.push({
                            title: entry.slice(0, -1),
                            key: entry.slice(0, -1),
                            path: path + "/" + entry.slice(0, -1),
                            isFolder: true,
                            isLazy: true
                        });
                    }
                });
                resolve(dirs);
            },
            error: function(err) {
                reject(err.statusText);
            },
            dataType: "text"
        });
    });
}