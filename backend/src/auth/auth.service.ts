import { Injectable } from "@nestjs/common";
import { AuthPayloadDto } from "./dto/auth.dto.js";
import { JwtService } from "@nestjs/jwt";

type AuthInput = { username: string; email: string}

 //Mockup TODO:change to database schema
const users = [{
        username: 'Alice@alicent.com',
        password: 'Alicent1234'
    },
    {
        username: 'Bianca',
        password: 'WeissSchnee1234'
    }
];


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