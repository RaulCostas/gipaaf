import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    CreateDateColumn,
} from 'typeorm';
import { Nota } from './nota.entity';
import { Producto } from '../productos/producto.entity';
import { MovimientoLote } from '../inventario/movimiento-lote.entity';

@Entity('detalle_notas')
export class DetalleNota {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Nota, (nota) => nota.detalles)
    nota: Nota;

    @ManyToOne(() => Producto, { eager: true })
    producto: Producto;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    cantidad: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    precioUnitario: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    subtotal: number;

    @Column({ nullable: true })
    numeroLote: string;

    @Column({ type: 'date', nullable: true })
    fechaVencimiento: Date;

    @Column({ type: 'varchar', length: 50, default: 'ENTRADA_DEVOLUCION' })
    tipoMovimiento: string; // ENTRADA_DEVOLUCION, SALIDA_REPOSICION

    @Column({ type: 'varchar', length: 255, nullable: true })
    motivoDefecto: string; // Abollado, Falla de fábrica, Vencido, Empaque roto, etc.

    @Column({ type: 'varchar', length: 50, nullable: true })
    destinoProducto: string; // REINGRESO_STOCK, DESCARTE_MERMA, RECLAMO_PROVEEDOR

    @OneToMany(() => MovimientoLote, (mov) => mov.detalleNota, { eager: true })
    movimientosLote: MovimientoLote[];

    @CreateDateColumn()
    creadoEn: Date;
}
