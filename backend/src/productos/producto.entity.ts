import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    JoinColumn,
} from 'typeorm';
import { Marca } from '../marcas/marca.entity';
import { Grupo } from '../grupos/grupo.entity';
import { Categoria } from '../categorias/categoria.entity';
import { Inventario } from '../inventario/inventario.entity';

@Entity('productos')
export class Producto {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 50, unique: true })
    codigo: string;

    @Column({ length: 200 })
    nombre: string;

    @Column({ nullable: true })
    descripcion: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    precioCompra: number;

    @Column({ type: 'date', nullable: true })
    fechaUltimaCompra: Date;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    precioVenta: number;

    @Column({ length: 20, default: 'UNIDAD' })
    unidadMedida: string;

    @Column({ nullable: true })
    imagen: string;

    @Column({ default: true })
    activo: boolean;

    @Column({ nullable: true })
    categoriaId: number;

    @Column({ nullable: true })
    marcaId: number;

    @Column({ nullable: true })
    grupoId: number;

    @ManyToOne(() => Categoria, { eager: true })
    @JoinColumn({ name: 'categoriaId' })
    categoria: Categoria;

    @ManyToOne(() => Marca, { nullable: true })
    @JoinColumn({ name: 'marcaId' })
    marca: Marca;

    @ManyToOne(() => Grupo, { nullable: true })
    @JoinColumn({ name: 'grupoId' })
    grupo: Grupo;

    @OneToMany(() => Inventario, (inv) => inv.producto)
    inventarios: Inventario[];

    @CreateDateColumn()
    creadoEn: Date;

    @UpdateDateColumn()
    actualizadoEn: Date;

    @DeleteDateColumn()
    eliminadoEn: Date;

    @Column({ name: 'usuario_id', nullable: true })
    usuarioId: number;
}
