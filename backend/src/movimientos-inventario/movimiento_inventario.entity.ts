import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Inventario } from '../inventario/inventario.entity';
import { Usuario } from '../usuarios/usuario.entity';

@Entity('movimientos_inventario')
export class MovimientoInventario {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Inventario, { eager: true, onDelete: 'CASCADE' })
    inventario: Inventario;

    @Column({ length: 50 })
    tipo: string;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    cantidad: number;

    @Column({ length: 255 })
    motivo: string;

    @Column({ nullable: true, length: 100 })
    numeroDocumento: string;

    @Column({ type: 'text', nullable: true })
    observaciones: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, default: 0 })
    costoUnitario: number;

    @ManyToOne(() => Usuario, { eager: true, nullable: true })
    usuario: Usuario;

    @CreateDateColumn()
    creadoEn: Date;
}
