import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { OrganizationModule } from './organization/organization.module';
import { InviteModule } from './invite/invite.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '123',   // ← put YOUR postgres password here
      database: 'intern_db',
      autoLoadEntities: true,
      synchronize: true, // auto create tables (very useful now)
    }),

    HealthModule,
    UsersModule,
    AuthModule,
    OrganizationModule,
    InviteModule,
  ],
})
export class AppModule {}

