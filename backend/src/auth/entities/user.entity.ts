import {
  Column,
  Entity,
  OneToMany,
  PrimaryColumn,
  type Relation,
} from 'typeorm';

import { Conversation } from '../../chat/entities/conversation.entity.js';

@Entity({ name: 'users' })
export class User {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ type: 'text', unique: true })
  email!: string;

  @Column({ type: 'text' })
  password!: string;

  @OneToMany(() => Conversation, (conversation) => conversation.user)
  conversations!: Relation<Conversation[]>;
}
