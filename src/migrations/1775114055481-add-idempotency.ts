import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIdempotency1775114055481 implements MigrationInterface {
    name = 'AddIdempotency1775114055481'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "organizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "org_code" character varying NOT NULL, "org_type" character varying NOT NULL, "created_by" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a51959f11de12033c3a2d544b85" UNIQUE ("org_code"), CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "memberships" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" character varying NOT NULL, "org_id" character varying NOT NULL, "role" character varying NOT NULL, "status" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_25d28bd932097a9e90495ede7b4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "idempotency" ("key" character varying NOT NULL, "request_hash" character varying NOT NULL, "response_status" integer NOT NULL, "response_body" json NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7db4ecce9e7d787fe8fb72ad97f" PRIMARY KEY ("key"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "idempotency"`);
        await queryRunner.query(`DROP TABLE "memberships"`);
        await queryRunner.query(`DROP TABLE "organizations"`);
    }

}
