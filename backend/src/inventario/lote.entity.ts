import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Producto } from '../productos/producto.entity';
import { Sucursal } from '../sucursales/sucursal.entity';
import { Nota } from '../notas/nota.entity';

@Entity('lotes')
export class Lote {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    numeroLote: string;

    @ManyToOne(() => Producto, { eager: true })
    producto: Producto;

    @ManyToOne(() => Sucursal, { eager: true, nullable: true })
    sucursal: Sucursal;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    cantidadInicial: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    cantidadActual: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    costoUnitario: number;

    @Column({ type: 'timestamp' })
    fechaIngreso: Date;

    @Column({ type: 'date', nullable: true })
    fechaVencimiento: Date;

    @ManyToOne(() => Nota, { nullable: true })
    notaIngreso: Nota;

    @CreateDateColumn()
    creadoEn: Date;

    @UpdateDateColumn()
    actualizadoEn: Date;
}
