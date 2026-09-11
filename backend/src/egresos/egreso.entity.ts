import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
} from 'typeorm';
import { Sucursal } from '../sucursales/sucursal.entity';
import { Usuario } from '../usuarios/usuario.entity';

export enum MonedaEgreso {
    BOB = 'BOB',
    USD = 'USD',
}

@Entity('egresos')
export class Egreso {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, length: 50 })
    codigo: string;

    @Column({ type: 'date' })
    fecha: string;

    @Column({ type: 'text' })
    detalle: string;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    monto: number;

    @Column({
        type: 'enum',
        enum: MonedaEgreso,
        default: MonedaEgreso.BOB,
    })
    moneda: MonedaEgreso;

    @Column({ type: 'decimal', precision: 10, scale: 4, default: 6.96 })
    tipoCambio: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    montoEquivalente: number;

    @Column({ length: 50, default: 'Efectivo' })
    formaPago: string;

    @Column({ nullable: true, length: 100 })
    nroComprobante: string;

    @Column({ nullable: true, length: 255 })
    comprobanteUrl: string;

    @Column({ type: 'text', nullable: true })
    observaciones: string;

    @ManyToOne(() => Sucursal, { eager: true, nullable: true })
    @JoinColumn({ name: 'sucursalId' })
    sucursal: Sucursal;

    @ManyToOne(() => Usuario, { eager: true, nullable: true })
    @JoinColumn({ name: 'usuarioId' })
    usuario: Usuario;

    @Column({ default: true })
    activo: boolean;

    @CreateDateColumn()
    creadoEn: Date;

    @UpdateDateColumn()
    actualizadoEn: Date;

    @DeleteDateColumn()
    eliminadoEn: Date;
}
