import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { RegistrationService } from "./registration.service.js";
import { RegistrationPayloadDto } from "./dto/registration.dto.js";

@Controller('registration')
export class RegistrationController {

    constructor(private registrationService: RegistrationService) {}

    @Post('newuser')
    registration(@Body() registrationDto: RegistrationPayloadDto) {
        return this.registrationService.validateNewUser(registrationDto)
    }
}