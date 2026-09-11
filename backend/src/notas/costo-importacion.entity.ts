import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Nota } from './nota.entity';
import { Sucursal } from '../sucursales/sucursal.entity';
import { Usuario } from '../usuarios/usuario.entity';

export interface GastoImportacionItem {
    motivo: string;
    montoUsd?: number;
    montoBob: number;
    porcentaje: number;
}

@Entity('costos_importacion')
export class CostoImportacion {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'notaId' })
    notaId: number;

    @OneToOne(() => Nota, (n) => n.costoImportacion, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'notaId' })
    nota: Nota;

    @Column({ name: 'sucursalId', nullable: true })
    sucursalId: number;

    @ManyToOne(() => Sucursal, { nullable: true, eager: true })
    @JoinColumn({ name: 'sucursalId' })
    sucursal: Sucursal;

    @Column({ name: 'usuarioId', nullable: true })
    usuarioId: number;

    @ManyToOne(() => Usuario, { nullable: true, eager: true })
    @JoinColumn({ name: 'usuarioId' })
    usuario: Usuario;

    @Column({ type: 'date', default: () => 'CURRENT_DATE' })
    fecha: Date;

    @Column({ type: 'decimal', precision: 12, scale: 4, default: 6.96 })
    tipoCambio: number;

    @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
    costoFobUsd: number;

    @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
    costoFobBob: number;

    @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
    totalGastosBob: number;

    @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
    costoTotalBob: number;

    @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
    porcentajeGastos: number;

    @Column({ type: 'jsonb', default: () => "'[]'" })
    gastos: GastoImportacionItem[];

    @Column({ type: 'varchar', length: 10, default: 'BOB' })
    monedaGastos: string;

    @Column({ type: 'varchar', length: 100, default: 'Transferencia Bancaria' })
    metodoPago: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    referencia: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    comprobanteUrl: string;

    @CreateDateColumn()
    creadoEn: Date;

    @UpdateDateColumn()
    actualizadoEn: Date;
}
