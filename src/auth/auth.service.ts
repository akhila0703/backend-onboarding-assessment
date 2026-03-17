import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  // 🟢 REGISTER USER
  async register(full_name: string, email: string, password: string, role: UserRole) {
    const existingUser = await this.userRepo.findOne({ where: { email } });

    if (existingUser) {
      return { message: 'User already exists' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepo.create({
      full_name,
      email,
      password_hash: hashedPassword,
      role,
    });

    await this.userRepo.save(user);

    return {
      message: 'User registered successfully',
      user,
    };
  }

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
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      message: 'Login successful',
      access_token: this.jwtService.sign(payload),
    };
  }

  // 🔐 FORGOT PASSWORD
  async sendResetLink(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user) {
      return { message: 'User not found' };
    }

    const resetToken = this.jwtService.sign(
      { email: user.email },
      { expiresIn: '15m' },
    );

    user.reset_token = resetToken;
    await this.userRepo.save(user);

    return {
      message: 'Reset token generated',
      reset_token: resetToken,
    };
  }

  // 🔐 RESET PASSWORD
  async resetPassword(token: string, newPassword: string) {
    try {
      const decoded: any = this.jwtService.verify(token);
      const email = decoded.email;

      const user = await this.userRepo.findOne({ where: { email } });

      if (!user) {
        return { message: 'User not found' };
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password_hash = hashedPassword;

      await this.userRepo.save(user);

      return { message: 'Password reset successful' };
    } catch (err) {
      return { message: 'Invalid or expired token' };
    }
  }
}
