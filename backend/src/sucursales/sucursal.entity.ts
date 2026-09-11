import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    OneToMany,
    ManyToOne,
} from 'typeorm';
import { Ciudad } from '../ciudades/ciudad.entity';
import { Inventario } from '../inventario/inventario.entity';

@Entity('sucursales')
export class Sucursal {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 150 })
    nombre: string;

    @Column({ nullable: true })
    direccion: string;

    @Column({ length: 20, nullable: true })
    telefono: string;

    @Column({ length: 100, nullable: true })
    email: string;

    @Column({ length: 150, nullable: true })
    horarioAtencion: string;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    latitud: number;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    longitud: number;

    @Column({ default: true })
    activo: boolean;

    @OneToMany(() => Inventario, (inv) => inv.sucursal)
    inventarios: Inventario[];

    @ManyToOne(() => Ciudad, (ciudad) => ciudad.sucursales, { eager: true, nullable: true })
    ciudad: Ciudad;

    @CreateDateColumn()
    creadoEn: Date;

    @UpdateDateColumn()
    actualizadoEn: Date;

    @DeleteDateColumn()
    eliminadoEn: Date;

    @Column({ name: 'usuario_id', nullable: true })
    usuarioId: number;
}
