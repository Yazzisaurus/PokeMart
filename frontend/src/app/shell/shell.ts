import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { SearchQuery } from '../core/search-query';
import { SearchField } from '../ui/search-field/search-field';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIcon, SearchField],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly router = inject(Router);
  private readonly searchQuery = inject(SearchQuery);

  protected readonly cartCount = signal(3);
  protected readonly query = this.searchQuery.text;

  protected onQuery(value: string): void {
    this.query.set(value);
    if (value.trim() && !this.router.url.startsWith('/search')) {
      void this.router.navigate(['/search']);
    }
  }
}
