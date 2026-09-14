import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Sucursal } from '../sucursales/sucursal.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { DetalleTraspaso } from './detalle-traspaso.entity';
import { Egreso } from '../egresos/egreso.entity';

export enum EstadoTraspaso {
    COMPLETADO = 'COMPLETADO',
    ANULADO = 'ANULADO',
}

export enum CargoCostoTraspaso {
    ORIGEN = 'ORIGEN',
    DESTINO = 'DESTINO',
}

@Entity('traspasos')
export class Traspaso {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, length: 50 })
    codigo: string;

    @Column({ type: 'date' })
    fecha: string;

    @ManyToOne(() => Sucursal, { nullable: true })
    sucursalOrigen: Sucursal;

    @ManyToOne(() => Sucursal, { nullable: true })
    sucursalDestino: Sucursal;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    costoTransporte: number; // Costo del traspaso en Bolivianos (Bs.)

    @Column({
        type: 'enum',
        enum: CargoCostoTraspaso,
        default: CargoCostoTraspaso.ORIGEN,
    })
    sucursalCargoCosto: CargoCostoTraspaso; // Sucursal que asume el costo de transporte (ORIGEN o DESTINO)

    @ManyToOne(() => Egreso, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn()
    egreso: Egreso;

    @Column({ type: 'text', nullable: true })
    motivo: string;

    @Column({ type: 'text', nullable: true })
    observaciones: string;

    @Column({
        type: 'enum',
        enum: EstadoTraspaso,
        default: EstadoTraspaso.COMPLETADO,
    })
    estado: EstadoTraspaso;

    @ManyToOne(() => Usuario, { nullable: true })
    usuario: Usuario;

    @OneToMany(() => DetalleTraspaso, (detalle) => detalle.traspaso, {
        cascade: true,
    })
    detalles: DetalleTraspaso[];

    @Column({ default: true })
    activo: boolean;

    @CreateDateColumn()
    creadoEn: Date;

    @UpdateDateColumn()
    actualizadoEn: Date;
}
