import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Param,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  // ✅ CREATE USER
  @Post()
  @ApiOperation({ summary: 'Create a user' })
  @ApiBody({
    schema: {
      example: {
        fullName: 'Admin User',
        email: 'admin@demo.com',
        password: 'Password1',
        role: 'USER',
        isActive: true,
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Created' })
  async create(@Body() dto: CreateUserDto) {
    this.logger.log('Creating user');

    const user = await this.usersService.createUser(dto);

    return {
      success: true,
      data: user,
    };
  }

  // ✅ LIST USERS
  @Get()
  @ApiOperation({ summary: 'List users (paginated)' })
  @ApiResponse({ status: 200, description: 'OK' })
  async list(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    this.logger.log('Fetching users list');

    const users = await this.usersService.getUsers(
      Number(page),
      Number(limit),
    );

    return {
      success: true,
      data: users,
    };
  }

  // ✅ 🔥 IMPORTANT: TEST ERROR (KEEP THIS ABOVE :id)
  @Get('test-error')
  simulateError() {
    this.logger.error('Simulated failure triggered');
    throw new InternalServerErrorException('Simulated failure');
  }

  // ✅ GET USER BY ID
  @Get(':id')
  async getUser(@Param('id') id: string) {
    this.logger.log(`Fetching user with id ${id}`);

    const user = await this.usersService.findById(id);

    return {
      success: true,
      data: user,
    };
  }
}