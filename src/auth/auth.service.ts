import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async login(email: string, password: string) {
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user) {
      return { message: 'User not found' };
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return { message: 'Invalid password' };
    }

    return {
      message: 'Login successful',
      user_id: user.id,
      email: user.email,
    };
  }
  async forgotPassword(email: string, newPassword: string) {
  const user = await this.userRepo.findOne({ where: { email } });

  if (!user) {
    return { message: 'User not found' };
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  user.password_hash = hashed;

  await this.userRepo.save(user);

  return { message: 'Password updated successfully' };
}

}
