import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  login(@Body() body: any) {
    const { email, password } = body;
    return this.authService.login(email, password);
  }
  @Post('forgot-password')
forgot(@Body() body: any) {
  const { email, newPassword } = body;
  return this.authService.forgotPassword(email, newPassword);
}

}
