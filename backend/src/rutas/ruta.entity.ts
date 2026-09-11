import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import { Personal } from '../personal/personal.entity';
import { Sucursal } from '../sucursales/sucursal.entity';

@Entity('rutas')
export class Ruta {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Sucursal, { eager: true, nullable: true })
    sucursal: Sucursal;

    @Column({ length: 100 })
    nombre: string;

    @Column({ nullable: true })
    descripcion: string;

    @Column({ default: true })
    activo: boolean;

    @ManyToOne(() => Personal, { eager: true, nullable: true })
    vendedor: Personal;

    @CreateDateColumn()
    creadoEn: Date;

    @UpdateDateColumn()
    actualizadoEn: Date;

    @DeleteDateColumn()
    eliminadoEn: Date;

    // Campo de auditoría
    @Column({ name: 'usuario_id', nullable: true })
    usuarioId: number;

    @OneToMany('Cliente', (cliente: any) => cliente.ruta)
    clientes: any[];
}
