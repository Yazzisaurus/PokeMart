import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface AssistantReply {
  conversation_id: string;
  reply: string;
}

interface AssistantConversation {
  id: string;
  title: string | null;
  created_at: string;
}

interface AssistantMessage {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

@Injectable()
export class ChatService {
  constructor(private readonly config: ConfigService) {}

  async send(message: string, conversationId?: string) {
    const reply = await this.request<AssistantReply>('/chat', {
      method: 'POST',
      body: JSON.stringify(
        conversationId
          ? { message, conversation_id: conversationId }
          : { message },
      ),
    });

    return {
      conversationId: reply.conversation_id,
      reply: reply.reply,
    };
  }

  async listConversations() {
    const rows = await this.request<AssistantConversation[]>('/conversations');
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      createdAt: row.created_at,
    }));
  }

  async messages(conversationId: string) {
    const rows = await this.request<AssistantMessage[]>(
      `/conversations/${encodeURIComponent(conversationId)}/messages`,
    );
    return rows.map((row) => ({
      id: row.id,
      role: row.role,
      content: row.content,
      createdAt: row.created_at,
    }));
  }

  private baseUrl(): string {
    return (
      this.config.get<string>('FASTAPI_URL') ?? 'http://127.0.0.1:8000'
    ).replace(/\/$/, '');
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl()}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers,
        },
      });
    } catch {
      throw new ServiceUnavailableException('Cannot reach the assistant');
    }

    if (!response.ok) {
      const detail = await this.detail(response);
      if (response.status === 404) {
        throw new NotFoundException(detail);
      }
      if (response.status === 400 || response.status === 422) {
        throw new BadRequestException(detail);
      }
      if (response.status === 503) {
        throw new ServiceUnavailableException(detail);
      }
      throw new BadGatewayException(detail);
    }

    return (await response.json()) as T;
  }

  private async detail(response: Response): Promise<string> {
    try {
      const body = (await response.json()) as { detail?: unknown };
      if (typeof body.detail === 'string' && body.detail) {
        return body.detail;
      }
    } catch {
      return 'The assistant request failed';
    }
    return 'The assistant request failed';
  }
}
