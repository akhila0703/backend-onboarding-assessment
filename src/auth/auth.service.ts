import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  // 🔐 LOGIN
  async login(email: string, password: string) {
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user) {
      return { message: 'User not found' };
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return { message: 'Invalid password' };
    }

    const payload = {
      user_id: user.id,
      email: user.email,
    };

    return {
      message: 'Login successful',
      access_token: this.jwtService.sign(payload),
    };
  }

  // 🔐 FORGOT PASSWORD (generate token)
  async sendResetLink(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user) {
      return { message: 'User not found' };
    }

    const resetToken = this.jwtService.sign(
      { email: user.email },
      { expiresIn: '15m' },
    );

    return {
      message: 'Reset token generated',
      reset_token: resetToken,
    };
  }

  // 🔐 RESET PASSWORD
  async resetPassword(token: string, newPassword: string) {
    try {
      const decoded = this.jwtService.verify(token);
      const email = decoded.email;

      const user = await this.userRepo.findOne({ where: { email } });
      if (!user) {
        return { message: 'User not found' };
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      user.password_hash = hashed;

      await this.userRepo.save(user);

      return { message: 'Password reset successful' };
    } catch (err) {
      return { message: 'Invalid or expired token' };
    }
  }
}