import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
} from 'typeorm';
import { Persona } from '../personas/persona.entity';
import { Nota } from '../notas/nota.entity';

@Entity('proveedores')
export class Proveedor {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => Persona, { eager: true, cascade: true })
    @JoinColumn()
    persona: Persona;

    @Column({ length: 150, nullable: true })
    empresa: string;

    @Column({ length: 20, nullable: true })
    ruc: string;

    @Column({ nullable: true })
    observaciones: string;

    @Column({ default: true })
    activo: boolean;

    @Column({ length: 100, nullable: true })
    marca: string;

    @Column({ length: 100, nullable: true })
    pais: string;


    @OneToMany(() => Nota, (nota) => nota.proveedor)
    notas: Nota[];

    @CreateDateColumn()
    creadoEn: Date;

    @UpdateDateColumn()
    actualizadoEn: Date;

    @DeleteDateColumn()
    eliminadoEn: Date;

    @Column({ name: 'usuario_id', nullable: true })
    usuarioId: number;
}
