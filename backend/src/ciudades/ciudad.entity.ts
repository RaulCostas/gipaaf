import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany } from 'typeorm';
import { Sucursal } from '../sucursales/sucursal.entity';

@Entity('ciudades')
export class Ciudad {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 150 })
    nombre: string;

    @Column({ default: true })
    activo: boolean;

    @OneToMany(() => Sucursal, (sucursal) => sucursal.ciudad)
    sucursales: Sucursal[];

    @CreateDateColumn()
    creadoEn: Date;

    @UpdateDateColumn()
    actualizadoEn: Date;

    @DeleteDateColumn()
    eliminadoEn: Date;

    @Column({ name: 'usuario_id', nullable: true })
    usuarioId: number;
}
