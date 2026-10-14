import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { IUser, UserRole } from '../types.ts';
import { db } from '../db/database.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'conduct-assistant-secret-key-2026';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export function generateToken(user: IUser): string {
  return jwt.sign(
    {
      _id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Authentication required. No token provided.' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { _id: string };
    const user = await db.users.findById(payload._id);
    if (!user) {
      res.status(401).json({ error: 'User account not found or deactivated.' });
      return;
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired authentication token.' });
  }
}

// Optional auth for public viewing
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { _id: string };
      const user = await db.users.findById(payload._id);
      if (user) {
        req.user = user;
      }
    } catch {
      // Ignore token failure for optional auth
    }
  }
  next();
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Requires one of the following roles: ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
}

export async function logAuditEvent(
  user: IUser | undefined,
  action: string,
  resource: string,
  resourceId?: string,
  details?: Record<string, unknown>,
  ip?: string
): Promise<void> {
  try {
    await db.auditLogs.insertOne({
      _id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: user?._id || 'system_guest',
      userName: user?.name || 'Anonymous User',
      userRole: user?.role || 'student_employee',
      action,
      resource,
      resourceId,
      details,
      ipAddress: ip || '127.0.0.1',
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error('Audit log failure:', e);
  }
}
