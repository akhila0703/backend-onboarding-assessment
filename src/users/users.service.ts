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
import { redis } from '../redis/redis.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // ✅ CREATE USER
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

    // 🔥 CACHE INVALIDATION
    await redis.del('users:list:page:1:limit:10');
    console.log('Cache invalidated after user creation 🔄');

    return {
      message: 'User created successfully',
      id: user.id,
      email: user.email,
    };
  }

  // ✅ LIST USERS WITH CACHING
  async getUsers(page: number = 1, limit: number = 10) {
    if (!page || page < 1) page = 1;
    if (!limit || limit < 1) limit = 10;
    if (limit > 50) limit = 50;

    const skip = (page - 1) * limit;

    const cacheKey = `users:list:page:${page}:limit:${limit}`;

    const start = Date.now();

    // 🔍 CHECK CACHE
    const cached = await redis.get(cacheKey);

    if (cached) {
      console.log('CACHE HIT ✅');

      const end = Date.now();
      console.log(`Response Time (CACHE): ${end - start}ms`);

      return JSON.parse(cached);
    }

    console.log('CACHE MISS ❌');

    // 🗄️ DB CALL
    const [users, total] = await this.userRepo.findAndCount({
      skip,
      take: limit,
      order: { created_at: 'DESC' },
      select: ['id', 'email', 'full_name', 'role', 'created_at'],
    });

    const result = {
      items: users,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    // 💾 STORE IN CACHE (TTL = 60 sec)
    await redis.set(cacheKey, JSON.stringify(result), 'EX', 60);

    const end = Date.now();
    console.log(`Response Time (DB): ${end - start}ms`);

    return result;
  }

  // ✅ GET USER BY ID
  async findById(id: string) {
    const user = await this.userRepo.findOne({
      where: { id: id },
      select: ['id', 'email', 'full_name', 'role', 'created_at'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}