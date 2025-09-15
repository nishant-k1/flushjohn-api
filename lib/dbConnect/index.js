import mongoose from "mongoose";

// ✅ STANDARDIZED: Database connection configuration
const DB_CONFIG = {
  // Connection options for better performance and reliability
  options: {
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    bufferMaxEntries: 0, // Disable mongoose buffering
    bufferCommands: false, // Disable mongoose buffering
    retryWrites: true, // Retry write operations
    retryReads: true, // Retry read operations
  },
  // Connection states
  states: {
    DISCONNECTED: 0,
    CONNECTED: 1,
    CONNECTING: 2,
    DISCONNECTING: 3,
  },
};

// ✅ STANDARDIZED: Connection state tracking
let connectionState = DB_CONFIG.states.DISCONNECTED;
let connectionPromise = null;

/**
 * ✅ STANDARDIZED: Enhanced database connection function
 * @returns {Promise<void>}
 */
export const dbConnect = async () => {
  // Prevent multiple simultaneous connection attempts
  if (connectionPromise) {
    return connectionPromise;
  }

  // Check if already connected
  if (connectionState === DB_CONFIG.states.CONNECTED) {
    console.log("✅ Database already connected");
    return;
  }

  // Check if currently connecting
  if (connectionState === DB_CONFIG.states.CONNECTING) {
    console.log("⏳ Database connection in progress...");
    return connectionPromise;
  }

  // Validate environment variable
  if (!process.env.MONGO_DB_URI) {
    const error = new Error("MONGO_DB_URI environment variable is required");
    console.error("❌ Database connection failed:", error.message);
    throw error;
  }

  connectionState = DB_CONFIG.states.CONNECTING;
  console.log("🔄 Connecting to database...");

  connectionPromise = (async () => {
    try {
      await mongoose.connect(process.env.MONGO_DB_URI, DB_CONFIG.options);

      connectionState = DB_CONFIG.states.CONNECTED;
      console.log("✅ Database connected successfully");
      console.log(`📊 Connection state: ${mongoose.connection.readyState}`);
      console.log(`🏠 Host: ${mongoose.connection.host}`);
      console.log(`📝 Database: ${mongoose.connection.name}`);

      return true;
    } catch (error) {
      connectionState = DB_CONFIG.states.DISCONNECTED;
      connectionPromise = null;

      console.error("❌ Database connection failed:");
      console.error("   Error:", error.message);
      console.error("   Code:", error.code);

      // Handle specific MongoDB errors
      if (error.name === "MongoServerError") {
        console.error("   MongoDB Server Error - Check your database server");
      } else if (error.name === "MongoNetworkError") {
        console.error(
          "   Network Error - Check your connection and database URL"
        );
      } else if (error.name === "MongoParseError") {
        console.error("   Parse Error - Check your MongoDB URI format");
      }

      throw error;
    }
  })();

  return connectionPromise;
};

/**
 * ✅ STANDARDIZED: Graceful database disconnection
 * @returns {Promise<void>}
 */
export const dbDisconnect = async () => {
  if (connectionState === DB_CONFIG.states.DISCONNECTED) {
    console.log("ℹ️  Database already disconnected");
    return;
  }

  if (connectionState === DB_CONFIG.states.CONNECTING) {
    console.log(
      "⏳ Waiting for connection to complete before disconnecting..."
    );
    try {
      await connectionPromise;
    } catch (error) {
      console.log("⚠️  Connection failed, proceeding with disconnect");
    }
  }

  try {
    connectionState = DB_CONFIG.states.DISCONNECTING;
    console.log("🔄 Disconnecting from database...");

    await mongoose.disconnect();
    connectionState = DB_CONFIG.states.DISCONNECTED;
    connectionPromise = null;

    console.log("✅ Database disconnected successfully");
  } catch (error) {
    console.error("❌ Database disconnection failed:", error.message);
    throw error;
  }
};

/**
 * ✅ STANDARDIZED: Check database connection status
 * @returns {Object} Connection status information
 */
export const getConnectionStatus = () => {
  const stateNames = {
    [DB_CONFIG.states.DISCONNECTED]: "DISCONNECTED",
    [DB_CONFIG.states.CONNECTED]: "CONNECTED",
    [DB_CONFIG.states.CONNECTING]: "CONNECTING",
    [DB_CONFIG.states.DISCONNECTING]: "DISCONNECTING",
  };

  return {
    state: connectionState,
    stateName: stateNames[connectionState],
    isConnected: connectionState === DB_CONFIG.states.CONNECTED,
    mongooseState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
    port: mongoose.connection.port,
  };
};

/**
 * ✅ STANDARDIZED: Wait for database connection
 * @param {number} timeout - Maximum time to wait in milliseconds
 * @returns {Promise<boolean>} True if connected, false if timeout
 */
export const waitForConnection = async (timeout = 10000) => {
  const startTime = Date.now();

  while (connectionState !== DB_CONFIG.states.CONNECTED) {
    if (Date.now() - startTime > timeout) {
      console.warn("⏰ Database connection timeout");
      return false;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return true;
};

// ✅ STANDARDIZED: Event listeners for connection monitoring
mongoose.connection.on("connected", () => {
  console.log("🔗 Mongoose connected to MongoDB");
  connectionState = DB_CONFIG.states.CONNECTED;
});

mongoose.connection.on("error", (error) => {
  console.error("❌ Mongoose connection error:", error);
  connectionState = DB_CONFIG.states.DISCONNECTED;
});

mongoose.connection.on("disconnected", () => {
  console.log("🔌 Mongoose disconnected from MongoDB");
  connectionState = DB_CONFIG.states.DISCONNECTED;
});

// ✅ STANDARDIZED: Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);

  try {
    await dbDisconnect();
    console.log("✅ Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during graceful shutdown:", error);
    process.exit(1);
  }
};

// ✅ STANDARDIZED: Register shutdown handlers
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGUSR2", () => gracefulShutdown("SIGUSR2")); // For nodemon

// ✅ STANDARDIZED: Handle uncaught exceptions
process.on("uncaughtException", async (error) => {
  console.error("💥 Uncaught Exception:", error);
  await dbDisconnect();
  process.exit(1);
});

process.on("unhandledRejection", async (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
  await dbDisconnect();
  process.exit(1);
});

// ✅ STANDARDIZED: Export all functions
export default dbConnect;
export { dbDisconnect, getConnectionStatus, waitForConnection };
