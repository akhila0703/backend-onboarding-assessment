import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './organization.entity';
import { Membership } from './membership.entity';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';

// 👇 ADD THIS IMPORT
import { Idempotency } from '../idempotency/idempotency.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organization,
      Membership,
      Idempotency, // 👈 ADD THIS
    ]),
  ],
  providers: [OrganizationService],
  controllers: [OrganizationController],
  exports: [OrganizationService],
})
export class OrganizationModule {}