import 'dotenv/config';
import { DataSource } from 'typeorm';

import { User } from './src/users/user.entity';
import { Organization } from './src/organization/organization.entity';
import { Membership } from './src/organization/membership.entity';
import { Idempotency } from './src/idempotency/idempotency.entity'; // 👈 ADD THIS

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  entities: [
    User,
    Organization,
    Membership,
    Idempotency, // 👈 VERY IMPORTANT
  ],

  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});