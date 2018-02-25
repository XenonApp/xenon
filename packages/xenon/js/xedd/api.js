import * as axios from 'axios';

export function getVersion(url, user, pass) {
    return axios.get(`${url}/version`, {
        auth: {
            username: user,
            password: pass
        }
    });
}

export async function readDir(url, path, user, pass) {
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
