import { Injectable, BadRequestException} from "@nestjs/common";
import { RegistrationPayloadDto } from "./dto/registration.dto.js";
import { users } from "./fixtures/users.fixtures.js"

@Injectable()
export class RegistrationService {

    validateNewUser({ username, password}: RegistrationPayloadDto) {
            const findUserByEmail = users.find((user) => user.username === username);

            if (!findUserByEmail) {
                const hasMinLength = password.length >= 10;
                const hasLowercase = /[a-z]/.test(password);
                const hasUppercase = /[A-Z]/.test(password);
                const hasNumber = /[0-9]/.test(password);
                const hasSymbol = /[^A-Za-z0-9]/.test(password);

                if (!hasMinLength || !hasLowercase || !hasUppercase || !hasNumber || !hasSymbol) {
                    throw new BadRequestException('Password must be at least 10 characters and include uppercase, lowercase, a number, and a symbol');
                }
            }

            throw new BadRequestException('Username is already in use, please choose another one');
        }
}