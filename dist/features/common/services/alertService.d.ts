declare class AlertService {
    constructor();
    /**
     * Send alerts for a new lead
     */
    sendLeadAlerts(lead: any): Promise<{
        telegram: {
            success: boolean;
            error: any;
        };
        timestamp: string;
    }>;
    /**
     * Format message for Telegram
     */
    formatTelegramMessage(lead: any): string;
    /**
     * Send message via Telegram Bot API
     */
    sendTelegramMessage(message: any): Promise<{
        success: boolean;
        error: any;
    }>;
    /**
     * Get status emoji based on lead status
     */
    getStatusEmoji(status: any): any;
    /**
     * Extract lead number from message for logging
     */
    extractLeadNumber(message: any): any;
    /**
     * Test connection to Telegram service
     */
    testConnection(): Promise<{
        telegram: {
            success: boolean;
            error: any;
        };
        timestamp: string;
    }>;
}
declare const _default: AlertService;
export default _default;
//# sourceMappingURL=alertService.d.ts.map