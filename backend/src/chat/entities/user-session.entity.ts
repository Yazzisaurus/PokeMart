import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('user_sessions')
export class UserSession {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({
    type: 'text',
    unique: true,
  })
  token!: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt!: Date;

  @Column({
    name: 'expires_at',
    type: 'timestamptz',
  })
  expiresAt!: Date;

  @Column({
    name: 'ip_address',
    type: 'text',
    nullable: true,
  })
  ipAddress!: string | null;

  @Column({
    name: 'user_agent',
    type: 'text',
    nullable: true,
  })
  userAgent!: string | null;

  @Column({
    name: 'revoked_at',
    type: 'timestamptz',
    nullable: true,
  })
  revokedAt!: Date | null;
}
