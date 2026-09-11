import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
    OneToMany,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
} from 'typeorm';
import { Persona } from '../personas/persona.entity';
import { Nota } from '../notas/nota.entity';
import { Ruta } from '../rutas/ruta.entity';
import { Sucursal } from '../sucursales/sucursal.entity';

@Entity('clientes')
export class Cliente {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Sucursal, { eager: true, nullable: true })
    sucursal: Sucursal;

    @OneToOne(() => Persona, { eager: true, cascade: true })
    @JoinColumn()
    persona: Persona;

    @Column({ length: 50, nullable: true })
    codigo: string;

    @Column({ type: 'int', default: 0 })
    plazoCreditoDias: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    creditoDisponible: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    limiteCredito: number;

    @Column({ nullable: true })
    observaciones: string;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    latitud: number;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    longitud: number;

    @Column({ default: true })
    activo: boolean;

    @OneToMany(() => Nota, (nota) => nota.cliente)
    notas: Nota[];

    @ManyToOne(() => Ruta, { eager: true, nullable: true })
    ruta: Ruta;

    @CreateDateColumn()
    creadoEn: Date;

    @UpdateDateColumn()
    actualizadoEn: Date;

    @DeleteDateColumn()
    eliminadoEn: Date;

    @Column({ name: 'usuario_id', nullable: true })
    usuarioId: number;
}
