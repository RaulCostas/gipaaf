import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('perfil')
    async perfil(@Request() req) {
        const usuario = await this.authService.validateUsuario(req.user.id);
        if (!usuario) return req.user;
        return {
            id: usuario.id,
            email: usuario.email,
            username: usuario.username,
            persona: usuario.persona,
            roles: usuario.roles,
            sucursal: usuario.sucursal,
            personal: usuario.personal,
        };
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('cambiar-password')
    async cambiarPassword(@Request() req, @Body() body: { currentPassword: string; newPassword: string }) {
        return this.authService.changePassword(req.user.id, body.currentPassword, body.newPassword);
    }
}
