import { Router, Request, Response } from 'express';
import { db } from '../db/database.ts';
import {
  generateToken,
  hashPassword,
  comparePassword,
  authenticateToken,
  AuthenticatedRequest,
  logAuditEvent,
} from '../middleware/auth.ts';
import { IUser, UserRole } from '../types.ts';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role = 'student_employee', organization, department } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await db.users.findOne({ email: normalizedEmail });
    if (existing) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const validRole: UserRole = ['student_employee', 'policy_manager', 'admin'].includes(role)
      ? role
      : 'student_employee';

    const newUser: IUser = {
      _id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: validRole,
      organization: organization || 'Meridian Global Institute',
      department: department || 'General Member',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.users.insertOne(newUser);
    const token = generateToken(newUser);

    await logAuditEvent(newUser, 'USER_REGISTERED', 'User', newUser._id, { role: newUser.role });

    const { passwordHash: _, ...userSafe } = newUser;
    res.status(201).json({ user: userSafe, token });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'An unexpected server error occurred during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await db.users.findOne({ email: normalizedEmail });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = generateToken(user);
    await logAuditEvent(user, 'USER_LOGIN', 'User', user._id);

    const { passwordHash: _, ...userSafe } = user;
    res.json({ user: userSafe, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (req.user) {
    await logAuditEvent(req.user, 'USER_LOGOUT', 'User', req.user._id);
  }
  res.json({ message: 'Logged out successfully.' });
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { passwordHash: _, ...userSafe } = req.user;
  res.json({ user: userSafe });
});

// Quick demo role switcher to test RBAC without friction
router.post('/demo-switch', async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    let targetEmail = 'user@conduct.org';
    if (role === 'admin') targetEmail = 'admin@conduct.org';
    if (role === 'policy_manager') targetEmail = 'manager@conduct.org';

    const user = await db.users.findOne({ email: targetEmail });
    if (!user) {
      res.status(404).json({ error: 'Demo user not found.' });
      return;
    }

    const token = generateToken(user);
    const { passwordHash: _, ...userSafe } = user;
    res.json({ user: userSafe, token });
  } catch (err) {
    res.status(500).json({ error: 'Failed demo switch.' });
  }
});

export default router;
