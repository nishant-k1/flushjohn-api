declare const DB_CONFIG: {
    readonly options: {
        readonly maxPoolSize: 10;
        readonly serverSelectionTimeoutMS: 5000;
        readonly socketTimeoutMS: 45000;
        readonly bufferCommands: false;
        readonly retryWrites: true;
        readonly retryReads: true;
    };
    readonly states: {
        readonly DISCONNECTED: 0;
        readonly CONNECTED: 1;
        readonly CONNECTING: 2;
        readonly DISCONNECTING: 3;
    };
};
type ConnectionState = typeof DB_CONFIG.states.DISCONNECTED | typeof DB_CONFIG.states.CONNECTED | typeof DB_CONFIG.states.CONNECTING | typeof DB_CONFIG.states.DISCONNECTING;
interface ConnectionStatus {
    state: ConnectionState;
    stateName: string;
    isConnected: boolean;
    mongooseState: number;
    host: string;
    name: string;
    port: number;
}
/**
 * ✅ STANDARDIZED: Enhanced database connection function
 */
export declare const dbConnect: () => Promise<boolean>;
/**
 * ✅ STANDARDIZED: Graceful database disconnection
 */
export declare const dbDisconnect: () => Promise<void>;
/**
 * ✅ STANDARDIZED: Check database connection status
 */
export declare const getConnectionStatus: () => ConnectionStatus;
/**
 * ✅ STANDARDIZED: Wait for database connection
 */
export declare const waitForConnection: (timeout?: number) => Promise<boolean>;
export default dbConnect;
//# sourceMappingURL=dbConnect.d.ts.map