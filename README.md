# SocketWrapper

Send and receive separate messages via socket stream

## Installation

```
npm install --save socket-wrapper
```

## Usage

As you know TCP socket is a stream: order of bytes is guaranteed but there
is no idea of messages just a stream of bytes. You can send several separate
chunks of data and receive it on the other end with single read. Or you can
send one big chunk of data but receive it with several reads.

This class will allow you to send and receive distinct messages. The messages
will not be combined or splitted. It is achieved by sending message size as
UINT32 big endian integer before the actual data. Receiving side will read
first 4 bytes, convert it to the number of bytes and will be reading the
stream until all the bytes are read.

```javascript
const SocketWrapper = require('socket-wrapper');

let wrapper = new SocketWrapper(socket); // feed it a nodejs tcp socket
wrapper.on('receive', message => {
    console.log(message.toString()) // receive the message as a Buffer
});
wrapper.send(Buffer.from('hello world')); // send any Buffer
```

## SocketWrapper

### new SocketWrapper([socket])

Creates an instance. **socket** is an optional socket instance this wrapper
will attach to

### .incoming

Incoming buffer. Contains data received so far. When data is received from
the socket 'read' event is fired and it is appended to this buffer for
parsing messages. 

When there is enough data to extract the message then 'receive' event will
be fired and the buffer will be shortened by emitted data.

### .outgoing

Outgoing buffer. Temporary storage for the data scheduled to be sent. Each
act of sending the data is followed by 'write' event. When the buffer is
depleted 'flush' event is fired.

### .isAttached

Whether this wrapper is attached to a socket or not.

### .attach(socket)

Attach this wrapper to a socket. Sending/receiving messages becomes available.

### .detach()

Detach from the socket

### .send(buffer)

Send a Buffer as a message. SocketWrapper on the other side will receive
this exact buffer.

### .clear()

Clear incoming and outgoing buffers.

### .destroy()

Detach and delete all the internal data.

### event: read

Fired when new data has arrived via the socket

### event: write

Fired when current outgoing buffer is written to the socket

### event: flush

Fired when outgoing buffer is depleted

### event: receive

Fired when new message is completely received

### event: send

Fired when new chunk is appended to the outgoing buffer
