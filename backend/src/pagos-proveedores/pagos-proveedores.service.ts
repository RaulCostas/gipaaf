import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PagoProveedor } from './pago-proveedor.entity';
import { Nota, TipoNota, EstadoNota } from '../notas/nota.entity';

@Injectable()
export class PagosProveedoresService {
    constructor(
        @InjectRepository(PagoProveedor) private repo: Repository<PagoProveedor>,
        private dataSource: DataSource
    ) { }

    findAll() {
        return this.repo.find({
            where: { activo: true },
            relations: [
                'nota', 
                'nota.sucursal', 
                'nota.sucursal.ciudad', 
                'proveedor', 
                'proveedor.persona'
            ],
            order: { creadoEn: 'DESC' }
        });
    }

    getByNota(notaId: number) {
        return this.repo.find({
            where: { nota: { id: notaId } },
            relations: ['nota', 'proveedor', 'proveedor.persona'],
            order: { fecha: 'ASC', creadoEn: 'ASC' }
        });
    }

    async findOne(id: number) {
        const p = await this.repo.findOne({
            where: { id },
            relations: [
                'nota', 
                'nota.sucursal', 
                'nota.sucursal.ciudad', 
                'proveedor', 
                'proveedor.persona'
            ]
        });
        if (!p) throw new NotFoundException('Pago a proveedor no encontrado');
        return p;
    }

    async getDeudas(proveedorId?: number) {
        const query = this.dataSource.getRepository(Nota).createQueryBuilder('nota')
            .leftJoinAndSelect('nota.proveedor', 'proveedor')
            .leftJoinAndSelect('proveedor.persona', 'persona')
            .leftJoinAndSelect('nota.sucursal', 'sucursal')
            .leftJoinAndSelect('sucursal.ciudad', 'ciudad')
            .where('nota.tipo = :tipo', { tipo: TipoNota.COMPRA })
            .andWhere('nota.saldo > 0')
            .andWhere('nota.estado = :estado', { estado: EstadoNota.CONFIRMADA });

        if (proveedorId) {
            query.andWhere('nota.proveedor.id = :proveedorId', { proveedorId });
        }

        return query.orderBy('nota.fecha', 'ASC').getMany();
    }

    async create(data: any) {
        return await this.dataSource.transaction(async manager => {
            const notaId = data.nota?.id || data.notaId || data.nota;
            const nota = await manager.findOne(Nota, { where: { id: notaId } });
            if (!nota) throw new NotFoundException('Compra no encontrada');
            if (nota.estado !== EstadoNota.CONFIRMADA) {
                throw new BadRequestException('Solo se pueden registrar pagos a compras en estado CONFIRMADA');
            }

            const monto = Number(data.monto);
            if (isNaN(monto) || monto <= 0) {
                throw new BadRequestException('El monto debe ser mayor a 0');
            }

            const monedaPago = data.moneda || 'BOB';
            const tipoCambio = Number(data.tipoCambio) || Number(nota.tipoCambio) || 6.96;

            // Calcular monto equivalente en la moneda original de la compra
            let montoEquivalente = monto;
            const monedaNota = nota.moneda || 'BOB';

            if (monedaNota === 'USD' && monedaPago === 'BOB') {
                montoEquivalente = Number((monto / tipoCambio).toFixed(2));
            } else if (monedaNota === 'BOB' && monedaPago === 'USD') {
                montoEquivalente = Number((monto * tipoCambio).toFixed(2));
            }

            if (Number(nota.saldo) < montoEquivalente) {
                const simboloNota = monedaNota === 'USD' ? '$us' : 'Bs.';
                const simboloPago = monedaPago === 'USD' ? '$us' : 'Bs.';
                throw new BadRequestException(
                    `El monto a pagar (${simboloPago} ${monto.toFixed(2)}${monedaPago !== monedaNota ? ` ≈ ${simboloNota} ${montoEquivalente.toFixed(2)}` : ''}) supera el saldo pendiente de la compra (${simboloNota} ${Number(nota.saldo).toFixed(2)})`
                );
            }

            const pago = manager.create(PagoProveedor, {
                ...data,
                monto,
                moneda: monedaPago,
                tipoCambio,
                montoEquivalente,
                comprobanteUrl: data.comprobanteUrl || null,
                nota: { id: nota.id },
                proveedor: { id: data.proveedor?.id || data.proveedorId || nota.proveedor?.id }
            });
            const savedPago = await manager.save(pago);

            nota.saldo = Math.max(0, Number(nota.saldo) - montoEquivalente);
            await manager.save(nota);

            return savedPago;
        });
    }

