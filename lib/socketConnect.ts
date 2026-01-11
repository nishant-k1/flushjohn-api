import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { Socket } from "socket.io";
import { leadSocketHandler } from "../features/leads/sockets/leads.js";
import { salesOrderSocketHandler } from "../features/salesOrders/sockets/salesOrders.js";
import { initializeSpeechRecognitionNamespace } from "../features/salesAssist/sockets/speechRecognition.js";
import { instrument } from "@socket.io/admin-ui";
import jwt from "jsonwebtoken";
import User from "../features/auth/models/User.js";

/**
 * Verify JWT token for socket connection
 * CRITICAL FIX: Added authentication middleware for socket connections
 */
const verifySocketToken = async (
  socket: Socket,
  next: (err?: Error) => void
): Promise<void> => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    
    if (!token || typeof token !== "string") {
      return next(new Error("Authentication token required"));
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY!, {
      algorithms: ["HS256"],
    }) as { userId: string; iat?: number };

    if (!decoded.userId) {
      return next(new Error("Invalid token format"));
    }

    // Verify user exists and is active
    const user = await (User as any).findOne({ userId: decoded.userId });
    if (!user) {
      return next(new Error("User not found"));
    }

    if (!user.isActive) {
      return next(new Error("Account is deactivated"));
    }

    if (user.isLocked && user.isLocked()) {
      return next(new Error("Account is locked"));
    }

    // Attach user info to socket for authorization checks
    (socket as any).user = user;
    (socket as any).userId = decoded.userId;
    
    next();
  } catch (error: any) {
    if (error.name === "JsonWebTokenError") {
      return next(new Error("Invalid token"));
    }
    if (error.name === "TokenExpiredError") {
      return next(new Error("Token expired"));
    }
    return next(new Error("Authentication failed"));
  }
};

/**
 * Get allowed origins from environment variables or use defaults
 * CRITICAL FIX: Uses environment variables instead of hardcoded values
 */
const getAllowedOrigins = (): string[] => {
  if (process.env.ORIGINS) {
    return process.env.ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
  }
  
  // Fallback to default origins if ORIGINS env var not set
  return [
    "http://localhost:8080",
    "http://localhost:3000",
    "http://localhost:3001",
    "https://www.flushjohn.com",
    "http://www.flushjohn.com",
    "https://flushjohn.com",
    "http://flushjohn.com",
  ];
};

export default function socketConnect(server: HttpServer): SocketIOServer {
  const allowedOrigins = getAllowedOrigins();

  // CRITICAL FIX: Custom origin validation using environment configuration
  // Allows all flushjohn.com subdomains if ALLOW_SUBDOMAINS is set
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

    // Allow any flushjohn.com domain (including subdomains) if configured
    const allowSubdomains = process.env.ALLOW_SUBDOMAINS === "true" || 
                           process.env.NODE_ENV === "development";
    
    if (allowSubdomains) {
      try {
        const url = new URL(origin);
        if (
          url.hostname.endsWith(".flushjohn.com") ||
          url.hostname === "flushjohn.com"
        ) {
          return callback(null, true);
        }
      } catch (e) {
        // Invalid URL - fall through to rejection
      }
    }

    callback(new Error("Not allowed by CORS"), false);
  };

  const io = new SocketIOServer(server, {
    cors: {
      origin: validateOrigin as any,
      credentials: true,
    },
    // Keep connection alive settings
    pingTimeout: 60000, // 60 seconds before considering disconnected
    pingInterval: 25000, // Send ping every 25 seconds
    transports: ["websocket", "polling"], // Allow both transports
    allowUpgrades: true,
    connectTimeout: 45000,
  });
  instrument(io, { auth: false });
  
  // Socket namespace for leads - with authentication
  const leadsNamespace = io.of("/leads");
  
  // Apply authentication middleware
  leadsNamespace.use(verifySocketToken);
  
  leadsNamespace.on("connection", async (socket: Socket) => {
    const userId = (socket as any).userId || "anonymous";
    const userEmail = (socket as any).user?.email || "unknown";
    console.log(`✅ Client connected to /leads namespace - User: ${userEmail}, Socket ID: ${socket.id}`);
    
    socket.on("disconnect", (reason) => {
      console.log(`❌ Client disconnected from /leads - User: ${userEmail}, Reason: ${reason}`);
    });
    
    leadSocketHandler(leadsNamespace, socket);
  });

  const salesOrdersNamespace = io.of("/salesOrders");
  salesOrdersNamespace.use(verifySocketToken);
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
