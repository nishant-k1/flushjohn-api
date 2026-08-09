import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import CsrfToken from "./csrfTokenModel.js";

let storeWarningLogged = false;

const storeToken = async (sessionId: string, token: string): Promise<void> => {
  try {
    await (CsrfToken as any).findOneAndUpdate(
      { sessionId },
      { sessionId, token, createdAt: new Date() },
      { upsert: true, new: true }
    );
  } catch (error: any) {
    if (!storeWarningLogged) {
      console.warn("⚠️ CSRF: MongoDB unavailable, falling back to memory store:", error.message);
      storeWarningLogged = true;
    }
    fallbackMemoryStore.set(sessionId, { token, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
  }
};

const getStoredToken = async (sessionId: string): Promise<{ token: string; expired: boolean } | null> => {
  try {
    const doc = await (CsrfToken as any).findOne({ sessionId });
    if (!doc) return null;
    return { token: doc.token, expired: false };
  } catch {
    const entry = fallbackMemoryStore.get(sessionId);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      fallbackMemoryStore.delete(sessionId);
      return { token: entry.token, expired: true };
    }
    return { token: entry.token, expired: false };
  }
};

const deleteToken = async (sessionId: string): Promise<void> => {
  try {
    await (CsrfToken as any).deleteOne({ sessionId });
  } catch {
    fallbackMemoryStore.delete(sessionId);
  }
};

const fallbackMemoryStore = new Map<string, { token: string; expiresAt: number }>();

const getSessionId = (req: Request): string => {
  if (req.headers["x-session-id"]) {
    return req.headers["x-session-id"] as string;
  }
  if ((req as any).user?.userId) {
    return (req as any).user.userId;
  }
  if (req.ip) {
    return req.ip;
  }
  return "anonymous";
};

export const generateCsrfToken = async (req: Request, res: Response): Promise<string> => {
  const sessionId = getSessionId(req);
  const token = crypto.randomBytes(32).toString("hex");
  await storeToken(sessionId, token);
  res.setHeader("X-CSRF-Token", token);
  return token;
};

export const validateCsrfToken = async (req: Request): Promise<boolean> => {
  const sessionId = getSessionId(req);
  const tokenFromHeader = req.headers["x-csrf-token"] as string;

  const stored = await getStoredToken(sessionId);
  if (!stored) {
    console.warn("❌ CSRF token not found for session:", sessionId.substring(0, 20));
    return false;
  }

  if (stored.expired) {
    await deleteToken(sessionId);
    console.warn("❌ CSRF token expired for session:", sessionId.substring(0, 20));
    return false;
  }

  if (!tokenFromHeader) {
    console.warn("❌ CSRF token missing in header for session:", sessionId.substring(0, 20));
    return false;
  }

  const isValid = stored.token === tokenFromHeader;
  if (!isValid && process.env.NODE_ENV === "development") {
    console.warn("❌ CSRF token mismatch for session:", sessionId.substring(0, 20));
  }
  return isValid;
};

export const csrfProtection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const stateChangingMethods = ["POST", "PUT", "PATCH", "DELETE"];
  const isStateChanging = stateChangingMethods.includes(req.method);

  if (req.method === "GET") {
    await generateCsrfToken(req, res);
  }

  if (req.path.startsWith("/health")) {
    return next();
  }

  if (isStateChanging) {
    const skipPaths = [
      "/payments/webhook",
      "/leads",
      "/auth",
    ];

    const shouldSkip = skipPaths.some((path) => req.path.startsWith(path));

    if (!shouldSkip && !(await validateCsrfToken(req))) {
      const sessionId = getSessionId(req);
      res.status(403).json({
        success: false,
        message: "CSRF token validation failed. Please refresh the page and try again.",
        error: "CSRF_TOKEN_INVALID",
        ...(process.env.NODE_ENV === "development" && {
          hint: `Session ID used: ${sessionId}. Make sure you've made a GET request first to obtain a CSRF token.`,
        }),
      });
      return;
    }
  }

  next();
};

export const getCsrfToken = async (req: Request, res: Response): Promise<void> => {
  const token = await generateCsrfToken(req, res);
  res.json({
    success: true,
    token,
  });
};
