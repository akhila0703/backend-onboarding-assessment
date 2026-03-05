import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async createUser(dto: CreateUserDto) {
    const { fullName, email, password, role, isActive } = dto;

    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = this.userRepo.create({
      full_name: fullName,
      email,
      password_hash: hashed,
      role: role ?? UserRole.USER,
      is_active: isActive ?? true,
    });

    await this.userRepo.save(user);

    return {
      message: 'User created successfully',
      id: user.id,
      email: user.email,
    };
  }

  async getUsers(page: number = 1, limit: number = 10) {
    if (!page || page < 1) page = 1;
    if (!limit || limit < 1) limit = 10;
    if (limit > 50) limit = 50;

    const skip = (page - 1) * limit;

    const [users, total] = await this.userRepo.findAndCount({
      skip,
      take: limit,
      order: { created_at: 'DESC' },
      select: ['id', 'email', 'full_name', 'role', 'created_at'],
    });

    return {
      items: users,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

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