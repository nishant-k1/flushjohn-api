import { Server } from "socket.io";
import { leadSocketHandler } from "../../features/leads/sockets/leads.js";
import { initializeSpeechRecognitionNamespace } from "../../features/salesAssist/sockets/speechRecognition.js";
import { instrument } from "@socket.io/admin-ui";

export default function socketConnect(server) {
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
  const validateOrigin = (origin, callback) => {
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

  const io = new Server(server, {
    cors: {
      origin: validateOrigin,
      credentials: true,
    },
  });
  instrument(io, { auth: false });
  const leadsNamespace = io.of("/leads");
  leadsNamespace.on("connection", async (socket) => {
    leadSocketHandler(leadsNamespace, socket);
  });

  // Initialize speech recognition namespace
  const speechRecognitionNamespace = initializeSpeechRecognitionNamespace(io);

  // Make io instance globally available for HTTP routes
  global.io = io;
  global.leadsNamespace = leadsNamespace;
  global.speechRecognitionNamespace = speechRecognitionNamespace;

  return io;
}
