import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    OneToOne,
} from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';

@Entity('personas')
export class Persona {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    nombres: string;

    @Column({ length: 100 })
    apellidos: string;

    @Column({ length: 20, unique: true, nullable: true })
    ci: string;

    @Column({ length: 20, nullable: true })
    telefono: string;

    @Column({ nullable: true })
    direccion: string;

    @Column({ length: 100, nullable: true, unique: true })
    email: string;

    @Column({ default: true })
    activo: boolean;

    @CreateDateColumn()
    creadoEn: Date;

    @UpdateDateColumn()
    actualizadoEn: Date;

    @DeleteDateColumn()
    eliminadoEn: Date;

    @OneToOne(() => Usuario, (usuario) => usuario.persona)
    usuario: Usuario;
}
