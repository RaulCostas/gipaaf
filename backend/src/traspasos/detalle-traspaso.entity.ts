import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
} from 'typeorm';
import { Traspaso } from './traspaso.entity';
import { Producto } from '../productos/producto.entity';

@Entity('detalles_traspaso')
export class DetalleTraspaso {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Traspaso, (traspaso) => traspaso.detalles, {
        onDelete: 'CASCADE',
    })
    traspaso: Traspaso;

    @ManyToOne(() => Producto, { nullable: false })
    producto: Producto;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    cantidad: number;

    @Column({ length: 100, nullable: true })
    numeroLote: string;

    @Column({ type: 'date', nullable: true })
    fechaVencimiento: Date;

    @Column({ type: 'text', nullable: true })
    lotesDetalle: string;

    @Column({ length: 255, nullable: true })
    observacion: string;
}
