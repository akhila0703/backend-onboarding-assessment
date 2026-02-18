import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invitation } from './invitation.entity';

@Injectable()
export class InviteService {
  constructor(
    @InjectRepository(Invitation)
    private inviteRepo: Repository<Invitation>,
  ) {}

  async inviteUser(org_id: string, invited_by: string, email: string, role: string) {
    const invite = this.inviteRepo.create({
      org_id,
      invited_by,
      email,
      role,
      status: 'pending',
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hrs
    });

    await this.inviteRepo.save(invite);

    return {
      message: 'Invitation sent',
    };
  }
}
