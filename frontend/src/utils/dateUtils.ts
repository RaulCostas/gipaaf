/**
 * Utilidades para manejo y formateo de fechas sin problemas de zona horaria.
 * Evita el desfase de 1 día que ocurre cuando 'YYYY-MM-DD' es interpretado como UTC medianoche en zonas horarias negativas (ej. Bolivia UTC-4).
 */

/**
 * Formatea una fecha a 'DD/MM/YYYY' de manera segura sin desfases de huso horario.
 */
export function formatDate(date: string | Date | null | undefined): string {
    if (!date) return '-';

    if (typeof date === 'string') {
        const cleanStr = date.split('T')[0].trim();
        const parts = cleanStr.split('-');
        if (parts.length === 3) {
            const [y, m, d] = parts;
            if (y && m && d) {
                return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
            }
        }
    }

    if (date instanceof Date) {
        if (isNaN(date.getTime())) return '-';
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${d}/${m}/${y}`;
    }

    return String(date);
}

/**
 * Formatea fecha y hora a 'DD/MM/YYYY HH:mm'
 */
export function formatDateTime(date: string | Date | null | undefined): string {
    if (!date) return '-';

    try {
        const d = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(d.getTime())) return '-';
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
        return formatDate(date);
    }
}

/**
 * Convierte cualquier fecha a formato 'YYYY-MM-DD' adecuado para campos <input type="date">
 */
export function toInputDate(date: string | Date | null | undefined): string {
    if (!date) return '';
    if (typeof date === 'string') {
        return date.split('T')[0].trim();
    }
    if (date instanceof Date && !isNaN(date.getTime())) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    return '';
}
