import { Service, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ApiCall = {
  method: ApiMethod;
  path: string;
  params?: Record<string, string | number | boolean | null | undefined>;
  payload?: unknown;
};

const backendUrl = 'http://localhost:3000';

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
    const headers = this.token
      ? new HttpHeaders({ Authorization: `Bearer ${this.token}` })
      : undefined;
    const url = `${backendUrl}${call.path}`;

    if (call.method === 'GET') {
      return firstValueFrom(
        this.http.get<T>(url, { headers, params: this.query(call.params) }),
      );
    }

    return firstValueFrom(
      this.http.request<T>(call.method, url, {
        headers,
        body: call.payload,
      }),
    );
  }

  private query(params: ApiCall['params']): HttpParams | undefined {
    if (!params) {
      return undefined;
    }

    let query = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        query = query.set(key, String(value));
      }
    }
    return query;
  }
}
