import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { SignupDto } from './dto/signup.dto';

@Controller('v1/users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  // CREATE USER (assignment requirement)
  @Post()
  createUser(@Body() signupDto: SignupDto) {
    return this.usersService.createUser(signupDto);
  }

  // LIST USERS with pagination
  @Get()
  getUsers(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.usersService.getUsers(Number(page), Number(limit));
  }

  // GET USER BY ID
  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }
}