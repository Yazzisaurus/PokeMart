import { Injectable, inject, signal } from '@angular/core';
import { Api } from './api';
import { post } from './urls';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatReply {
  conversationId: string;
  reply: string;
}

@Injectable({ providedIn: 'root' })
export class ChatApi {
  private readonly api = inject(Api);

  readonly messages = signal<ChatMessage[]>([]);
  readonly waiting = signal(false);
  private conversationId: string | null = null;

  async send(message: string): Promise<void> {
    const text = message.trim();
    if (!text || this.waiting()) {
      return;
    }

    this.messages.update((items) => [...items, { id: crypto.randomUUID(), role: 'user', content: text }]);
    this.waiting.set(true);

    try {
      const reply = await this.api.request<ChatReply>(
        post(
          '/chat',
          this.conversationId
            ? { message: text, conversationId: this.conversationId }
            : { message: text },
        ),
      );
      this.conversationId = reply.conversationId;
      this.messages.update((items) => [
        ...items,
        { id: crypto.randomUUID(), role: 'assistant', content: reply.reply },
      ]);
    } finally {
      this.waiting.set(false);
    }
  }
}
