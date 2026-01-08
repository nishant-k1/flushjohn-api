import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { Socket } from "socket.io";
import { leadSocketHandler } from "../features/leads/sockets/leads.js";
import { salesOrderSocketHandler } from "../features/salesOrders/sockets/salesOrders.js";
import { initializeSpeechRecognitionNamespace } from "../features/salesAssist/sockets/speechRecognition.js";
import { instrument } from "@socket.io/admin-ui";

export default function socketConnect(server: HttpServer): SocketIOServer {
  const allowedOrigins = [
    "http://localhost:8080",
    "http://localhost:3000",
    "http://localhost:3001",
    "https://www.flushjohn.com",
    "http://www.flushjohn.com",
    "https://flushjohn.com",
    "http://flushjohn.com",
  ];

  // Custom origin validation to allow all flushjohn.com subdomains
  const validateOrigin = (
    origin: string | undefined,
    callback: (err: Error | null, success?: boolean) => void
  ): void => {
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow any flushjohn.com domain (including subdomains)
    try {
      const url = new URL(origin);
      if (
        url.hostname.endsWith(".flushjohn.com") ||
        url.hostname === "flushjohn.com"
      ) {
        return callback(null, true);
      }
    } catch (e) {
      // Invalid URL
    }

    callback(new Error("Not allowed by CORS"), false);
  };

  const io = new SocketIOServer(server, {
    cors: {
      origin: validateOrigin as any,
      credentials: true,
    },
  });
  instrument(io, { auth: false });
  const leadsNamespace = io.of("/leads");
  leadsNamespace.on("connection", async (socket: Socket) => {
    leadSocketHandler(leadsNamespace, socket);
  });

  const salesOrdersNamespace = io.of("/salesOrders");
  salesOrdersNamespace.on("connection", async (socket: Socket) => {
    salesOrderSocketHandler(salesOrdersNamespace, socket);
  });

  // Initialize speech recognition namespace
  const speechRecognitionNamespace = initializeSpeechRecognitionNamespace(io);

  // Make io instance globally available for HTTP routes
  global.io = io;
  global.leadsNamespace = leadsNamespace;
  global.salesOrdersNamespace = salesOrdersNamespace;
  global.speechRecognitionNamespace = speechRecognitionNamespace;

  return io;
}
