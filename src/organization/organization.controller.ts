import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('organization')
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createOrg(
    @Body() body: any,
    @Req() req: any,
    @Headers('idempotency-key') key: string,
  ) {
    console.log('REQ.USER:', req.user);
    console.log('KEY:', key);

    return this.orgService.createOrganization(
      body,
      req.user.id, // ✅ FIXED
      key,
    );
  }
}