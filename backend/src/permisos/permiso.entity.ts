import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToMany,
    CreateDateColumn,
} from 'typeorm';
import { Rol } from '../roles/rol.entity';

@Entity('permisos')
export class Permiso {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    nombre: string;

    @Column({ length: 100 })
    recurso: string;

    @Column({ length: 50 })
    accion: string;

    @Column({ nullable: true })
    descripcion: string;

    @ManyToMany(() => Rol, (rol) => rol.permisos)
    roles: Rol[];

    @CreateDateColumn()
    creadoEn: Date;
}
