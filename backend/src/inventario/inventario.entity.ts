import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Producto } from '../productos/producto.entity';
import { Sucursal } from '../sucursales/sucursal.entity';

@Entity('inventario')
export class Inventario {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Producto, (prod) => prod.inventarios, { eager: true })
    producto: Producto;

    @ManyToOne(() => Sucursal, { eager: true, nullable: true })
    sucursal: Sucursal;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    stockActual: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    stockMinimo: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    stockMaximo: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    precioCompra: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    precioVenta: number;

    @CreateDateColumn()
    creadoEn: Date;

    @UpdateDateColumn()
    actualizadoEn: Date;
}
