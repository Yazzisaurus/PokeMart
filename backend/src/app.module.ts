import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { RegistrationModule } from './registration/registration.module.js';

@Module({
  imports: [AuthModule, RegistrationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
