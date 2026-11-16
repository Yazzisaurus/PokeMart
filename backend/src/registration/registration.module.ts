import { Module } from '@nestjs/common';
import { RegistrationService } from './registration.service.js';
import { RegistrationController } from './registration.controller.js';

@Module({
    providers: [RegistrationService],
    controllers: [RegistrationController]
})

export class RegistrationModule {}