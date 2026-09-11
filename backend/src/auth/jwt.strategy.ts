import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        private authService: AuthService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'pos_jwt_secret_2026_super_secure',
        });
    }

    async validate(payload: any) {
        const usuario = await this.authService.validateUsuario(payload.sub);
        return {
            id: payload.sub,
            email: payload.email,
            username: payload.username,
            roles: payload.roles,
            usuario,
        };
    }
}
