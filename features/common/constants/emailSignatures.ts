/**
 * Email Signature Constants
 * Uses environment variables directly from .env - dynamically constructs variable names
 * Import and use these functions where email signatures are needed
 */

/**
 * Get environment variable dynamically by prefix
 * @param prefix - Environment variable prefix (e.g., "FLUSH_JOHN", "SITEWAY_SERVICES")
 * @param varName - Variable name without prefix (e.g., "EMAIL_ID")
 * @returns Environment variable value or undefined
 */
function getEnvVar(prefix: string, varName: string): string | undefined {
  return process.env[`${prefix}_${varName}`];
}

/**
 * Generic email signature generator using dynamic env var access
 * @param envPrefix - Environment variable prefix
 * @param defaultTeamName - Default team name if user not provided
 * @param user - Optional user object for personalized signatures
 * @returns Email signature string
 */
function getEmailSignature(
  envPrefix: string,
  defaultTeamName: string,
  user: any = null
): string {
  // Use custom signature if provided
  const emailSignature = getEnvVar(envPrefix, "EMAIL_SIGNATURE");
  if (emailSignature) {
    return emailSignature;
  }

  // Determine sender name
  let senderName = defaultTeamName;
  if (user && user.fName && user.lName) {
    senderName = `${user.fName} ${user.lName}`;
  } else if (user && user.fName) {
    senderName = user.fName;
  }

  // Build signature from environment variables
  const parts: (string | undefined)[] = ["Best regards,", senderName, ""];

  // Add company name
  const companyName = getEnvVar(envPrefix, "COMPANY_NAME");
  if (companyName) {
    parts.push(companyName);
  }

  // Add tagline (only for FlushJohn)
  if (envPrefix === "FLUSH_JOHN") {
    const tagline = getEnvVar(envPrefix, "TAGLINE");
    if (tagline) {
      parts.push(tagline);
    }
  }

  // Add email
  const email = getEnvVar(envPrefix, "EMAIL_ID");
  if (email) {
    parts.push(`Email: ${email}`);
  }

  // Add phone
  const phone = getEnvVar(envPrefix, "PHONE");
  if (phone) {
    parts.push(`Phone: ${phone}`);
  }

  // Add address
  const address = getEnvVar(envPrefix, "ADDRESS");
  if (address) {
    parts.push(address);
  }

  return parts.filter((part): part is string => part !== undefined).join("\n");
}

// FlushJohn Email Signature
export const getFlushJohnEmailSignature = (): string => {
  return getEmailSignature("FLUSH_JOHN", "Flush John Team");
};

// Siteway Services Email Signature
export const getSitewayServicesEmailSignature = (user: any = null): string => {
  return getEmailSignature("SITEWAY_SERVICES", "Siteway Services Team", user);
};
