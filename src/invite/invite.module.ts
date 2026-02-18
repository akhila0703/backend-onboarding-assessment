import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InviteService } from './invite.service';
import { InviteController } from './invite.controller';
import { Invitation } from './invitation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Invitation])],
  controllers: [InviteController],
  providers: [InviteService],
  exports: [TypeOrmModule],
})
export class InviteModule {}
