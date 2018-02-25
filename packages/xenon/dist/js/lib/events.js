"use strict";

const defaultMaxListeners = 25;

class EventEmitter {
    constructor(checked) {
        this._events = {};
        this._checked = checked;
    }

    setMaxListeners(n) {
        this._events.maxListeners = n;
    }

    declare(type) {
        this._events[type] = [];
    }

    emit(type) {
        // console.log("Emitting", type);
        var handler = this._events[type];

        if (!handler && this._checked) throw Error("Event not declared: " + type);else if (!handler) handler = this._events[type] = [];

        var args = Array.prototype.slice.call(arguments, 1);

        var listeners = handler.slice();
        try {
            for (var i = 0, l = listeners.length; i < l; i++) {
                listeners[i].apply(this, args);
            }
        } catch (e) {
            console.error("Error while emitting", type, e.message, e.stack);
            throw e;
        }
        return listeners.length > 0;
    }

    addListener(type, listener) {
        if ('function' !== typeof listener) {
            throw new Error('addListener only takes instances of Function');
        }

        if (!this._events[type] && this._checked) {
            // Optimize the case of one listener. Don't need the extra array object.
            throw new Error("Event not declared: " + type);
        } else if (!this._events[type]) {
            this._events[type] = [];
        }
        // Check for listener leak
        if (!this._events[type].warned) {
            var m;
            if (this._events.maxListeners !== undefined) {
                m = this._events.maxListeners;
            } else {
                m = defaultMaxListeners;
            }

            if (m && m > 0 && this._events[type].length > m) {
                this._events[type].warned = true;
                console.error('(node) warning: possible EventEmitter memory ' + 'leak detected. %d listeners added. ' + 'Use emitter.setMaxListeners() to increase limit.', this._events[type].length);
                console.trace();
            }
        }

        // If we've already got an array, just append.
        this._events[type].push(listener);

        return this;
    }

    on(type, listener) {
        return this.addListener(type, listener);
    }

    once(type, listener) {
        var self = this;
        self.on(type, function g() {
            self.removeListener(type, g);
            listener.apply(this, arguments);
        });

        return this;
    }

    removeListener(type, listener) {
        if ('function' !== typeof listener) {
            throw new Error('removeListener only takes instances of Function');
        }

        // does not use listeners(), so no side effect of creating _events[type]
        if (!this._events || !this._events[type]) return this;

        var list = this._events[type];

        var i = list.indexOf(listener);
        if (i < 0) return this;
        list.splice(i, 1);
        return this;
    }

    removeAllListeners(type) {
        if (type && this._events && this._events[type]) this._events[type] = [];
        return this;
    }

    listeners(type) {
        return this._events[type];
    }
}

module.exports = {
    EventEmitter
};
//# sourceMappingURL=events.js.map