const EventEmitter = require('events');

/**
 * Send and receive messages via socket
 */
class SocketWrapper extends EventEmitter {
    /**
     * Create instance
     * @param {object} [socket]         Socket to attach to
     */
    constructor(socket) {
        super();

        this._socket = null;
        this._listener = null;
        this._incoming = new Buffer(0);
        this._outgoing = new Buffer(0);
        this._writing = false;

        if (socket)
            this.attach(socket);
    }

    /**
     * Get incoming buffer
     * @type {Buffer|null}
     */
    get incoming() {
        return this._incoming;
    }

    /**
     * Get outgoing buffer
     * @type {Buffer|null}
     */
    get outgoing() {
        return this._outgoing;
    }

    /**
     * Is wrapper attached to a socket?
     * @return {boolean}
     */
    get isAttached() {
        return this._socket !== null;
    }

    /**
     * Attach wrapper to a socket
     * @param {object} socket               Socket to attach to
     */
    attach(socket) {
        if (this.isAttached)
            return;

        let onData = data => {
            if (!this._incoming)
                return;

            if (data) {
                this._incoming = Buffer.concat([ this._incoming, data ]);
                this.emit('read', data);
            }

            while (this._incoming.length >= 4) {
                let size = this._incoming.readUInt32BE(0);
                if (this._incoming.length < 4 + size)
                    break;

                let message = this._incoming.slice(4, 4 + size);
                this._incoming = this._incoming.slice(4 + size);
                this.emit('receive', message);
            }
        };

        this._socket = socket;
        this._listener = onData.bind(this);
        socket.on('data', this._listener);

        if (this._outgoing.length)
            this._write();
    }

    /**
     * Detach from a socket
     */
    detach() {
        if (!this.isAttached)
            return;

        this._socket.removeListener('data', this._listener);
        this._socket = null;
        this._listener = null;
        this.clear();
    }

    /**
     * Send data
     * @param {Buffer} [data]               Data to send
     */
    send(data) {
        if (!this._outgoing)
            return;

        if (data) {
            let message = Buffer.allocUnsafe(4 + data.length);
            message.writeUInt32BE(data.length, 0);
            message.fill(data, 4);
            this._outgoing = Buffer.concat([ this._outgoing, message ]);

            this.emit('send', data);
        }

        this._write();
    }

    /**
     * Clear buffers
     */
    clear() {
        if (this._incoming)
            this._incoming = new Buffer(0);
        if (this._outgoing)
            this._outgoing = new Buffer(0);
    }

    /**
     * Destroy wrapper
     */
    destroy() {
        this.detach();
        this._incoming = null;
        this._outgoing = null;
    }

    /**
     * Actually send data via socket
     */
    _write() {
        if (this._writing || !this._socket || !this._outgoing)
            return;

        if (this._socket.destroyed)
            return this.detach();

        if (!this._outgoing.length) {
            this.emit('flush');
            return;
        }

        this._writing = true;
        let buffer = this._outgoing;
        this._outgoing = new Buffer(0);

        this.emit('write', buffer);
        this._socket.write(buffer, undefined, () => {
            this._writing = false;
            this._write();
        });
    }
}

module.exports = SocketWrapper;
