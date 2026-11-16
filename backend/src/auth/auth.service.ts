import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuthPayloadDto } from "./dto/auth.dto.js";
import { users } from "./fixtures/users.fixtures.js";

@Injectable()
export class AuthService {

    constructor(private jwtService: JwtService) {}

    login({ username, password }: AuthPayloadDto) {
        const user = users.find((entry) => entry.username === username);
        if (!user || user.password !== password) {
            throw new UnauthorizedException();
        }

        return {
            accessToken: this.jwtService.sign({ username: user.username }),
        };
    }
}
