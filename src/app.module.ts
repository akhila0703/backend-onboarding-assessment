import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { OrganizationModule } from './organization/organization.module';
import { InviteModule } from './invite/invite.module';

// ✅ NEW IMPORTS
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { MetricsService } from './common/metrics/metrics.service';
import { MetricsController } from './metrics/metrics.controller';

@Module({
  imports: [
    // 🔥 Loads .env globally
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 🔥 PostgreSQL connection (Docker DB)
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: false, // ❌ NEVER true for assignment
    }),

    HealthModule,
    UsersModule,
    AuthModule,
    OrganizationModule,
    InviteModule,
  ],

  // ✅ ADD THIS
  controllers: [MetricsController],

  // ✅ ADD THIS
  providers: [MetricsService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // ✅ Apply Logger + Correlation ID middleware globally
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}