import { Controller, Get, Post, Put, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { WhatsAppService, WhatsAppConfig } from './whatsapp.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray, IsNumber } from 'class-validator';

export class SendTestDto {
    @ApiProperty({ description: 'Número de teléfono o JID destinatario' })
    @IsString()
    @IsNotEmpty()
    phone: string;

    @ApiProperty({ description: 'Texto del mensaje de prueba' })
    @IsString()
    @IsNotEmpty()
    message: string;

    @ApiProperty({ required: false, description: 'ID de la sucursal' })
    @IsOptional()
    @IsNumber()
    sucursalId?: number;

    @IsOptional()
    usuarioId?: any;
}

export class ConnectBranchDto {
    @ApiProperty({ required: false, description: 'ID de la sucursal' })
    @IsOptional()
    @IsNumber()
    sucursalId?: number;

    @IsOptional()
    usuarioId?: any;
}

export class UpdateWhatsAppConfigDto {
    @ApiProperty({ required: false, description: 'ID de la sucursal' })
    @IsOptional()
    @IsNumber()
    sucursalId?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    autoReplyEnabled?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    ignoreGroups?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    allowClientQueries?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    allowSellerQueries?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    allowAdminReports?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    botName?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    customWelcomeMessage?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    bankAccountsInfo?: string;

    @ApiProperty({ required: false, type: Array })
    @IsOptional()
    @IsArray()
    bankAccounts?: any[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    customCatalogPdf?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    catalogPdfName?: string;

    @IsOptional()
    usuarioId?: any;
}

@ApiTags('WhatsApp')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('whatsapp')
export class WhatsAppController {
    constructor(private readonly whatsAppService: WhatsAppService) {}

    @Get('branches-status')
    async getBranchesStatus() {
        return await this.whatsAppService.getBranchesStatus();
    }

    @Get('status')
    async getStatus(@Query('sucursalId') sucursalId?: string) {
        const sId = sucursalId ? parseInt(sucursalId, 10) : undefined;
        return await this.whatsAppService.getStatus(sId);
    }

    @Get('qr')
    async getQr(@Query('sucursalId') sucursalId?: string) {
        const sId = sucursalId ? parseInt(sucursalId, 10) : undefined;
        return await this.whatsAppService.getQr(sId);
    }

    @Post('connect')
    async connect(@Body() body: ConnectBranchDto) {
        const sId = body.sucursalId ? Number(body.sucursalId) : undefined;
        await this.whatsAppService.connectToWhatsApp(sId);
        const status = await this.whatsAppService.getStatus(sId);
        return { message: 'Iniciando conexión con WhatsApp...', status: status.status, sucursalId: status.sucursalId };
    }

    @Post('disconnect')
    async disconnect(@Body() body: ConnectBranchDto) {
        const sId = body.sucursalId ? Number(body.sucursalId) : undefined;
        await this.whatsAppService.disconnect(sId);
        return { message: 'Sesión de WhatsApp cerrada exitosamente', status: 'DISCONNECTED', sucursalId: sId };
    }

    @Get('logs')
    async getLogs(@Query('sucursalId') sucursalId?: string, @Query('limit') limit?: string) {
        const sId = sucursalId ? parseInt(sucursalId, 10) : undefined;
        const lim = limit ? parseInt(limit, 10) : 30;
        return this.whatsAppService.getLogs(sId, lim);
    }

    @Get('config')
    async getConfig(@Query('sucursalId') sucursalId?: string) {
        const sId = sucursalId ? parseInt(sucursalId, 10) : undefined;
        return await this.whatsAppService.getConfig(sId);
    }

    @Put('config')
    async updateConfig(@Body() body: UpdateWhatsAppConfigDto) {
        const sId = body.sucursalId ? Number(body.sucursalId) : undefined;
        return await this.whatsAppService.updateConfig(sId, body);
    }

    @Post('test')
    async sendTest(@Body() body: SendTestDto) {
        const sId = body.sucursalId ? Number(body.sucursalId) : undefined;
        await this.whatsAppService.sendTestMessage(body.phone, body.message, sId);
        return { message: 'Mensaje de prueba enviado exitosamente' };
    }
}
