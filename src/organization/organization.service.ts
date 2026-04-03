import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './organization.entity';
import { Membership } from './membership.entity';
import { Idempotency } from '../idempotency/idempotency.entity';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private orgRepo: Repository<Organization>,

    @InjectRepository(Membership)
    private membershipRepo: Repository<Membership>,

    @InjectRepository(Idempotency)
    private idemRepo: Repository<Idempotency>,
  ) {}

  async createOrganization(body: any, userId: string, key: string) {
    try {
      // ✅ VALIDATION
      if (!body?.name || !body?.org_type) {
        throw new BadRequestException('name and org_type are required');
      }

      if (!key) {
        throw new BadRequestException('Idempotency-Key header is required');
      }

      if (!userId) {
        throw new BadRequestException('Invalid user');
      }

      console.log('USER ID:', userId);

      // ✅ HASH REQUEST
      const requestHash = createHash('sha256')
        .update(JSON.stringify(body))
        .digest('hex');

      // ✅ CHECK EXISTING KEY
      const existing = await this.idemRepo.findOne({
        where: { key: key },
      });

      if (existing) {
        if (existing.request_hash === requestHash) {
          return existing.response_body; // ✅ same response
        } else {
          throw new BadRequestException(
            'Idempotency key reused with different request',
          );
        }
      }

      // ✅ CREATE ORG
      const orgCode = randomBytes(4).toString('hex');

      const org = this.orgRepo.create({
        name: body.name,
        org_type: body.org_type,
        org_code: orgCode,
        created_by: String(userId),
      });

      const savedOrg = await this.orgRepo.save(org);

      // ✅ CREATE MEMBERSHIP
      await this.membershipRepo.save({
        user_id: String(userId),
        org_id: String(savedOrg.id),
        role: 'admin',
        status: 'active',
      });

      // ✅ RESPONSE
      const response = {
        message: 'Organization created successfully',
        org_id: savedOrg.id,
        org_code: savedOrg.org_code,
      };

      // ✅ SAVE IDEMPOTENCY (SAFE)
      try {
        await this.idemRepo.save({
          key,
          request_hash: requestHash,
          response_status: 201,
          response_body: response,
        });
      } catch (e) {
        console.log('Idempotency save error:', e.message);
      }

      return response;

    } catch (err) {
      console.error('ORG ERROR FULL:', err);

      if (err instanceof BadRequestException) {
        throw err;
      }

      throw new InternalServerErrorException(err.message);
    }
  }
}