import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invitation } from './invitation.entity';
import { Membership } from '../organization/membership.entity';

@Injectable()
export class InviteService {
  constructor(
    @InjectRepository(Invitation)
    private inviteRepo: Repository<Invitation>,

    @InjectRepository(Membership)
    private memberRepo: Repository<Membership>,
  ) {}

  async inviteUser(org_id: string, invited_by: string, email: string, role: string) {

    // 🔒 CHECK: is user admin of this org?
    const membership = await this.memberRepo.findOne({
      where: {
        org_id: org_id,
        user_id: invited_by,
        role: 'admin',
      },
    });

    if (!membership) {
      throw new UnauthorizedException('Only admin can invite users');
    }

    // create invite
    const invite = this.inviteRepo.create({
      org_id,
      invited_by,
      email,
      role,
      status: 'pending',
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24),
    });

    await this.inviteRepo.save(invite);

    return {
      message: 'Invitation sent successfully',
    };
  }
}