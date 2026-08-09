import { Request, Response, NextFunction } from "express";

let AuditLog: any = null;

const getModel = async () => {
  if (!AuditLog) {
    AuditLog = (await import("../features/common/models/AuditLog.js")).default;
  }
  return AuditLog;
};

export const auditMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    if (body?.success && ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      try {
        const entityType = req.path.split("/")[1] || "unknown";
        const entityId = req.params?.id || body?.data?._id || body?.data?.id;
        const user = (req as any).user;

        (async () => {
          try {
            const model = await getModel();
            await (model as any).create({
              userId: user?.userId || user?._id,
              userEmail: user?.email,
              action: req.method,
              entityType,
              entityId: entityId?.toString(),
              requestId: (req as any).requestId,
              ip: req.ip,
            });
          } catch {}
        })();
      } catch {}
    }
    return originalJson(body);
  };
  next();
};
