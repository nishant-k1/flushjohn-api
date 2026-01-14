/**
 * PDF Assets Utility
 * Loads and caches logo files as base64 data URIs for PDF generation
 * 
 * Note: Logos are embedded as base64 data URIs because PDF generators (Playwright/Puppeteer)
 * can't always access localhost URLs or external assets reliably.
 */

import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cache loaded logos to avoid re-reading files on every PDF generation
let cachedLogos: {
  flushjohn: string;
  sitewayServices: string;
} | null = null;

/**
 * Load logo files and convert to base64 data URIs
 * Caches result after first load
 */
function loadLogos(): { flushjohn: string; sitewayServices: string } {
  // Return cached logos if already loaded
  if (cachedLogos) {
    return cachedLogos;
  }

  // When compiled to dist/utils/pdfAssets.js, __dirname will be dist/utils
  // So we need to go up one level to dist/, then into public/
  const flushjohnLogoPath = join(
    __dirname,
    "..",
    "public",
    "logos",
    "flush_john_logo_black.svg"
  );
  const sitewayServicesLogoPath = join(
    __dirname,
    "..",
    "public",
    "logos",
    "siteway_logo_light_theme.png"
  );

  let flushjohnLogoBase64 = "";
  let sitewayServicesLogoBase64 = "";

  try {
    // Check if files exist before reading
    if (!existsSync(flushjohnLogoPath)) {
      throw new Error(
        `FlushJohn logo not found at: ${flushjohnLogoPath}\n__dirname: ${__dirname}`
      );
    }
    if (!existsSync(sitewayServicesLogoPath)) {
      throw new Error(
        `Siteway Services logo not found at: ${sitewayServicesLogoPath}\n__dirname: ${__dirname}`
      );
    }

    const flushjohnLogoSvg = readFileSync(flushjohnLogoPath, "utf-8");
    const sitewayServicesLogoBuffer = readFileSync(sitewayServicesLogoPath);

    flushjohnLogoBase64 = `data:image/svg+xml;base64,${Buffer.from(
      flushjohnLogoSvg
    ).toString("base64")}`;
    sitewayServicesLogoBase64 = `data:image/png;base64,${sitewayServicesLogoBuffer.toString("base64")}`;

    console.log("✅ Successfully loaded logo files for PDF generation");
  } catch (error: any) {
    console.error(
      "❌ Failed to load logo files for PDF generation:",
      error.message
    );
    console.error("Attempted paths:", {
      flushjohn: flushjohnLogoPath,
      sitewayServices: sitewayServicesLogoPath,
      __dirname,
    });
    // Logos will be empty strings, PDFs may not show logos but won't crash
  }

  // Cache the result
  cachedLogos = {
    flushjohn: flushjohnLogoBase64,
    sitewayServices: sitewayServicesLogoBase64,
  };

  return cachedLogos;
}

/**
 * Get logo data URIs for PDF generation
 * Lazy-loads logos on first access and caches them
 */
export function getLogoDataUris(): { flushjohn: string; sitewayServices: string } {
  return loadLogos();
}
