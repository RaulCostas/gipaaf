import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Lote } from './lote.entity';
import { DetalleNota } from '../notas/detalle-nota.entity';

@Entity('movimientos_lote')
export class MovimientoLote {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Lote, { eager: true })
    lote: Lote;

    @ManyToOne(() => DetalleNota)
    detalleNota: DetalleNota;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    cantidad: number;

    @CreateDateColumn()
    creadoEn: Date;
}
