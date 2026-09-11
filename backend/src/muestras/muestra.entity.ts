import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    JoinColumn,
} from 'typeorm';
import { Cliente } from '../clientes/cliente.entity';
import { Sucursal } from '../sucursales/sucursal.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { Personal } from '../personal/personal.entity';
import { DetalleMuestra } from './detalle-muestra.entity';

export enum EstadoMuestra {
    ENTREGADO = 'ENTREGADO',
    DEVUELTO_PARCIAL = 'DEVUELTO_PARCIAL',
    DEVUELTO_TOTAL = 'DEVUELTO_TOTAL',
    ANULADO = 'ANULADO',
}

@Entity('muestras')
export class Muestra {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    numero: string;

    @Column({ type: 'date', default: () => 'CURRENT_DATE' })
    fecha: Date | string;

    @Column({ type: 'date', nullable: true })
    fechaEstimadaDevolucion: Date | string | null;

    @Column({ type: 'date', nullable: true })
    fechaDevolucion: Date | string | null;

    @Column({
        type: 'varchar',
        length: 50,
        default: EstadoMuestra.ENTREGADO,
    })
    estado: EstadoMuestra;

    @ManyToOne(() => Cliente, { eager: true })
    @JoinColumn({ name: 'clienteId' })
    cliente: Cliente;

    @ManyToOne(() => Sucursal, { nullable: true, eager: true })
    @JoinColumn({ name: 'sucursalId' })
    sucursal: Sucursal;

    @ManyToOne(() => Usuario, { nullable: true, eager: true })
    @JoinColumn({ name: 'usuarioId' })
    usuario: Usuario;

    @ManyToOne(() => Personal, { nullable: true, eager: true })
    @JoinColumn({ name: 'vendedorId' })
    vendedor: Personal;

    @Column({ nullable: true })
    observaciones: string;

    @OneToMany(() => DetalleMuestra, (det) => det.muestra, { cascade: true, eager: true })
    detalles: DetalleMuestra[];

    @CreateDateColumn()
    creadoEn: Date;

    @UpdateDateColumn()
    actualizadoEn: Date;

    @DeleteDateColumn()
    eliminadoEn: Date;
}