    async update(id: number, data: any) {
        return await this.dataSource.transaction(async manager => {
            const pago = await manager.findOne(PagoProveedor, { where: { id }, relations: ['nota', 'proveedor'] });
            if (!pago) throw new NotFoundException('Pago no encontrado');
            if (!pago.activo) throw new BadRequestException('No se puede editar un pago anulado');

            const nota = await manager.findOne(Nota, { where: { id: pago.nota.id } });
            if (!nota) throw new NotFoundException('Compra asociada no encontrada');

            // Revertir el abono anterior para calcular el saldo disponible
            const anteriorMontoEquivalente = Number(pago.montoEquivalente > 0 ? pago.montoEquivalente : pago.monto);
            const saldoSinEstePago = Number(nota.saldo) + anteriorMontoEquivalente;

            const nuevoMonto = Number(data.monto);
            if (isNaN(nuevoMonto) || nuevoMonto <= 0) {
                throw new BadRequestException('El monto debe ser mayor a 0');
            }

            const monedaPago = data.moneda || pago.moneda || 'BOB';
            const tipoCambio = Number(data.tipoCambio) || Number(pago.tipoCambio) || Number(nota.tipoCambio) || 6.96;

            let nuevoMontoEquivalente = nuevoMonto;
            const monedaNota = nota.moneda || 'BOB';

            if (monedaNota === 'USD' && monedaPago === 'BOB') {
                nuevoMontoEquivalente = Number((nuevoMonto / tipoCambio).toFixed(2));
            } else if (monedaNota === 'BOB' && monedaPago === 'USD') {
                nuevoMontoEquivalente = Number((nuevoMonto * tipoCambio).toFixed(2));
            }

            if (saldoSinEstePago < nuevoMontoEquivalente) {
                const simboloNota = monedaNota === 'USD' ? '$us' : 'Bs.';
                const simboloPago = monedaPago === 'USD' ? '$us' : 'Bs.';
                throw new BadRequestException(
                    `El nuevo monto (${simboloPago} ${nuevoMonto.toFixed(2)}${monedaPago !== monedaNota ? ` ≈ ${simboloNota} ${nuevoMontoEquivalente.toFixed(2)}` : ''}) supera el saldo disponible de la compra (${simboloNota} ${saldoSinEstePago.toFixed(2)})`
                );
            }

            pago.monto = nuevoMonto;
            pago.moneda = monedaPago;
            pago.tipoCambio = tipoCambio;
            pago.montoEquivalente = nuevoMontoEquivalente;
            if (data.fecha) pago.fecha = data.fecha;
            if (data.metodoPago) pago.metodoPago = data.metodoPago;
            if (data.referencia !== undefined) pago.referencia = data.referencia;
            if (data.observaciones !== undefined) pago.observaciones = data.observaciones;
            if (data.comprobanteUrl !== undefined) pago.comprobanteUrl = data.comprobanteUrl;

            const savedPago = await manager.save(pago);

            nota.saldo = Math.max(0, saldoSinEstePago - nuevoMontoEquivalente);
            await manager.save(nota);

            return savedPago;
        });
    }

    async anular(id: number) {
        return await this.dataSource.transaction(async manager => {
            const pago = await manager.findOne(PagoProveedor, { where: { id }, relations: ['nota'] });
            if (!pago) throw new NotFoundException('Pago no encontrado');
            if (!pago.activo) throw new BadRequestException('El pago ya está anulado');

            pago.activo = false;
            await manager.save(pago);

            if (pago.nota) {
                const revertMonto = Number(pago.montoEquivalente > 0 ? pago.montoEquivalente : pago.monto);
                pago.nota.saldo = Number(pago.nota.saldo) + revertMonto;
                await manager.save(pago.nota);
            }

            return pago;
        });
    }
}
