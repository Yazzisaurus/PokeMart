import { Injectable } from "@nestjs/common";
import { AuthPayloadDto } from "./dto/auth.dto.js";
import { JwtService } from "@nestjs/jwt";
import { users } from "../auth/fixtures/users.fixtures.js"

type AuthInput = { username: string; email: string };

@Injectable()
export class AuthService {

    constructor(private jwtService: JwtService) {}

    validateUser({ username, password}: AuthPayloadDto) {
        const findUserByEmail = users.find((user) => user.username === username);
        if (!findUserByEmail) return null;

        if (password === findUserByEmail.password){
            const {password, ...user} = findUserByEmail 
            return this.jwtService.sign(user)
        }
    }
}