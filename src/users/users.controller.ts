import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('signup')
  signup(@Body() body: any) {
    const { full_name, email, password } = body;
    return this.usersService.signup(full_name, email, password);
  }
}
