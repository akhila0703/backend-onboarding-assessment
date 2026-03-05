import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
  create(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List users (paginated)' })
  @ApiResponse({ status: 200, description: 'OK' })
  list(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.usersService.getUsers(Number(page), Number(limit));
  }
}