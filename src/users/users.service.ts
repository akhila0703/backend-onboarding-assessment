import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import * as bcrypt from 'bcrypt';
import { SignupDto } from './dto/signup.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // 🔥 CREATE USER
  async createUser(signupDto: SignupDto) {
    const { full_name, email, password } = signupDto;

    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = this.userRepo.create({
      full_name,
      email,
      password_hash: hashed,
      role: UserRole.USER,
      is_active: true,
    });

    await this.userRepo.save(user);

    return {
      message: 'User created',
      id: user.id,
      email: user.email,
    };
  }

  // 🔥 GET USERS WITH PAGINATION
  async getUsers(page: number, limit: number) {
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > 50) limit = 50;

    const skip = (page - 1) * limit;

    const [users, total] = await this.userRepo.findAndCount({
      skip,
      take: limit,
      order: { created_at: 'DESC' },
      select: ['id', 'email', 'full_name', 'role', 'created_at'],
    });

    return {
      data: users,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  // 🔥 GET USER BY ID
  async getUserById(id: string) {
    const user = await this.userRepo.findOne({
      where: { id },
      select: ['id', 'email', 'full_name', 'role', 'created_at'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}