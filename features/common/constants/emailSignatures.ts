/**
 * Email Signature Constants
 * Uses environment variables directly - no hardcoded values
 * Import and use these functions where email signatures are needed
 */

// FlushJohn Email Signature
export const getFlushJohnEmailSignature = (): string => {
  if (process.env.FLUSH_JOHN_EMAIL_SIGNATURE) {
    return process.env.FLUSH_JOHN_EMAIL_SIGNATURE;
  }

  // Build signature from environment variables
  const parts: (string | undefined)[] = [
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

  return parts.filter((part): part is string => part !== undefined).join("\n");
};

// QuenGenesis Email Signature
export const getQuenGenesisEmailSignature = (user: any = null): string => {
  if (process.env.QUENGENESIS_EMAIL_SIGNATURE) {
    return process.env.QUENGENESIS_EMAIL_SIGNATURE;
  }

  // Use CRM username if available, otherwise fall back to "Quengenesis Team"
  let senderName = "Quengenesis Team";
  if (user && user.fName && user.lName) {
    senderName = `${user.fName} ${user.lName}`;
  } else if (user && user.fName) {
    senderName = user.fName;
  }

  // Build signature from environment variables
  const parts: (string | undefined)[] = [
    "Best regards,",
    senderName,
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

  return parts.filter((part): part is string => part !== undefined).join("\n");
};
