import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { QueryFailedError, Repository } from 'typeorm';

import { User } from './entities/user.entity.js';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  findByEmail(email: string) {
    return this.users.findOne({
      where: { email },
    });
  }

  async create(email: string, password: string) {
    const user = this.users.create({
      id: randomUUID(),
      email,
      password,
    });

    try {
      return await this.users.save(user);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError as { code?: string };

        if (driverError.code === '23505') {
          return null;
        }
      }

      throw error;
    }
  }
}
