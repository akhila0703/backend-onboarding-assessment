import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('organization')
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createOrg(@Body() body: any, @Req() req: any) {
    return this.orgService.createOrganization(
      body.name,
      body.org_type,
      req.user.user_id, // from JWT token
    );
  }
}