import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToMany,
    JoinTable,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { Permiso } from '../permisos/permiso.entity';

@Entity('roles')
export class Rol {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 50, unique: true })
    nombre: string;

    @Column({ nullable: true })
    descripcion: string;

    @Column({ default: true })
    activo: boolean;

    @ManyToMany(() => Usuario, (usuario) => usuario.roles)
    usuarios: Usuario[];

    @ManyToMany(() => Permiso, (permiso) => permiso.roles, { eager: true })
    @JoinTable({ name: 'rol_permisos' })
    permisos: Permiso[];

    @CreateDateColumn()
    creadoEn: Date;

    @UpdateDateColumn()
    actualizadoEn: Date;
}
