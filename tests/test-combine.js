const assert = require("assert");
const net = require("net");
const SocketWrapper = require("../index.js");

/*
  Combine messages received in separate chunks
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
      await new Promise(resolve =>
        client.write(new Buffer([0x00, 0x00, 0x00, str1.length]), resolve)
      );
      await new Promise(resolve => client.write(buffer1.slice(0, 3), resolve));
      await new Promise(resolve => client.write(buffer1.slice(3), resolve));
      await new Promise(resolve =>
        client.write(new Buffer([0x00, 0x00, 0x00, str2.length]), resolve)
      );
      await new Promise(resolve => client.write(buffer2.slice(0, 4), resolve));
      await new Promise(resolve => client.write(buffer2.slice(4), resolve));
      client.end();
    }
  );
});
