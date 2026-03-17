import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { SignupDto } from '../users/dto/signup.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // REGISTER
  @Post('register')
  register(@Body() body: SignupDto) {
    return this.authService.register(
      body.full_name,
      body.email,
      body.password,
      body.role,
    );
  }

  // LOGIN
  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  // FORGOT PASSWORD
  @Post('forgot-password')
  forgot(@Body() body: { email: string }) {
    return this.authService.sendResetLink(body.email);
  }

  // RESET PASSWORD
  @Post('reset-password')
  reset(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  // PROTECTED ROUTE
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: any) {
    return req.user;
  }

  // ADMIN ONLY ROUTE (RBAC)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/users')
  getAllUsers() {
    return { message: 'Only ADMIN can access this route' };
  }
}

