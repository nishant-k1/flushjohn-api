/**
 * Email Signature Constants
 * Uses environment variables directly - no hardcoded values
 * Import and use these functions where email signatures are needed
 */

// FlushJohn Email Signature
export const getFlushJohnEmailSignature = () => {
  if (process.env.FLUSH_JOHN_EMAIL_SIGNATURE) {
    return process.env.FLUSH_JOHN_EMAIL_SIGNATURE;
  }

  // Build signature from environment variables
  const parts = [
    "Best regards,",
    "Flush John Team",
    "",
    process.env.FLUSH_JOHN_COMPANY_NAME,
    process.env.FLUSH_JOHN_TAGLINE,
  ];

  if (process.env.FLUSH_JOHN_PHONE) {
    parts.push(`Phone: ${process.env.FLUSH_JOHN_PHONE}`);
  }

  const email = process.env.FLUSH_JOHN_EMAIL_ID;
  if (email) {
    parts.push(`Email: ${email}`);
  }

  if (process.env.FLUSH_JOHN_ADDRESS) {
    parts.push(process.env.FLUSH_JOHN_ADDRESS);
  }

  return parts.join("\n");
};

// QuenGenesis Email Signature
export const getQuenGenesisEmailSignature = () => {
  if (process.env.QUENGENESIS_EMAIL_SIGNATURE) {
    return process.env.QUENGENESIS_EMAIL_SIGNATURE;
  }

  // Build signature from environment variables
  const parts = [
    "Best regards,",
    "QuenGenesis Team",
    "",
    process.env.QUENGENESIS_COMPANY_NAME,
  ];

  const email = process.env.QUENGENESIS_EMAIL_ID;
  if (email) {
    parts.push(`Email: ${email}`);
  }

  if (process.env.QUENGENESIS_PHONE) {
    parts.push(`Phone: ${process.env.QUENGENESIS_PHONE}`);
  }

  if (process.env.QUENGENESIS_ADDRESS) {
    parts.push(process.env.QUENGENESIS_ADDRESS);
  }

  return parts.join("\n");
};
