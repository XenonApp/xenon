'use strict';

const HttpServer = require('./webserver').HttpServer;
const eventbus = require('./eventbus');

var servers = {};

var availablePort = 8022;

var api = {
    hook: function() {
        eventbus.on("windowclose", function() {
            _.each(servers, function(server) {
                server.stop();
            });
        });
    },
    // Returns (via promise) URL to server
    startServer: function(id, requestHandler) {
        servers[id] = new HttpServer("127.0.0.1", availablePort, requestHandler);
        return servers[id].start().
        catch (function(e) {
            console.log("Couldn't listen to", availablePort, e);
            availablePort++;
            return api.startServer(id, requestHandler);
        }).then(function() {
            var server = servers[id];
            availablePort++;
            return "http://" + server.host + ":" + server.port;
        });
    },
    stopServer: function(id) {
        if (servers[id]) {
            servers[id].stop();
        }
        return Promise.resolve();
    }
};

module.exports = api;
