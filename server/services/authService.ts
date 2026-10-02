import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { UserModel, IUser } from '../models/User';
import { AppError } from '../utils/appError';
import { isMongoConnected } from '../config/db';

// Resilient memory cache for sandbox environments without mongod daemon
const memoryUsers = new Map<string, any>();

export class AuthService {
  static async register(username: string, email: string, password: string):Promise<{ user: any; token: string }> {
    const trimmedUser = username.trim();
    const trimmedEmail = email.toLowerCase().trim();

    if (isMongoConnected) {
      const existingUser = await UserModel.findOne({
        $or: [{ email: trimmedEmail }, { username: trimmedUser }],
      });

      if (existingUser) {
        throw new AppError('User with this email or username already exists.', 400);
      }
    } else {
      for (const u of memoryUsers.values()) {
        if (u.email === trimmedEmail || u.username === trimmedUser) {
          throw new AppError('User with this email or username already exists.', 400);
        }
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let createdUser: any;

    if (isMongoConnected) {
      createdUser = await UserModel.create({
        username: trimmedUser,
        email: trimmedEmail,
        passwordHash,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${trimmedUser}`,
      });
    } else {
      createdUser = {
        _id: `usr_${Date.now()}`,
        id: `usr_${Date.now()}`,
        username: trimmedUser,
        email: trimmedEmail,
        passwordHash,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${trimmedUser}`,
        title: 'Competitive Dialectician',
        elo: 1200,
        rankTier: 'Advocate',
        streak: 0,
        stats: {
          totalDebates: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          winRate: 0,
          avgScore: 75,
          debateStyle: 'Aggressive Analytical',
          radarStats: { logic: 80, rebuttal: 75, relevance: 85, evidence: 70, persuasiveness: 75 },
        },
      };
      memoryUsers.set(createdUser.id, createdUser);
    }

    const token = this.generateToken(createdUser._id || createdUser.id, createdUser.username, createdUser.email);

    return {
      user: this.sanitizeUser(createdUser),
      token,
    };
  }

  static async login(email: string, password: string): Promise<{ user: any; token: string }> {
    const trimmedEmail = email.toLowerCase().trim();
    let user: any = null;

    if (isMongoConnected) {
      user = await UserModel.findOne({ email: trimmedEmail });
    } else {
      for (const u of memoryUsers.values()) {
        if (u.email === trimmedEmail) {
          user = u;
          break;
        }
      }
    }

    if (!user) {
      throw new AppError('Invalid email or password credentials.', 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password credentials.', 401);
    }

    const token = this.generateToken(user._id || user.id, user.username, user.email);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  static generateToken(id: string, username: string, email: string): string {
    return jwt.sign({ id, username, email }, ENV.JWT_SECRET, {
      expiresIn: ENV.JWT_EXPIRES_IN as any,
    });
  }

  static sanitizeUser(user: any) {
    const obj = user.toObject ? user.toObject() : { ...user };
    delete obj.passwordHash;
    return obj;
  }
}
