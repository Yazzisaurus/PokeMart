import { Injectable, inject } from '@angular/core';
import { Api } from './api';
import { post } from './urls';

type LoginResponse = {
  accessToken: string;
};

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly api = inject(Api);

  async login(email: string, password: string): Promise<void> {
    const response = await this.api.request<LoginResponse>(post('/auth/login', { email, password }));
    this.api.setToken(response.accessToken);
  }

  async signup(email: string, password: string): Promise<void> {
    await this.api.request(post('/auth/signup', { email, password }));
    await this.login(email, password);
  }
}
