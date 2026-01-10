// These are embedded directly in the HTML to ensure logos appear in PDFs
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let flushjohnLogoBase64 = "";
let quengenesisLogoBase64 = "";

try {
  const flushjohnLogoPath = join(
    __dirname,
    "public",
    "logos",
    "flush_john_logo_black.svg"
  );
  const quengenesisLogoPath = join(
    __dirname,
    "public",
    "logos",
    "logo_quengenesis.svg"
  );

  const flushjohnLogoSvg = readFileSync(flushjohnLogoPath, "utf-8");
  const quengenesisLogoSvg = readFileSync(quengenesisLogoPath, "utf-8");

  flushjohnLogoBase64 = `data:image/svg+xml;base64,${Buffer.from(
    flushjohnLogoSvg
  ).toString("base64")}`;
  quengenesisLogoBase64 = `data:image/svg+xml;base64,${Buffer.from(
    quengenesisLogoSvg
  ).toString("base64")}`;
} catch (error) {
  console.warn(
    "⚠️  Could not load logo files for base64 encoding:",
    error.message
  );
  // Fallback to URL-based approach if file reading fails
}

export const logoDataUris = {
  flushjohn: flushjohnLogoBase64,
  quengenesis: quengenesisLogoBase64,
};

// Removed apiBaseUrls - use process.env.API_BASE_URL and process.env.FLUSH_JOHN_WEBSITE_URL directly where needed
