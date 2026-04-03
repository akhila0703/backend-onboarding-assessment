import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Idempotency {
  @PrimaryColumn()
  key: string;

  @Column()
  request_hash: string;

  @Column()
  response_status: number;

  @Column('json')
  response_body: any;

  @CreateDateColumn()
  created_at: Date;
}