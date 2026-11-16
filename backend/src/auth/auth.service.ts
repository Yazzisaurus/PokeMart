import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserRepository } from "./user.repository.js";

@Injectable()
export class AuthService {

    constructor(
        private jwtService: JwtService,
        private users: UserRepository,
    ) {}

    async signup(email: string, password: string) {
        const normalizedEmail = this.normalizeEmail(email);
        if (!normalizedEmail || !password) {
            throw new BadRequestException('Email and password are required');
        }
        if (password.length < 8) {
            throw new BadRequestException('Password must be at least 8 characters');
        }

        const existing = await this.users.findByEmail(normalizedEmail);
        if (existing) {
            throw new ConflictException('Email already exists');
        }

        const created = await this.users.create(normalizedEmail, password);
        if (!created) {
            throw new ConflictException('Email already exists');
        }

        return { email: created.email };
    }

    async login(email: string, password: string) {
        const user = await this.users.findByEmail(this.normalizeEmail(email));
        if (!user || user.password !== password) {
            throw new UnauthorizedException();
        }

        return {
            accessToken: this.jwtService.sign({ email: user.email }),
        };
    }

    private normalizeEmail(email: string) {
        return email?.trim().toLowerCase();
    }
}
