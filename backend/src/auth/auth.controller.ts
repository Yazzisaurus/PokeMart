import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { AuthPayloadDto } from "./dto/auth.dto.js";
import { AuthService } from "./auth.service.js";
import { LocalGuard } from "./guards/local.guard.js";
import { JwtAuthGuard } from "./guards/jwt.guard.js";
import type { Request } from "express";

@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService) {}

    @Post('login')
    @UseGuards(LocalGuard)
    login(@Req() req: Request) {
        return req.user
    }

    @Get('status')
    @UseGuards(JwtAuthGuard)
    status(@Req() req: Request) {
        return req.user
    }
}