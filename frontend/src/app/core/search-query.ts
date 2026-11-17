import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SearchQuery {
  readonly text = signal('');
}
