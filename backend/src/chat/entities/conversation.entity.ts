import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  type Relation,
} from 'typeorm';

import { User } from '../../auth/entities/user.entity.js';
import { Message } from './message.entity.js';

@Entity('conversations')
@Index(['user'])
export class Conversation {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @ManyToOne(() => User, (user) => user.conversations, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'user_id',
  })
  user!: Relation<User> | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  title!: string | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt!: Date;

  @OneToMany(() => Message, (message) => message.conversation)
  messages!: Relation<Message[]>;
}
