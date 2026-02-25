import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InviteController } from './invite.controller';
import { InviteService } from './invite.service';
import { Invitation } from './invitation.entity';
import { Membership } from '../organization/membership.entity'; // 👈 ADD THIS

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Invitation,
      Membership,   // 👈 ADD THIS
    ]),
  ],
  controllers: [InviteController],
  providers: [InviteService],
})
export class InviteModule {}