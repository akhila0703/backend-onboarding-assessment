import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // LOGIN
  @Post('login')
  login(@Body() body: any) {
    return this.authService.login(body.email, body.password);
  }

  // FORGOT PASSWORD
  @Post('forgot-password')
  forgot(@Body() body: any) {
    return this.authService.sendResetLink(body.email);
  }

  // RESET PASSWORD
  @Post('reset-password')
  reset(@Body() body: any) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }
}