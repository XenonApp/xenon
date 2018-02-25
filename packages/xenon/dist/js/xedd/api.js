'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getVersion = getVersion;
exports.readDir = readDir;

var _axios = require('axios');

var axios = _interopRequireWildcard(_axios);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function getVersion(url, user, pass) {
    return axios.get(`${url}/version`, {
        auth: {
            username: user,
            password: pass
        }
    });
}

async function readDir(url, path, user, pass) {
    const result = await axios.get(`${url}/read${path}`, {
        auth: {
            username: user,
            password: pass
        }
    });

    const dirs = [];
    result.data.forEach(entry => {
        if (entry[entry.length - 1] === '/') {
            dirs.push({
                title: entry.slice(0, -1),
                key: entry.slice(0, -1),
                path: path + entry,
                isFolder: true,
                isLazy: true
            });
        }
    });

    return dirs;
}
//# sourceMappingURL=api.js.map