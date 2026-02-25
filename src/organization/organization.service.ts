import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './organization.entity';
import { Membership } from './membership.entity';
import { randomBytes } from 'crypto';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private orgRepo: Repository<Organization>,

    @InjectRepository(Membership)
    private membershipRepo: Repository<Membership>,
  ) {}

  async createOrganization(name: string, orgType: string, userId: string) {
    try {
      const orgCode = randomBytes(4).toString('hex');

      const org = this.orgRepo.create({
        name,
        org_type: orgType,
        org_code: orgCode,
        created_by: userId,
      });

      await this.orgRepo.save(org);

      // ⭐ MAKE CREATOR ADMIN
      await this.membershipRepo.save({
        user_id: userId,
        org_id: org.id,
        role: 'admin',
        status: 'active', // ⭐ IMPORTANT FIX
      });

      return {
        message: 'Organization created successfully',
        org_id: org.id,
        org_code: org.org_code,
      };
    } catch (err) {
      console.error('ORG ERROR:', err);
      throw new InternalServerErrorException('Organization creation failed');
    }
  }
}