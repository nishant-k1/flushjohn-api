/**
 * Aggregate Audio Capture Service
 * Captures audio from an Aggregate Device that combines:
 * - MacBook Air microphone (operator audio)
 * - BlackHole 16ch input (customer/vendor audio from system)
 *
 * Separates the channels and routes them to appropriate streams
 */
export declare const startAggregateAudioCapture: (onOperatorData: any, onCustomerData: any, onError: any) => {
    stop: () => void;
    device: string;
    stream: any;
    recording: any;
};
/**
 * Validate aggregate device configuration
 * Returns validation result with detailed error information
 */
export declare const validateConfiguration: () => boolean;
//# sourceMappingURL=aggregateAudioCapture.d.ts.map