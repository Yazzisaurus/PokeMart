import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { AuthPayloadDto } from "./dto/auth.dto.js";
import { AuthService } from "./auth.service.js";

@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService) {}

    @Post('signup')
    signup(@Body() { email, password }: AuthPayloadDto) {
        return this.authService.signup(email, password);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    login(@Body() { email, password }: AuthPayloadDto) {
        return this.authService.login(email, password);
    }
}
