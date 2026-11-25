import { Component, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { ChatApi } from '../core/chat-api';

@Component({
  selector: 'app-chat',
  imports: [MatIcon],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chat {
  private readonly chat = inject(ChatApi);
  private readonly thread = viewChild<ElementRef<HTMLElement>>('thread');

  protected readonly messages = this.chat.messages;
  protected readonly waiting = this.chat.waiting;
  protected readonly draft = signal('');
  protected readonly failed = signal(false);

  constructor() {
    effect(() => {
      this.messages();
      this.waiting();
      queueMicrotask(() => this.scrollToEnd());
    });
  }

  protected onDraft(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLTextAreaElement) {
      this.draft.set(target.value);
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      void this.send(event);
    }
  }

  protected async send(event: Event): Promise<void> {
    event.preventDefault();
    const text = this.draft().trim();
    if (!text || this.waiting()) {
      return;
    }
    this.draft.set('');
    this.failed.set(false);
    try {
      await this.chat.send(text);
    } catch {
      this.failed.set(true);
    }
  }

  private scrollToEnd(): void {
    const element = this.thread()?.nativeElement;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }
}
