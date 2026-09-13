
// A middleware *factory* — call it with allowed roles, get back the
// actual middleware. Must run after verifyAuth, since it needs req.user.

import { Request, Response, NextFunction } from "express";

export function requireRole(...allowedRoles: Array<"member" | "staff" | "admin">) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };
}