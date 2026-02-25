import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { InviteService } from './invite.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('invite')
export class InviteController {
  constructor(private inviteService: InviteService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  invite(@Body() body: any, @Req() req: any) {

    const user_id = req.user.user_id; // from token
    const { org_id, email, role } = body;

    return this.inviteService.inviteUser(org_id, user_id, email, role);
  }
}