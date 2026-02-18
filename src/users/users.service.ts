import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async signup(full_name: string, email: string, password: string) {
    // check if user exists
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) {
      return { message: 'Email already exists' };
    }

    // hash password
    const hashed = await bcrypt.hash(password, 10);

    const user = this.userRepo.create({
      full_name,
      email,
      password_hash: hashed,
    });

    await this.userRepo.save(user);

    return {
      message: 'User created successfully',
      user_id: user.id,
    };
  }
}
