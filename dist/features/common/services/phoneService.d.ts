/**
 * Phone Service - Handles phone.com API integration
 */
/**
 * Initiate a phone call via phone.com API
 * @param {string} phoneNumber - The phone number to call (formatted)
 * @returns {Promise<Object>} Response from phone.com API
 */
export declare const initiateCall: (phoneNumber: any) => Promise<{
    success: boolean;
    method: string;
    phoneNumber: any;
    telLink: string;
    data?: undefined;
    error?: undefined;
} | {
    success: boolean;
    method: string;
    phoneNumber: any;
    data: any;
    telLink?: undefined;
    error?: undefined;
} | {
    success: boolean;
    method: string;
    phoneNumber: any;
    telLink: string;
    error: any;
    data?: undefined;
}>;
//# sourceMappingURL=phoneService.d.ts.map