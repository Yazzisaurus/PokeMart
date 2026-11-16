import { Service, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/development';

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type Query = Record<string, string | number | boolean | null | undefined>;

export type ApiCall = {
  method: ApiMethod;
  path: string;
  params?: Query;
  query?: Query;
  payload?: unknown;
};

const backendUrl = environment.backendUrl;

@Service()
export class Api {
  private readonly http = inject(HttpClient);
  private token: string | null = null;

  setToken(token: string): void {
    this.token = token;
  }

  clearToken(): void {
    this.token = null;
  }

  request<T>(call: ApiCall): Promise<T> {
    let headers = new HttpHeaders();
    if (this.token) {
      headers = headers.set('Authorization', `Bearer ${this.token}`);
    }

    return firstValueFrom(
      this.http.request<T>(call.method, this.url(call), {
        headers,
        body: call.payload,
      }),
    );
  }

  private url(call: ApiCall): string {
    const path = call.path.replace(/:(\w+)/g, (_, key: string) => {
      const value = call.params?.[key];
      if (value == null) {
        throw new Error(`Missing path parameter: ${key}`);
      }
      return encodeURIComponent(`${value}`);
    });

    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(call.query ?? {})) {
      if (value != null) {
        query.set(key, `${value}`);
      }
    }

    return query.size ? `${backendUrl}${path}?${query}` : `${backendUrl}${path}`;
  }
}
