/**
 * Phone Service - Handles phone.com API integration
 */
import axios from "axios";
/**
 * Initiate a phone call via phone.com API
 * @param {string} phoneNumber - The phone number to call (formatted)
 * @returns {Promise<Object>} Response from phone.com API
 */
export const initiateCall = async (phoneNumber) => {
    if (!phoneNumber) {
        throw new Error("Phone number is required");
    }
    // Clean phone number (remove any non-digit characters except +)
    const cleanedPhone = phoneNumber.replace(/[^\d+]/g, "");
    if (!cleanedPhone) {
        throw new Error("Invalid phone number format");
    }
    // Get phone.com API configuration from environment variables
    const phoneComApiUrl = process.env.PHONE_COM_API_URL;
    const phoneComApiKey = process.env.PHONE_COM_API_KEY;
    if (!phoneComApiUrl || !phoneComApiKey) {
        // If phone.com API is not configured, return a tel: link format
        // The frontend can use this to initiate a call via device dialer
        return {
            success: true,
            method: "tel",
            phoneNumber: cleanedPhone,
            telLink: `tel:${cleanedPhone}`,
        };
    }
    try {
        // Make API call to phone.com to initiate the call
        const response = await axios.post(phoneComApiUrl, {
            phoneNumber: cleanedPhone,
        }, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${phoneComApiKey}`,
            },
            timeout: 10000, // 10 second timeout
        });
        return {
            success: true,
            method: "api",
            phoneNumber: cleanedPhone,
            data: response.data,
        };
    }
    catch (error) {
        console.error("Phone.com API error:", error.message);
        // If API call fails, fallback to tel: link
        return {
            success: true,
            method: "tel",
            phoneNumber: cleanedPhone,
            telLink: `tel:${cleanedPhone}`,
            error: error.message,
        };
    }
};
//# sourceMappingURL=phoneService.js.map