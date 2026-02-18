import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './organization.entity';
import { Membership } from './membership.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private orgRepo: Repository<Organization>,

    @InjectRepository(Membership)
    private memberRepo: Repository<Membership>,
  ) {}

  async createOrg(name: string, org_type: string, user_id: string) {
    const org = this.orgRepo.create({
      name,
      org_code: uuidv4().slice(0, 6),
      org_type,
      created_by: user_id,
    });

    await this.orgRepo.save(org);

    // create membership as admin
    const membership = this.memberRepo.create({
      user_id: user_id,
      org_id: org.id,
      role: 'admin',
      status: 'active',
    });

    await this.memberRepo.save(membership);

    return {
      message: 'Organization created',
      org_id: org.id,
    };
  }
}
