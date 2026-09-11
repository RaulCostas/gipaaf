import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    JoinColumn,
} from 'typeorm';
import { Muestra } from './muestra.entity';
import { Producto } from '../productos/producto.entity';

@Entity('detalle_muestras')
export class DetalleMuestra {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Muestra, (m) => m.detalles, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'muestraId' })
    muestra: Muestra;

    @ManyToOne(() => Producto, { eager: true })
    @JoinColumn({ name: 'productoId' })
    producto: Producto;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 1 })
    cantidadEntregada: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    cantidadDevuelta: number;

    @Column({ nullable: true })
    numeroLote: string;

    @Column({ type: 'date', nullable: true })
    fechaVencimiento: Date | string | null;

    @Column({ type: 'varchar', length: 50, default: 'ENTREGADO' })
    estado: string; // ENTREGADO, DEVUELTO, DEVUELTO_PARCIAL

    @Column({ nullable: true })
    observaciones: string;

    @CreateDateColumn()
    creadoEn: Date;
}
