import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { ValidationPipe } from '@nestjs/common';

describe('Users API (e2e)', () => {
  let app: INestApplication;
  let createdUserId: string;

beforeAll(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();

  // 🔥 ADD THIS
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  await app.init();

  const dataSource = app.get(DataSource);
  await dataSource.query('TRUNCATE TABLE "users" RESTART IDENTITY CASCADE');
});

  // 1️⃣ Create user
  it('POST /v1/users - should create user', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/users')
      .send({
        full_name: 'Test User',
        email: 'testuser@example.com',
        password: 'Password123',
      })
      .expect(201);

    expect(res.body.email).toBe('testuser@example.com');
    createdUserId = res.body.id;
  });

  // 2️⃣ Duplicate email
  it('POST /v1/users - duplicate email should fail', async () => {
    await request(app.getHttpServer())
      .post('/v1/users')
      .send({
        full_name: 'Test User',
        email: 'testuser@example.com',
        password: 'Password123',
      })
      .expect(409);
  });

  // 3️⃣ Invalid email
  it('POST /v1/users - invalid email should fail', async () => {
    await request(app.getHttpServer())
      .post('/v1/users')
      .send({
        full_name: 'Invalid',
        email: 'wrong-email',
        password: 'Password123',
      })
      .expect(400);
  });

  // 4️⃣ Pagination check
  it('GET /v1/users - should return pagination', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/users?page=1&limit=5')
      .expect(200);

    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('limit');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('totalPages');
  });

  // 5️⃣ Get by ID
  it('GET /v1/users/:id - should return user', async () => {
    await request(app.getHttpServer())
      .get(`/v1/users/${createdUserId}`)
      .expect(200);
  });

  // 6️⃣ Non-existent ID
  it('GET /v1/users/:id - should return 404', async () => {
    await request(app.getHttpServer())
      .get('/v1/users/11111111-1111-1111-1111-111111111111')
      .expect(404);
  });

  afterAll(async () => {
    await app.close();
  });
});