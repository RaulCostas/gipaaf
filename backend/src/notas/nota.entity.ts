import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    OneToOne,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
} from 'typeorm';
import { Cliente } from '../clientes/cliente.entity';
import { Proveedor } from '../proveedores/proveedor.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { Sucursal } from '../sucursales/sucursal.entity';
import { Personal } from '../personal/personal.entity';
import { DetalleNota } from './detalle-nota.entity';
import { CostoImportacion } from './costo-importacion.entity';

export enum TipoNota {
    COMPRA = 'COMPRA',
    VENTA = 'VENTA',
    DEVOLUCION = 'DEVOLUCION',
    PROFORMA = 'PROFORMA',
}

export enum Moneda {
    BOB = 'BOB',
    USD = 'USD',
}

export enum EstadoNota {
    PENDIENTE = 'PENDIENTE',
    CONFIRMADA = 'CONFIRMADA',
    ANULADA = 'ANULADA',
}

@Entity('notas')
export class Nota {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    numero: string;

    @Column({ type: 'varchar', length: 50 })
    tipo: TipoNota;

    @Column({ type: 'varchar', length: 50, default: EstadoNota.PENDIENTE })
    estado: EstadoNota;

    @Column({ type: 'date' })
    fecha: Date;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    subtotal: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    descuento: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    descuentoPorcentaje: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    descuentoPromocionPorcentaje: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    descuentoPromocion: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    impuesto: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    total: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    saldo: number;

    @Column({ nullable: true })
    observaciones: string;

    @ManyToOne(() => Cliente, (c) => c.notas, { nullable: true, eager: true })
    cliente: Cliente;

    @ManyToOne(() => Proveedor, (p) => p.notas, { nullable: true, eager: true })
    proveedor: Proveedor;

    @ManyToOne(() => Personal, { nullable: true, eager: true })
    vendedor: Personal;

    @ManyToOne(() => Usuario, { eager: true })
    usuario: Usuario;

    @ManyToOne(() => Sucursal, { eager: true })
    sucursal: Sucursal;

    @OneToMany(() => DetalleNota, (det) => det.nota, { cascade: true, eager: true })
    detalles: DetalleNota[];

    @OneToOne(() => CostoImportacion, (c) => c.nota, { nullable: true })
    costoImportacion: CostoImportacion;

    @Column({ type: 'varchar', length: 10, default: Moneda.BOB })
    moneda: Moneda;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 1 })
    tipoCambio: number;

    @Column({ type: 'boolean', default: false })
    conFactura: boolean;

    @Column({ type: 'varchar', length: 50, default: 'CONTADO' })
    tipoPago: string;

    @Column({ type: 'int', default: 0 })
    diasCredito: number;

    @Column({ type: 'date', nullable: true })
    fechaVencimiento: Date;

    @Column({ type: 'varchar', length: 100, nullable: true })
    numeroFactura: string;

    @CreateDateColumn()
    creadoEn: Date;

    @UpdateDateColumn()
    actualizadoEn: Date;

    @DeleteDateColumn()
    eliminadoEn: Date;
}
