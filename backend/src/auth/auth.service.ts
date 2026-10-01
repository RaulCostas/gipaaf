import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Usuario } from '../usuarios/usuario.entity';
import { LoginDto } from './dto/login.dto';
import { MailService } from './mail.service';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(Usuario)
        private usuarioRepository: Repository<Usuario>,
        private jwtService: JwtService,
        private mailService: MailService,
    ) { }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;
        const usuario = await this.usuarioRepository.findOne({
            where: { email, activo: true },
            relations: ['roles', 'roles.permisos', 'persona', 'sucursal', 'sucursal.ciudad', 'personal', 'personal.sucursal', 'personal.sucursal.ciudad'],
        });

        if (!usuario) throw new UnauthorizedException('Credenciales incorrectas');
        const esValido = await bcrypt.compare(password, usuario.password);
        if (!esValido) throw new UnauthorizedException('Credenciales incorrectas');

        if (usuario.sucursal && usuario.personal) {
            usuario.personal.sucursal = usuario.sucursal;
        }

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
                foto: usuario.foto,
                persona: usuario.persona,
                roles: usuario.roles,
                sucursal: usuario.sucursal,
                personal: usuario.personal,
            },
        };
    }

    async validateUsuario(id: number): Promise<Usuario | null> {
        const u = await this.usuarioRepository.findOne({ 
            where: { id, activo: true },
            relations: ['roles', 'roles.permisos', 'persona', 'sucursal', 'sucursal.ciudad', 'personal', 'personal.sucursal', 'personal.sucursal.ciudad']
        });
        if (u && u.sucursal && u.personal) {
            u.personal.sucursal = u.sucursal;
        }
        return u;
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

    async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
        const normalizedEmail = (email || '').trim().toLowerCase();
        if (!normalizedEmail) {
            throw new BadRequestException('Por favor, ingresa tu correo electrónico');
        }

        const usuario = await this.usuarioRepository.findOne({
            where: { email: normalizedEmail, activo: true },
            relations: ['persona', 'personal']
        });

        if (!usuario) {
            throw new NotFoundException('El correo electrónico no está registrado o la cuenta se encuentra inactiva');
        }

        // Generar contraseña temporal segura de 8 caracteres alfanuméricos
        const tempPassword = Math.random().toString(36).slice(-6) + Math.floor(10 + Math.random() * 90);
        
        // Guardar nueva contraseña cifrada en la base de datos
        usuario.password = await bcrypt.hash(tempPassword, 10);
        await this.usuarioRepository.save(usuario);

        const nombreUsuario = usuario.persona 
            ? `${usuario.persona.nombres} ${usuario.persona.apellidos || ''}`.trim() 
            : (usuario.personal ? `${usuario.personal.nombres}` : usuario.username);

        // Enviar correo con la plantilla institucional de GIPAAF
        const emailSent = await this.mailService.sendPasswordRecovery(normalizedEmail, tempPassword, nombreUsuario);

        if (!emailSent) {
            console.error(`[MailService] No se pudo enviar el correo a ${normalizedEmail}. Verifica la configuración SMTP.`);
        }

        return {
            success: true,
            message: 'Se ha enviado una contraseña temporal a tu correo electrónico. Por favor revisa tu bandeja de entrada o spam.'
        };
    }
}
