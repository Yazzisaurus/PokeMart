import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Conversation } from './entities/conversation.entity.js';
import { Message } from './entities/message.entity.js';
import { UserSession } from './entities/user-session.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation, Message, UserSession])],
})
export class ChatModule {}
