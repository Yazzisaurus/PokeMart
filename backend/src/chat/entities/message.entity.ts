import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';

import { Conversation } from './conversation.entity.js';

@Entity('messages')
@Index(['conversation', 'seq'])
@Check(`"role" IN ('user', 'assistant')`)
export class Message {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({
    type: 'bigint',
    generated: 'increment',
    generatedIdentity: 'ALWAYS',
  })
  seq!: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'conversation_id',
  })
  conversation!: Relation<Conversation>;

  @Column({ type: 'text' })
  role!: 'user' | 'assistant';

  @Column({ type: 'text' })
  content!: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt!: Date;
}
