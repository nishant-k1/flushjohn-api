/**
 * ObjectId Serialization Utilities
 * 
 * Converts MongoDB ObjectIds to strings for consistent JSON serialization.
 * Handles ObjectIds in nested objects and arrays.
 */

/**
 * Check if a value is a MongoDB ObjectId-like object
 */
function isObjectIdLike(value: any): boolean {
  if (!value || typeof value !== "object") return false;
  
  // Check for Mongoose ObjectId instance
  if (value.constructor && value.constructor.name === "ObjectId") {
    return true;
  }
  
  // Check if it has ObjectId-like structure
  if (typeof value.toString === "function") {
    // Mongoose ObjectIds have toString() method
    const str = value.toString();
    // ObjectIds are 24 character hex strings
    if (typeof str === "string" && /^[0-9a-fA-F]{24}$/.test(str)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Convert ObjectId to string
 */
function objectIdToString(value: any): string {
  if (typeof value === "string") {
    return value;
  }
  
  if (isObjectIdLike(value)) {
    if (typeof value.toString === "function") {
      return String(value.toString());
    }
    return String(value);
  }
  
  return String(value);
}

/**
 * Recursively convert all ObjectIds in an object/array to strings
 * 
 * @param data - Data structure that may contain ObjectIds
 * @returns Data structure with all ObjectIds converted to strings
 */
export function serializeObjectIds(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle ObjectId-like objects
  if (isObjectIdLike(data)) {
    return objectIdToString(data);
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => serializeObjectIds(item));
  }

  // Handle objects
  if (typeof data === "object" && data.constructor === Object) {
    const serialized: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key];
        
        // Special handling for common ObjectId fields
        if (
          key === "_id" ||
          key === "userId" ||
          key === "leadId" ||
          key === "customerId" ||
          key === "quoteId" ||
          key === "salesOrderId" ||
          key === "jobOrderId" ||
          key === "vendorId" ||
          key === "productId" ||
          key === "paymentId"
        ) {
          serialized[key] = objectIdToString(value);
        } else {
          serialized[key] = serializeObjectIds(value);
        }
      }
    }
    return serialized;
  }

  // Return primitive values as-is
  return data;
}
