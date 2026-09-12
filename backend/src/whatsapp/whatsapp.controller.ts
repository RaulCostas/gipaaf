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

export class SendProformaDto {
    @ApiProperty({ description: 'ID de la proforma / cotización' })
    @IsNumber()
    @IsNotEmpty()
    proformaId: number;

    @ApiProperty({ required: false, description: 'Número de teléfono o JID destinatario' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({ required: false, description: 'ID de la sucursal de WhatsApp emisora' })
    @IsOptional()
    @IsNumber()
    sucursalId?: number;

    @ApiProperty({ required: false, description: 'Mensaje o pie personalizado que acompaña al PDF' })
    @IsOptional()
    @IsString()
    message?: string;

    @IsOptional()
    usuarioId?: any;
}

export class SendVentaDto {
    @ApiProperty({ description: 'ID de la nota de venta' })
    @IsNumber()
    @IsNotEmpty()
    ventaId: number;

    @ApiProperty({ required: false, description: 'Número de teléfono o JID destinatario' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({ required: false, description: 'ID de la sucursal de WhatsApp emisora' })
    @IsOptional()
    @IsNumber()
    sucursalId?: number;

    @ApiProperty({ required: false, description: 'Mensaje o pie personalizado que acompaña al PDF' })
    @IsOptional()
    @IsString()
    message?: string;

    @IsOptional()
    usuarioId?: any;
}

export class SendCobranzaDto {
    @ApiProperty({ description: 'ID del pago de cobranza' })
    @IsNumber()
    @IsNotEmpty()
    pagoId: number;

    @ApiProperty({ required: false, description: 'Número de teléfono o JID destinatario' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({ required: false, description: 'ID de la sucursal de WhatsApp emisora' })
    @IsOptional()
    @IsNumber()
    sucursalId?: number;

    @ApiProperty({ required: false, description: 'Mensaje o pie personalizado que acompaña al PDF' })
    @IsOptional()
    @IsString()
    message?: string;

    @IsOptional()
    usuarioId?: any;
}

export class SendCompraDto {
    @ApiProperty({ description: 'ID de la nota de compra' })
    @IsNumber()
    @IsNotEmpty()
    compraId: number;

    @ApiProperty({ required: false, description: 'Número de teléfono o JID destinatario' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({ required: false, description: 'ID de la sucursal de WhatsApp emisora' })
    @IsOptional()
    @IsNumber()
    sucursalId?: number;

    @ApiProperty({ required: false, description: 'Mensaje o pie personalizado que acompaña al PDF' })
    @IsOptional()
    @IsString()
    message?: string;

    @IsOptional()
    usuarioId?: any;
}

export class SendPagoProveedorDto {
    @ApiProperty({ description: 'ID del pago a proveedor' })
    @IsNumber()
    @IsNotEmpty()
    pagoId: number;

    @ApiProperty({ required: false, description: 'Número de teléfono o JID destinatario' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({ required: false, description: 'ID de la sucursal de WhatsApp emisora' })
    @IsOptional()
    @IsNumber()
    sucursalId?: number;

    @ApiProperty({ required: false, description: 'Mensaje o pie personalizado que acompaña al PDF' })
    @IsOptional()
    @IsString()
    message?: string;

    @IsOptional()
    usuarioId?: any;
}

export class SendTraspasoDto {
    @ApiProperty({ description: 'ID del traspaso entre sucursales' })
    @IsNumber()
    @IsNotEmpty()
    traspasoId: number;

    @ApiProperty({ required: false, description: 'Número de teléfono o JID destinatario' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({ required: false, description: 'ID de la sucursal de WhatsApp emisora' })
    @IsOptional()
    @IsNumber()
    sucursalId?: number;

    @ApiProperty({ required: false, description: 'Mensaje o pie personalizado que acompaña al PDF' })
    @IsOptional()
    @IsString()
    message?: string;

    @IsOptional()
    usuarioId?: any;
}

export class SendDevolucionDto {
    @ApiProperty({ description: 'ID de la nota de devolución' })
    @IsNumber()
    @IsNotEmpty()
    devolucionId: number;

    @ApiProperty({ required: false, description: 'Número de teléfono o JID destinatario' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({ required: false, description: 'ID de la sucursal de WhatsApp emisora' })
    @IsOptional()
    @IsNumber()
    sucursalId?: number;

    @ApiProperty({ required: false, description: 'Mensaje o pie personalizado que acompaña al PDF' })
    @IsOptional()
    @IsString()
    message?: string;

    @IsOptional()
    usuarioId?: any;
}

export class SendMuestraDto {
    @ApiProperty({ description: 'ID de la muestra de productos' })
    @IsNumber()
    @IsNotEmpty()
    muestraId: number;

    @ApiProperty({ required: false, description: 'Número de teléfono o JID destinatario' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({ required: false, description: 'ID de la sucursal de WhatsApp emisora' })
    @IsOptional()
    @IsNumber()
    sucursalId?: number;

    @ApiProperty({ required: false, description: 'Mensaje o pie personalizado que acompaña al PDF' })
    @IsOptional()
    @IsString()
    message?: string;

    @IsOptional()
    usuarioId?: any;
}

export class SendCarteraVendedorDto {
    @ApiProperty({ description: 'ID del personal / vendedor' })
    @IsNumber()
    @IsNotEmpty()
    vendedorId: number;

    @ApiProperty({ required: false, description: 'Número de teléfono o JID destinatario' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({ required: false, description: 'ID de la sucursal de WhatsApp emisora' })
    @IsOptional()
    @IsNumber()
    sucursalId?: number;

    @ApiProperty({ required: false, description: 'Mensaje o pie personalizado que acompaña al PDF' })
    @IsOptional()
    @IsString()
    message?: string;

    @IsOptional()
    usuarioId?: any;
}

export class SendEstadoCuentaClienteDto {
    @ApiProperty({ description: 'ID del cliente' })
    @IsNumber()
    @IsNotEmpty()
    clienteId: number;

    @ApiProperty({ required: false, description: 'Número de teléfono o JID destinatario' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({ required: false, description: 'ID de la sucursal de WhatsApp emisora' })
    @IsOptional()
    @IsNumber()
    sucursalId?: number;

    @ApiProperty({ required: false, description: 'Mensaje o pie personalizado que acompaña al PDF' })
    @IsOptional()
    @IsString()
    message?: string;

    @IsOptional()
    usuarioId?: any;
}

export class SendEstadoCuentaVentaDto {
    @ApiProperty({ description: 'ID de la venta / nota' })
    @IsNumber()
    @IsNotEmpty()
    ventaId: number;

    @ApiProperty({ required: false, description: 'Número de teléfono o JID destinatario' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({ required: false, description: 'ID de la sucursal de WhatsApp emisora' })
    @IsOptional()
    @IsNumber()
    sucursalId?: number;

    @ApiProperty({ required: false, description: 'Mensaje o pie personalizado que acompaña al PDF' })
    @IsOptional()
    @IsString()
    message?: string;

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

    @Post('send-proforma')
    async sendProforma(@Body() body: SendProformaDto) {
        const sId = body.sucursalId ? Number(body.sucursalId) : undefined;
        return await this.whatsAppService.sendProformaPdf(body.proformaId, body.phone, sId, body.message);
    }

    @Post('send-venta')
    async sendVenta(@Body() body: SendVentaDto) {
        const sId = body.sucursalId ? Number(body.sucursalId) : undefined;
        return await this.whatsAppService.sendVentaPdf(body.ventaId, body.phone, sId, body.message);
    }

    @Post('send-cobranza')
    async sendCobranza(@Body() body: SendCobranzaDto) {
        const sId = body.sucursalId ? Number(body.sucursalId) : undefined;
        return await this.whatsAppService.sendCobranzaPdf(body.pagoId, body.phone, sId, body.message);
    }

    @Post('send-compra')
    async sendCompra(@Body() body: SendCompraDto) {
        const sId = body.sucursalId ? Number(body.sucursalId) : undefined;
        return await this.whatsAppService.sendCompraPdf(body.compraId, body.phone, sId, body.message);
    }

    @Post('send-pago-proveedor')
    async sendPagoProveedor(@Body() body: SendPagoProveedorDto) {
        const sId = body.sucursalId ? Number(body.sucursalId) : undefined;
        return await this.whatsAppService.sendPagoProveedorPdf(body.pagoId, body.phone, sId, body.message);
    }

    @Post('send-traspaso')
    async sendTraspaso(@Body() body: SendTraspasoDto) {
        const sId = body.sucursalId ? Number(body.sucursalId) : undefined;
        return await this.whatsAppService.sendTraspasoPdf(body.traspasoId, body.phone, sId, body.message);
    }

    @Post('send-devolucion')
    async sendDevolucion(@Body() body: SendDevolucionDto) {
        const sId = body.sucursalId ? Number(body.sucursalId) : undefined;
        return await this.whatsAppService.sendDevolucionPdf(body.devolucionId, body.phone, sId, body.message);
    }

    @Post('send-muestra')
    async sendMuestra(@Body() body: SendMuestraDto) {
        const sId = body.sucursalId ? Number(body.sucursalId) : undefined;
        return await this.whatsAppService.sendMuestraPdf(body.muestraId, body.phone, sId, body.message);
    }

    @Post('send-cartera-vendedor')
    async sendCarteraVendedor(@Body() body: SendCarteraVendedorDto) {
        return await this.whatsAppService.sendCarteraVendedorPdf(body);
    }

    @Post('send-estado-cuenta-cliente')
    async sendEstadoCuentaCliente(@Body() body: SendEstadoCuentaClienteDto) {
        return await this.whatsAppService.sendEstadoCuentaClientePdf(body);
    }

    @Post('send-estado-cuenta-venta')
    async sendEstadoCuentaVenta(@Body() body: SendEstadoCuentaVentaDto) {
        return await this.whatsAppService.sendEstadoCuentaVentaPdf(body);
    }
}
