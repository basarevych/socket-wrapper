const assert = require("assert");
const net = require("net");
const SocketWrapper = require("../index.js");

/*
  Receive messages properly
*/

const str = "test buffer";
const buffer = Buffer.from(str);

const server = net.createServer(socket => {
  const ws = new SocketWrapper(socket);
  const received = [];
  ws.on("receive", msg => received.push(msg));
  socket.on("end", () => {
    assert(received.length === 1);
    assert(received[0].equals(buffer));
    process.exit(0);
  });
});
server.listen(() => {
  const client = net.createConnection({ port: server.address().port }, () => {
    client.write(new Buffer([0x00, 0x00, 0x00, str.length]));
    client.write(buffer);
    client.end();
  });
});
