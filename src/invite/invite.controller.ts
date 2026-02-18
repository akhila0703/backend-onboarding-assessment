import { Controller, Post, Body } from '@nestjs/common';
import { InviteService } from './invite.service';

@Controller('invite')
export class InviteController {
  constructor(private inviteService: InviteService) {}

  @Post()
  invite(@Body() body: any) {
    const { org_id, invited_by, email, role } = body;
    return this.inviteService.inviteUser(org_id, invited_by, email, role);
  }
}
