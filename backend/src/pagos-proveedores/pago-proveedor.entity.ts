import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
} from 'typeorm';
import { Proveedor } from '../proveedores/proveedor.entity';
import { Nota, Moneda } from '../notas/nota.entity';

@Entity('pagos_proveedor')
export class PagoProveedor {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Nota, { eager: true })
    nota: Nota;

    @ManyToOne(() => Proveedor, { eager: true })
    proveedor: Proveedor;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    monto: number;

    @Column({ type: 'varchar', length: 10, default: Moneda.BOB })
    moneda: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 6.96 })
    tipoCambio: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    montoEquivalente: number; // Monto convertido a la moneda original de la compra

    @Column({ type: 'date' })
    fecha: Date;

    @Column({ length: 50, nullable: true })
    metodoPago: string;

    @Column({ nullable: true })
    referencia: string; // ej. nro de transferencia, cheque, recibo, etc.

    @Column({ nullable: true })
    observaciones: string;

    @Column({ nullable: true })
    comprobanteUrl: string; // URL de la imagen o archivo PDF del comprobante / voucher QR

    @Column({ default: true })
    activo: boolean;

    @CreateDateColumn()
    creadoEn: Date;

    @UpdateDateColumn()
    actualizadoEn: Date;

    @DeleteDateColumn()
    eliminadoEn: Date;

    @Column({ name: 'usuario_id', nullable: true })
    usuarioId: number;
}
