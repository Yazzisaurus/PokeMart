import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { filter } from 'rxjs';

@Component({
  selector: 'app-chat-bubble',
  imports: [RouterLink, MatIcon],
  templateUrl: './chat-bubble.html',
  styleUrl: './chat-bubble.scss',
})
export class ChatBubble {
  private readonly router = inject(Router);
  protected readonly visible = signal(!this.router.url.startsWith('/chat'));

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        this.visible.set(!event.urlAfterRedirects.startsWith('/chat'));
      });
  }
}
