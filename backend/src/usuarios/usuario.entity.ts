import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    OneToOne,
    JoinColumn,
    ManyToMany,
    JoinTable,
    ManyToOne,
} from 'typeorm';
import { Persona } from '../personas/persona.entity';
import { Rol } from '../roles/rol.entity';
import { Sucursal } from '../sucursales/sucursal.entity';
import { Personal } from '../personal/personal.entity';

@Entity('usuarios')
export class Usuario {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100, unique: true })
    email: string;

    @Column()
    password: string;

    @Column({ length: 50, unique: true })
    username: string;

    @Column({ default: true })
    activo: boolean;

    @OneToOne(() => Persona, (persona) => persona.usuario, { eager: true, cascade: true })
    @JoinColumn()
    persona: Persona;

    @ManyToMany(() => Rol, (rol) => rol.usuarios, { eager: true })
    @JoinTable({ name: 'usuario_roles' })
    roles: Rol[];

    @ManyToOne(() => Sucursal, { nullable: true, eager: true })
    sucursal: Sucursal;

    @ManyToOne(() => Personal, { nullable: true, eager: true })
    @JoinColumn({ name: 'personal_id' })
    personal: Personal;

    @CreateDateColumn()
    creadoEn: Date;

    @UpdateDateColumn()
    actualizadoEn: Date;

    @DeleteDateColumn()
    eliminadoEn: Date;
}
