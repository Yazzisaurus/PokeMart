import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { users } from "./fixtures/users.fixtures.js";

@Injectable()
export class AuthService {

    constructor(private jwtService: JwtService) {}

    signup(username: string, password: string) {
        const normalizedUsername = username?.trim();
        if (!normalizedUsername || !password) {
            throw new BadRequestException('Username and password are required');
        }
        if (password.length < 8) {
            throw new BadRequestException('Password must be at least 8 characters');
        }
        if (users.some((entry) => entry.username === normalizedUsername)) {
            throw new ConflictException('Username already exists');
        }

        users.push({ username: normalizedUsername, password });
        return { username: normalizedUsername };
    }

    login(username: string, password: string) {
        const user = users.find((entry) => entry.username === username);
        if (!user || user.password !== password) {
            throw new UnauthorizedException();
        }

        return {
            accessToken: this.jwtService.sign({ username: user.username }),
        };
    }
}
