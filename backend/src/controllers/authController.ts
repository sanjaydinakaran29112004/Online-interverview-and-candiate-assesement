import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { config } from '../config';
import { AuthRequest } from '../middleware/auth';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name, role, phone, companyName, technicalDomain, headline } = req.body;

      if (!email || !password || !name) {
        res.status(400).json({ success: false, message: 'Email, password, and name are required.' });
        return;
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userRole = (role || 'CANDIDATE').toUpperCase();

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: userRole,
          status: 'ACTIVE'
        }
      });

      // Create role-specific profile
      if (userRole === 'CANDIDATE') {
        await prisma.candidateProfile.create({
          data: {
            userId: user.id,
            phone,
            headline: headline ? headline.trim() : ''
          }
        });
      } else if (userRole === 'RECRUITER') {
        await prisma.recruiterProfile.create({
          data: {
            userId: user.id,
            companyName: companyName ? companyName.trim() : '',
            phone
          }
        });
      } else if (userRole === 'INTERVIEWER') {
        await prisma.interviewerProfile.create({
          data: {
            userId: user.id,
            technicalDomain: technicalDomain ? technicalDomain.trim() : ''
          }
        });
      }

      // Generate JWT tokens
      const token = jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn as any
      });
      const refreshToken = jwt.sign({ id: user.id }, config.jwtRefreshSecret, {
        expiresIn: config.jwtRefreshExpiresIn as any
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_REGISTERED',
          entity: 'User',
          entityId: user.id,
          details: `User registered with role ${userRole}`
        }
      });

      res.status(201).json({
        success: true,
        message: 'Account successfully registered.',
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Registration failed.' });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ success: false, message: 'Email and password are required.' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          candidateProfile: true,
          recruiterProfile: true,
          interviewerProfile: true
        }
      });

      if (!user) {
        res.status(401).json({ success: false, message: 'Invalid email or password.' });
        return;
      }

      if (user.status !== 'ACTIVE') {
        res.status(403).json({ success: false, message: 'Account has been deactivated. Please contact administrator.' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401).json({ success: false, message: 'Invalid email or password.' });
        return;
      }

      const token = jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn as any
      });
      const refreshToken = jwt.sign({ id: user.id }, config.jwtRefreshSecret, {
        expiresIn: config.jwtRefreshExpiresIn as any
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_LOGIN',
          entity: 'User',
          entityId: user.id,
          details: `User logged in from role ${user.role}`
        }
      });

      res.json({
        success: true,
        message: 'Authentication successful.',
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          candidateProfile: user.candidateProfile,
          recruiterProfile: user.recruiterProfile,
          interviewerProfile: user.interviewerProfile
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Login error.' });
    }
  }

  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(400).json({ success: false, message: 'Refresh token required.' });
        return;
      }

      const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret) as any;
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });

      if (!user || user.status !== 'ACTIVE') {
        res.status(401).json({ success: false, message: 'Invalid refresh token.' });
        return;
      }

      const newToken = jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn as any
      });

      res.json({ success: true, token: newToken });
    } catch (error) {
      res.status(401).json({ success: false, message: 'Expired or invalid refresh token.' });
    }
  }

  static async me(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          avatarUrl: true,
          candidateProfile: true,
          recruiterProfile: true,
          interviewerProfile: true
        }
      });

      res.json({ success: true, user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { name, phone, headline, summary, technicalSkills, portfolioUrl, linkedinUrl, githubUrl, companyName } = req.body;

      if (name) {
        await prisma.user.update({
          where: { id: req.user.id },
          data: { name }
        });
      }

      if (req.user.role === 'CANDIDATE') {
        await prisma.candidateProfile.upsert({
          where: { userId: req.user.id },
          update: { phone, headline, summary, technicalSkills, portfolioUrl, linkedinUrl, githubUrl },
          create: { userId: req.user.id, phone, headline, summary, technicalSkills, portfolioUrl, linkedinUrl, githubUrl }
        });
      } else if (req.user.role === 'RECRUITER') {
        await prisma.recruiterProfile.upsert({
          where: { userId: req.user.id },
          update: { phone, companyName },
          create: { userId: req.user.id, phone, companyName: companyName || 'Recruitment Org' }
        });
      }

      res.json({ success: true, message: 'Profile updated successfully.' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    res.json({
      success: true,
      message: `Password reset instructions sent to ${email} (Demo code: 123456).`
    });
  }

  static async resetPassword(req: Request, res: Response): Promise<void> {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      res.status(400).json({ success: false, message: 'Email and new password are required.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });

    res.json({ success: true, message: 'Password has been successfully updated.' });
  }
}
