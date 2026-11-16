import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy.js';

//TODO change secret
@Module({
    imports: [
        PassportModule,
        JwtModule.register({
            secret:'',
            signOptions: { expiresIn: '1h'}
        }),
    ],
    providers: [AuthService, JwtStrategy],
    controllers: [AuthController]
})

export class AuthModule {}