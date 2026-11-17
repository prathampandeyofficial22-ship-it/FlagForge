import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { User, IUser } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { OrganizationMember } from '../models/OrganizationMember.js';
import { config } from '../config/env.js';
import {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
} from '../utils/errors.js';

export interface RegisterDTO {
  email: string;
  password: string;
  name: string;
  organizationName?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    isEmailVerified: boolean;
  };
  token: string;
  currentOrganization?: {
    id: string;
    name: string;
    slug: string;
    role: string;
  };
}

export class AuthService {
  static generateToken(user: IUser): string {
    return jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
      },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );
  }

  static async register(dto: RegisterDTO): Promise<AuthResponse> {
    const existing = await User.findOne({ email: dto.email.toLowerCase() });
    if (existing) {
      throw new ConflictError('A user with this email address already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, config.BCRYPT_SALT_ROUNDS);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      name: dto.name,
      verificationToken,
      isEmailVerified: false,
    });

    // Create default organization if specified or based on user's name
    const orgName = dto.organizationName?.trim() || `${dto.name.trim()}'s Workspace`;
    let baseSlug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    if (!baseSlug || baseSlug === '-') baseSlug = 'workspace';
    const slug = `${baseSlug}-${crypto.randomBytes(3).toString('hex')}`;

    const organization = await Organization.create({
      name: orgName,
      slug,
    });

    // Assign user as owner of the organization
    await OrganizationMember.create({
      organizationId: organization._id,
      userId: user._id,
      role: 'owner',
    });

    const token = this.generateToken(user);

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        isEmailVerified: user.isEmailVerified,
      },
      token,
      currentOrganization: {
        id: organization._id.toString(),
        name: organization.name,
        slug: organization.slug,
        role: 'owner',
      },
    };
  }

  static async login(dto: LoginDTO): Promise<AuthResponse> {
    const user = await User.findOne({ email: dto.email.toLowerCase() });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const isMatch = await user.comparePassword(dto.password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    user.lastLoginAt = new Date();
    await user.save();

    // Fetch primary organization
    const membership = await OrganizationMember.findOne({ userId: user._id })
      .populate<{ organizationId: { _id: any; name: string; slug: string } }>('organizationId')
      .exec();

    const token = this.generateToken(user);

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        isEmailVerified: user.isEmailVerified,
      },
      token,
      currentOrganization: membership && membership.organizationId
        ? {
            id: membership.organizationId._id.toString(),
            name: membership.organizationId.name,
            slug: membership.organizationId.slug,
            role: membership.role,
          }
        : undefined,
    };
  }

  static async getCurrentUser(userId: string): Promise<any> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found.');
    }

    const memberships = await OrganizationMember.find({ userId: user._id })
      .populate('organizationId')
      .exec();

    return {
      user: user.toSafeJSON(),
      organizations: memberships.map((m: any) => ({
        id: m.organizationId._id.toString(),
        name: m.organizationId.name,
        slug: m.organizationId.slug,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
    };
  }

  static async forgotPassword(email: string): Promise<{ message: string; resetToken?: string }> {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Return success message to prevent user enumeration attacks
      return { message: 'If this email is registered, password reset instructions have been generated.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    return {
      message: 'If this email is registered, password reset instructions have been generated.',
      resetToken: config.NODE_ENV !== 'production' ? resetToken : undefined,
    };
  }

  static async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestError('Password reset token is invalid or has expired.');
    }

    user.passwordHash = await bcrypt.hash(newPassword, config.BCRYPT_SALT_ROUNDS);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return { message: 'Password has been successfully updated. You can now log in.' };
  }
}
