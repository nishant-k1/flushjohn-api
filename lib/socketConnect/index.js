import { Server } from "socket.io";
import { leadSocketHandler } from "../../sockets/leads.js";
import { instrument } from "@socket.io/admin-ui";

export default function socketConnect(server) {
  const allowedOrigins = [
    "http://localhost:8080",
    "http://localhost:3000",
    "http://localhost:3001",
    "https://www.flushjohn.com",
    "http://www.flushjohn.com",
  ];
  // Socket.io doesn’t support regex (/\.flushjohn\.com$/) in cors options
  const io = new Server(server, {
    cors: { origin: allowedOrigins },
  });
  instrument(io, { auth: false });
  const leadsNamespace = io.of("/leads");
  leadsNamespace.on("connection", async (socket) => {
    leadSocketHandler(leadsNamespace, socket);
  });
  return io;
}
