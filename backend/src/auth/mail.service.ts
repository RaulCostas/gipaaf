import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST || 'smtp.gmail.com',
            port: Number(process.env.MAIL_PORT) || 587,
            secure: Number(process.env.MAIL_PORT) === 465 || process.env.MAIL_SECURE === 'true',
            auth: {
                user: process.env.MAIL_USER || '',
                pass: process.env.MAIL_PASS || '',
            },
        });
    }

    async sendPasswordRecovery(email: string, tempPassword: string, nombreUsuario?: string): Promise<boolean> {
        const displayName = nombreUsuario || 'Usuario';
        const mailOptions = {
            from: process.env.MAIL_FROM || `"GIPAAF - Sistema de Gestión" <${process.env.MAIL_USER || 'noreply@gipaaf.com'}>`,
            to: email,
            subject: 'Recuperación de Contraseña - GIPAAF',
            text: `GIPAAF\n\nHola ${displayName},\n\nHas solicitado restablecer tu contraseña de acceso al sistema GIPAAF.\n\nTu contraseña temporal es: ${tempPassword}\n\nPor favor, ingresa al sistema con esta contraseña y cámbiala de inmediato desde el menú "Cambiar Contraseña".`,
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <h1 style="color: #dc2626; font-size: 28px; font-weight: 900; margin: 0; letter-spacing: -0.5px;">GIPAAF</h1>
                        <p style="color: #64748b; font-size: 13px; margin-top: 4px; font-weight: 500;">Sistema Integral de Gestión Comercial e Inventarios</p>
                    </div>

                    <div style="border-top: 3px solid #dc2626; padding-top: 20px;">
                        <p style="font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 8px;">Hola, ${displayName}:</p>
                        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-top: 0;">
                            Has solicitado restablecer tu contraseña de acceso al sistema. Hemos generado una <strong>contraseña temporal</strong> exclusiva para tu cuenta:
                        </p>
                        
                        <div style="background: linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%); padding: 20px; border-radius: 12px; text-align: center; margin: 24px 0; border: 1px solid #fecdd3;">
                            <span style="font-family: 'Courier New', monospace; font-size: 26px; font-weight: 800; color: #b91c1c; letter-spacing: 3px;">${tempPassword}</span>
                        </div>

                        <div style="background-color: #f8fafc; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px;">
                            <p style="color: #b45309; font-size: 13px; font-weight: 600; margin: 0;">
                                ⚠️ IMPORTANTE: Por razones de seguridad, te recomendamos cambiar esta contraseña temporal inmediatamente después de ingresar al sistema desde la opción <em>"Cambiar Contraseña"</em> en el menú lateral.
                            </p>
                        </div>
                    </div>
                    
                    <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 28px; text-align: center;">
                        <p style="color: #94a3b8; font-size: 12px; margin: 0;">Este es un mensaje automático generado por el sistema GIPAAF.</p>
                        <p style="color: #94a3b8; font-size: 11px; margin-top: 4px;">Si no solicitaste este cambio, ponte en contacto con el administrador del sistema.</p>
                    </div>
                </div>
            `,
        };

        try {
            await this.transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error('[MailService] Error enviando correo de recuperación:', error);
            return false;
        }
    }
}
