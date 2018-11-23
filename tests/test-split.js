const assert = require("assert");
const net = require("net");
const SocketWrapper = require("../index.js");

/*
  Split messages received in single chunk
*/

const str1 = "test buffer";
const buffer1 = Buffer.from(str1);
const str2 = "another string";
const buffer2 = Buffer.from(str2);

const server = net.createServer(socket => {
  const ws = new SocketWrapper(socket);
  const received = [];
  ws.on("receive", msg => received.push(msg));
  socket.on("end", () => {
    assert(received.length === 2);
    assert(received[0].equals(buffer1));
    assert(received[1].equals(buffer2));
    process.exit(0);
  });
});
server.listen(() => {
  const client = net.createConnection(
    { port: server.address().port },
    async () => {
      client.write(
        Buffer.concat([
          new Buffer([0x00, 0x00, 0x00, str1.length]),
          buffer1,
          new Buffer([0x00, 0x00, 0x00, str2.length]),
          buffer2
        ])
      );
      client.end();
    }
  );
});
