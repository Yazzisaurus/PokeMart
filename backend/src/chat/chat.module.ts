import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';
import { Conversation } from './entities/conversation.entity.js';
import { Message } from './entities/message.entity.js';
import { UserSession } from './entities/user-session.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation, Message, UserSession])],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
