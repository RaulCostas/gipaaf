import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
} from 'typeorm';

export enum Cargo {
    GERENTE = 'GERENTE',
    ADMINISTRATIVO = 'ADMINISTRATIVO',
    VENDEDOR = 'VENDEDOR',
    JEFE_VENTAS = 'JEFE_VENTAS',
    RESPONSABLE_ALMACEN = 'RESPONSABLE_ALMACEN',
}

import { Sucursal } from '../sucursales/sucursal.entity';

@Entity('personal')
export class Personal {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Sucursal, { eager: true, nullable: true })
    sucursal: Sucursal;

    @Column({ length: 100 })
    nombres: string;

    @Column({ length: 100 })
    apellidos: string;

    @Column({ length: 20, unique: true, nullable: true })
    ci: string;

    @Column({ length: 20, nullable: true })
    telefono: string;

    @Column({ length: 255, nullable: true })
    direccion: string;

    @Column({ type: 'date', nullable: true })
    fechaIngreso: Date;

    @Column({ type: 'date', nullable: true })
    fechaBaja: Date;

    @Column({ type: 'text', nullable: true })
    motivoBaja: string;

    @Column({ nullable: true })
    carnetAnverso: string;

    @Column({ nullable: true })
    carnetReverso: string;

    @Column({ type: 'enum', enum: Cargo, default: Cargo.VENDEDOR })
    cargo: Cargo;

    @Column({ default: true })
    activo: boolean;

    @CreateDateColumn()
    creadoEn: Date;

    @UpdateDateColumn()
    actualizadoEn: Date;

    @DeleteDateColumn()
    eliminadoEn: Date;

    // Campo de auditoría
    @Column({ name: 'usuario_id', nullable: true })
    usuarioId: number;
}
