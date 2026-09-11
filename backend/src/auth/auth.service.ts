import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Usuario } from '../usuarios/usuario.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(Usuario)
        private usuarioRepository: Repository<Usuario>,
        private jwtService: JwtService,
    ) { }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;
        const usuario = await this.usuarioRepository.findOne({
            where: { email, activo: true },
            relations: ['roles', 'roles.permisos', 'persona', 'sucursal', 'personal'],
        });

        if (!usuario) throw new UnauthorizedException('Credenciales incorrectas');
        const esValido = await bcrypt.compare(password, usuario.password);
        if (!esValido) throw new UnauthorizedException('Credenciales incorrectas');

        const payload = {
            sub: usuario.id,
            email: usuario.email,
            username: usuario.username,
            roles: usuario.roles?.map((r) => r.nombre) ?? [],
            personalId: usuario.personal?.id,
        };

        return {
            access_token: this.jwtService.sign(payload),
            usuario: {
                id: usuario.id,
                email: usuario.email,
                username: usuario.username,
                persona: usuario.persona,
                roles: usuario.roles,
                sucursal: usuario.sucursal,
                personal: usuario.personal,
            },
        };
    }

    async validateUsuario(id: number): Promise<Usuario | null> {
        return this.usuarioRepository.findOne({ 
            where: { id, activo: true },
            relations: ['roles', 'roles.permisos', 'persona', 'sucursal', 'personal']
        });
    }

    async changePassword(userId: number, currentPassword: string, newPassword: string) {
        if (!currentPassword || !newPassword) {
            throw new UnauthorizedException('Debes ingresar la contraseña actual y la nueva');
        }
        if (newPassword.length < 4) {
            throw new UnauthorizedException('La nueva contraseña debe tener al menos 4 caracteres');
        }

        const usuario = await this.usuarioRepository.findOne({ where: { id: userId } });
        if (!usuario) throw new UnauthorizedException('Usuario no encontrado');

        const esValido = await bcrypt.compare(currentPassword, usuario.password);
        if (!esValido) {
            throw new UnauthorizedException('La contraseña actual es incorrecta');
        }

        usuario.password = await bcrypt.hash(newPassword, 10);
        await this.usuarioRepository.save(usuario);
        return { success: true, message: 'Contraseña actualizada con éxito' };
    }
}
