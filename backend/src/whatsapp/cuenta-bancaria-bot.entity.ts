import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('cuentas_bancarias_bot')
export class CuentaBancariaBot {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 150 })
    banco: string;

    @Column({ type: 'varchar', length: 100 })
    tipoCuenta: string;

    @Column({ type: 'varchar', length: 100 })
    numeroCuenta: string;

    @Column({ type: 'varchar', length: 150 })
    titular: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    documentoIdentidad?: string;

    @Column({ type: 'text', nullable: true })
    qrImage?: string | null;

    @Column({ type: 'boolean', default: true })
    activo: boolean;

    @Column({ type: 'int', default: 0 })
    orden: number;

    @CreateDateColumn({ type: 'timestamp' })
    creadoEn: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    actualizadoEn: Date;
}
