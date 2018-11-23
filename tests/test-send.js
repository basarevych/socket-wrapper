const assert = require("assert");
const net = require("net");
const SocketWrapper = require("../index.js");

/*
  Send messages properly
*/

const str = "test buffer";
const buffer = Buffer.from(str);

const server = net.createServer(socket => {
  let received = new Buffer([]);
  socket.on("data", data => (received = Buffer.concat([received, data])));
  socket.on("end", () => {
    assert(received.length === buffer.length + 4);
    assert(
      received.slice(0, 4).equals(new Buffer([0x00, 0x00, 0x00, str.length]))
    );
    assert(received.slice(4).equals(buffer));
    process.exit(0);
  });
});
server.listen(() => {
  const client = net.createConnection({ port: server.address().port }, () => {
    const ws = new SocketWrapper(client);
    ws.send(buffer);
    client.end();
  });
});
