import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { LocalGuard } from "../auth/guards/local.guard.js";
import type { Request } from "express";

@Controller('regis')
export class RegistrationController {

    @Post('registration')
    @UseGuards(LocalGuard)
    registration(@Req() req: Request) {
        return req.user
    }
}