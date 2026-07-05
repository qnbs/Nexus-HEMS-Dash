import type { NextFunction, Request, Response } from 'express';
import { isReadOnlyMode } from '../config/read-only-mode.js';

/**
 * Express middleware that rejects hardware-affecting mutations when
 * READ_ONLY_MODE=true is set. Place this BEFORE the route handler and
 * AFTER requireJWT / requireScope.
 *
 * Returns 403 with a clear safety message and logs the rejection.
 */
export function requireNotReadOnly(_req: Request, res: Response, next: NextFunction): void {
  if (isReadOnlyMode()) {
    res.status(403).json({
      error: 'READ_ONLY_MODE=true blocks all hardware control commands',
      readOnly: true,
    });
    return;
  }
  next();
}
