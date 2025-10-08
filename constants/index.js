// Company information
export const flushjohn = {
  cName: "Flush John",
  homepage: "https://www.flushjohn.com",
  email: "support@flushjohn.com",
  phone: "(877) 790-7062",
  phone_link: "tel:+18777907062",
  email_signature: `
Best regards,
Flush John Team
support@flushjohn.com
(877) 790-7062
www.flushjohn.com`,
};

export const quengenesis = {
  cName: "Quengenesis LLC",
  homepage: "https://www.quengenesis.com",
  email: "support@quengenesis.com",
  phone: "(555) 123-4567",
  phone_link: "tel:+15551234567",
  email_signature: `
Best regards,
Quengenesis LLC Team
support@quengenesis.com
(555) 123-4567
www.quengenesis.com`,
};

// S3 Assets URL
export const s3assets =
  process.env.NEXT_PUBLIC_S3_URL ||
  "https://flushjohn-assets.s3.us-east-1.amazonaws.com";

// CDN URL
export const cdnUrl =
  process.env.NEXT_PUBLIC_CLOUD_FRONT_URL || "https://cdn.flushjohn.com";

// API Base URLs
export const apiBaseUrls = {
  API_BASE_URL: process.env.API_BASE_URL || "http://localhost:8080",
  CRM_BASE_URL: process.env.CRM_BASE_URL || "http://localhost:3001",
};

// Local Assets URL (for PDF generation)
export const localAssetsUrl =
  process.env.API_BASE_URL || "http://localhost:8080";
