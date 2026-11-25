import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';

import { ChatService } from './chat.service.js';
import { ChatPayloadDto } from './dto/chat.dto.js';

@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  send(@Body() { message, conversationId }: ChatPayloadDto) {
    const text = typeof message === 'string' ? message.trim() : '';
    if (!text) {
      throw new BadRequestException('Message is required');
    }

    const id =
      typeof conversationId === 'string' && conversationId.trim()
        ? conversationId.trim()
        : undefined;

    return this.chatService.send(text, id);
  }

  @Get('conversations')
  listConversations() {
    return this.chatService.listConversations();
  }

  @Get('conversations/:conversationId/messages')
  messages(
    @Param('conversationId', new ParseUUIDPipe()) conversationId: string,
  ) {
    return this.chatService.messages(conversationId);
  }
}
