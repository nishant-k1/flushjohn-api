import mongoose from "mongoose";

// ✅ STANDARDIZED: Database connection configuration
const DB_CONFIG = {
  // Connection options for better performance and reliability
  options: {
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
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

    return;
  }

  // Check if currently connecting
  if (connectionState === DB_CONFIG.states.CONNECTING) {

    return connectionPromise;
  }

  // Validate environment variable
  if (!process.env.MONGO_DB_URI) {
    const error = new Error("MONGO_DB_URI environment variable is required");

    throw error;
  }

  connectionState = DB_CONFIG.states.CONNECTING;


  connectionPromise = (async () => {
    try {
      await mongoose.connect(process.env.MONGO_DB_URI, DB_CONFIG.options);

      connectionState = DB_CONFIG.states.CONNECTED;





      return true;
    } catch (error) {
      connectionState = DB_CONFIG.states.DISCONNECTED;
      connectionPromise = null;





      // Handle specific MongoDB errors
      if (error.name === "MongoServerError") {
        // MongoDB Server Error - Check your database server
      } else if (error.name === "MongoNetworkError") {
        // Network Error - Check your connection and database URL
      } else if (error.name === "MongoParseError") {
        // Parse Error - Check your MongoDB URI format
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

    return;
  }

  if (connectionState === DB_CONFIG.states.CONNECTING) {
    // Waiting for connection to complete before disconnecting
    try {
      await connectionPromise;
    } catch (error) {
      // Connection failed, proceeding with disconnect
    }
  }

  try {
    connectionState = DB_CONFIG.states.DISCONNECTING;
    // Disconnecting from database
    await mongoose.disconnect();
    connectionState = DB_CONFIG.states.DISCONNECTED;
    connectionPromise = null;
    // Database disconnected successfully
  } catch (error) {
    // Database disconnection failed
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
      // Database connection timeout
      return false;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return true;
};

// ✅ STANDARDIZED: Event listeners for connection monitoring
mongoose.connection.on("connected", () => {
  // Mongoose connected to MongoDB
  connectionState = DB_CONFIG.states.CONNECTED;
});

mongoose.connection.on("error", (error) => {
  // Mongoose connection error
  connectionState = DB_CONFIG.states.DISCONNECTED;
});

mongoose.connection.on("disconnected", () => {
  // Mongoose disconnected from MongoDB
  connectionState = DB_CONFIG.states.DISCONNECTED;
});

// ✅ STANDARDIZED: Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  // Received signal, gracefully shutting down
  try {
    await dbDisconnect();
    // Graceful shutdown completed
    process.exit(0);
  } catch (error) {
    // Error during graceful shutdown
    process.exit(1);
  }
};

// ✅ STANDARDIZED: Register shutdown handlers
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGUSR2", () => gracefulShutdown("SIGUSR2")); // For nodemon

// ✅ STANDARDIZED: Handle uncaught exceptions
process.on("uncaughtException", async (error) => {
  // Uncaught Exception
  await dbDisconnect();
  process.exit(1);
});

process.on("unhandledRejection", async (reason, promise) => {
  // Unhandled Rejection
  await dbDisconnect();
  process.exit(1);
});

// ✅ STANDARDIZED: Export all functions
export default dbConnect;
