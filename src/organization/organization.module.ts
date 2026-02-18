import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './organization.entity';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { Membership } from './membership.entity';


@Module({
  imports: [TypeOrmModule.forFeature([Organization, Membership])],
  controllers: [OrganizationController],
  providers: [OrganizationService],
  exports: [TypeOrmModule],
})

export class OrganizationModule {}

