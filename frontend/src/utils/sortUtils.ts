/**
 * Ordena una lista de detalles de venta/proforma primero por Marca (A-Z)
 * y luego por nombre de Producto (A-Z). Los ítems sin marca quedan al final.
 */
export function sortDetallesByMarcaAndProduct<T extends { productoId?: number; producto?: any }>(
    detalles: T[],
    productsCatalog?: Array<{ id: number; marca?: { nombre?: string } | null }>
): T[] {
    const getMarcaNombre = (det: T): string => {
        const direct = det.producto?.marca?.nombre;
        if (direct) return String(direct).trim();
        if (productsCatalog && (det.productoId || det.producto?.id)) {
            const pId = Number(det.productoId || det.producto?.id);
            const found = productsCatalog.find(p => p.id === pId);
            if (found?.marca?.nombre) return String(found.marca.nombre).trim();
        }
        return '';
    };

    return [...(detalles || [])].sort((a, b) => {
        const marcaA = getMarcaNombre(a);
        const marcaB = getMarcaNombre(b);
        if (marcaA !== marcaB) {
            if (!marcaA) return 1;
            if (!marcaB) return -1;
            const cmpMarca = marcaA.localeCompare(marcaB, 'es', { sensitivity: 'base' });
            if (cmpMarca !== 0) return cmpMarca;
        }
        const prodA = String(a.producto?.nombre || '').trim();
        const prodB = String(b.producto?.nombre || '').trim();
        return prodA.localeCompare(prodB, 'es', { sensitivity: 'base' });
    });
}

/**
 * Ordena una lista de detalles de compra alfabéticamente por nombre de Producto (A-Z).
 * En caso de empate en nombre, ordena por código de producto.
 */
export function sortDetallesByProduct<T extends { productoId?: number; producto?: any }>(
    detalles: T[],
    productsCatalog?: Array<{ id: number; nombre?: string; codigo?: string }>
): T[] {
    const getProdInfo = (det: T): { nombre: string; codigo: string } => {
        let nombre = det.producto?.nombre;
        let codigo = det.producto?.codigo;
        if ((!nombre || !codigo) && productsCatalog && (det.productoId || det.producto?.id)) {
            const pId = Number(det.productoId || det.producto?.id);
            const found = productsCatalog.find(p => p.id === pId);
            if (found) {
                if (!nombre) nombre = found.nombre;
                if (!codigo) codigo = found.codigo;
            }
        }
        return {
            nombre: String(nombre || '').trim(),
            codigo: String(codigo || '').trim()
        };
    };

    return [...(detalles || [])].sort((a, b) => {
        const infoA = getProdInfo(a);
        const infoB = getProdInfo(b);
        const cmp = infoA.nombre.localeCompare(infoB.nombre, 'es', { sensitivity: 'base' });
        if (cmp !== 0) return cmp;
        return infoA.codigo.localeCompare(infoB.codigo, 'es', { sensitivity: 'base' });
    });
}

