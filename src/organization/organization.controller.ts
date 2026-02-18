import { Controller, Post, Body } from '@nestjs/common';
import { OrganizationService } from './organization.service';

@Controller('organization')
export class OrganizationController {
  constructor(private orgService: OrganizationService) {}

  @Post('create')
  createOrg(@Body() body: any) {
    const { name, org_type, user_id } = body;
    return this.orgService.createOrg(name, org_type, user_id);
  }
}
