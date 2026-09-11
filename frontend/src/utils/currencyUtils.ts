export const formatCurrency = (amount: number | string | undefined | null, currency: 'BOB' | 'USD' = 'BOB'): string => {
    const num = Number(amount) || 0;
    // Uses de-DE standard to guarantee period for thousands (even for 4-digit numbers) and comma for decimals
    const formattedNumber = new Intl.NumberFormat('de-DE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num);
    
    return `${currency === 'USD' ? '$us' : 'Bs.'} ${formattedNumber}`;
};

export const formatQuantity = (amount: number | string | undefined | null): string => {
    const num = Number(amount) || 0;
    return new Intl.NumberFormat('de-DE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(num);
};

export const numeroALetras = (num: number): string => {
    if (num === 0) return 'CERO 00/100 BOLIVIANOS';

    const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const dieces = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    const getCentenas = (n: number) => {
        if (n === 100) return 'CIEN';
        const centena = Math.floor(n / 100);
        const resto = n - (centena * 100);
        return `${centenas[centena]} ${getDecenas(resto)}`.trim();
    };

    const getDecenas = (n: number) => {
        if (n < 10) return unidades[n];
        if (n >= 10 && n < 20) return dieces[n - 10];
        const decena = Math.floor(n / 10);
        const resto = n - (decena * 10);
        if (n === 20) return 'VEINTE';
        if (n > 20 && n < 30) return `VEINTI${unidades[resto]}`;
        return resto > 0 ? `${decenas[decena]} Y ${unidades[resto]}` : decenas[decena];
    };

    const getMiles = (n: number) => {
        const miles = Math.floor(n / 1000);
        const resto = n - (miles * 1000);
        let strMiles = '';
        if (miles === 1) strMiles = 'MIL';
        else if (miles > 1) strMiles = `${getCentenas(miles)} MIL`;
        return `${strMiles} ${getCentenas(resto)}`.trim();
    };

    const entero = Math.floor(Math.abs(num));
    const centavos = Math.round((Math.abs(num) - entero) * 100);
    const centavosStr = centavos.toString().padStart(2, '0');

    let letras = '';
    if (entero < 100) letras = getDecenas(entero);
    else if (entero < 1000) letras = getCentenas(entero);
    else if (entero < 1000000) letras = getMiles(entero);
    else letras = 'MILLONES...'; // Simplificado

    return `${letras} ${centavosStr}/100 BOLIVIANOS`.trim();
};
