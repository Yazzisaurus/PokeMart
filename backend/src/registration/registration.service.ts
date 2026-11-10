import { Injectable } from "@nestjs/common";
import { AuthPayloadDto } from "../auth/dto/auth.dto.js";
import { users } from "../auth/fixtures/users.fixtures.js"

@Injectable()
export class RegistrationService {

    validateUserUniqueness({ username, password}: AuthPayloadDto) {
            const findUserByEmail = users.find((user) => user.username === username);
            if (!findUserByEmail) return "Ok";
        }
}