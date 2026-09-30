import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Search, Phone } from 'lucide-react';

export interface Country {
    code: string;       // e.g. "+591"
    name: string;       // e.g. "Bolivia"
    flag: string;       // e.g. "🇧🇴"
    iso: string;        // e.g. "BO"
}

export const COUNTRIES: Country[] = [
    { code: '+591', name: 'Bolivia', flag: '🇧🇴', iso: 'BO' },
    { code: '+86',  name: 'China', flag: '🇨🇳', iso: 'CN' },
    { code: '+54',  name: 'Argentina', flag: '🇦🇷', iso: 'AR' },
    { code: '+55',  name: 'Brasil', flag: '🇧🇷', iso: 'BR' },
    { code: '+56',  name: 'Chile', flag: '🇨🇱', iso: 'CL' },
    { code: '+51',  name: 'Perú', flag: '🇵🇪', iso: 'PE' },
    { code: '+57',  name: 'Colombia', flag: '🇨🇴', iso: 'CO' },
    { code: '+595', name: 'Paraguay', flag: '🇵🇾', iso: 'PY' },
    { code: '+598', name: 'Uruguay', flag: '🇺🇾', iso: 'UY' },
    { code: '+593', name: 'Ecuador', flag: '🇪🇨', iso: 'EC' },
    { code: '+58',  name: 'Venezuela', flag: '🇻🇪', iso: 'VE' },
    { code: '+1',   name: 'Estados Unidos / Canadá', flag: '🇺🇸', iso: 'US' },
    { code: '+52',  name: 'México', flag: '🇲🇽', iso: 'MX' },
    { code: '+507', name: 'Panamá', flag: '🇵🇦', iso: 'PA' },
    { code: '+34',  name: 'España', flag: '🇪🇸', iso: 'ES' },
    { code: '+49',  name: 'Alemania', flag: '🇩🇪', iso: 'DE' },
    { code: '+39',  name: 'Italia', flag: '🇮🇹', iso: 'IT' },
    { code: '+33',  name: 'Francia', flag: '🇫🇷', iso: 'FR' },
    { code: '+44',  name: 'Reino Unido', flag: '🇬🇧', iso: 'GB' },
    { code: '+81',  name: 'Japón', flag: '🇯🇵', iso: 'JP' },
    { code: '+82',  name: 'Corea del Sur', flag: '🇰🇷', iso: 'KR' },
    { code: '+886', name: 'Taiwán', flag: '🇹🇼', iso: 'TW' },
    { code: '+91',  name: 'India', flag: '🇮🇳', iso: 'IN' },
    { code: '+90',  name: 'Turquía', flag: '🇹🇷', iso: 'TR' },
];

// Helper to extract prefix and local number from raw string
function parsePhoneString(raw: string | undefined | null): { country: Country; localNumber: string } {
    if (!raw || !raw.trim()) {
        return { country: COUNTRIES[0], localNumber: '' };
    }
    const clean = raw.trim();

    // Sorted by longest code first so +595 matches before +59, etc.
    const sorted = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length);

    for (const c of sorted) {
        if (clean.startsWith(c.code)) {
            const rest = clean.slice(c.code.length).trim();
            return { country: c, localNumber: rest };
        }
    }

    // If starts with + but not found in preset, or just plain digits
    if (clean.startsWith('+')) {
        const match = clean.match(/^\+(\d{1,4})(.*)$/);
        if (match) {
            const prefix = `+${match[1]}`;
            const rest = match[2].trim();
            const found = COUNTRIES.find(c => c.code === prefix);
            if (found) return { country: found, localNumber: rest };
            return {
                country: { code: prefix, name: 'Otro', flag: '🌐', iso: 'XX' },
                localNumber: rest
            };
        }
    }

    // Default to Bolivia if no international prefix
    return { country: COUNTRIES[0], localNumber: clean };
}

interface PhoneInputProps {
    value?: string | null;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    className?: string;
    id?: string;
    name?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
    value,
    onChange,
    placeholder = '71234567',
    disabled = false,
    required = false,
    className = '',
    id,
    name
}) => {
    const { country: parsedCountry, localNumber: parsedLocal } = useMemo(() => parsePhoneString(value), [value]);
    
    const [selectedCountry, setSelectedCountry] = useState<Country>(parsedCountry);
    const [localNumber, setLocalNumber] = useState<string>(parsedLocal);
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Sync external value changes
    useEffect(() => {
        setSelectedCountry(parsedCountry);
        setLocalNumber(parsedLocal);
    }, [parsedCountry, parsedLocal]);

    // Handle outside clicks to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            setTimeout(() => searchInputRef.current?.focus(), 50);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const filteredCountries = useMemo(() => {
        if (!search.trim()) return COUNTRIES;
        const q = search.toLowerCase().trim();
        return COUNTRIES.filter(c => 
            c.name.toLowerCase().includes(q) || 
            c.code.includes(q) || 
            c.iso.toLowerCase().includes(q)
        );
    }, [search]);

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
        // Check if user pasted a full international number e.g. +86 1380000
        if (val.startsWith('+')) {
            const parsed = parsePhoneString(val);
            setSelectedCountry(parsed.country);
            setLocalNumber(parsed.localNumber);
            if (!parsed.localNumber.trim()) {
                onChange('');
            } else {
                onChange(`${parsed.country.code}${parsed.localNumber.trim()}`);
            }
            return;
        }

        setLocalNumber(val);
        const trimmed = val.trim();
        if (!trimmed) {
            onChange('');
        } else {
            onChange(`${selectedCountry.code}${trimmed}`);
        }
    };

    const handleSelectCountry = (country: Country) => {
        setSelectedCountry(country);
        setIsOpen(false);
        setSearch('');
        const trimmed = localNumber.trim();
        if (trimmed) {
            onChange(`${country.code}${trimmed}`);
        }
    };

    return (
        <div className={`relative flex items-center w-full rounded-lg border bg-background text-sm transition-all focus-within:ring-2 focus-within:ring-primary/20 hover:border-primary/50 ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`} ref={dropdownRef}>
            {/* Country Selector Button */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-2.5 py-2 bg-muted/40 hover:bg-muted/70 border-r text-foreground rounded-l-lg transition-colors shrink-0 outline-none text-xs font-semibold select-none"
                title={`${selectedCountry.name} (${selectedCountry.code})`}
            >
                <span className="text-base leading-none">{selectedCountry.flag}</span>
                <span className="font-mono">{selectedCountry.code}</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            {/* Local Phone Number Input */}
            <div className="relative flex-1 flex items-center min-w-0">
                <input
                    type="tel"
                    id={id}
                    name={name}
                    disabled={disabled}
                    required={required}
                    value={localNumber}
                    onChange={handleNumberChange}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/60"
                />
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-64 max-h-64 bg-card border border-border shadow-2xl rounded-xl z-50 overflow-hidden flex flex-col animate-in fade-in-0 zoom-in-95 duration-100">
                    <div className="p-2 border-b bg-muted/30">
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Buscar país o código..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-8 pr-2 py-1.5 bg-background border rounded-md text-xs outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div className="overflow-y-auto max-h-48 divide-y divide-border/30">
                        {filteredCountries.length === 0 ? (
                            <div className="p-3 text-center text-xs text-muted-foreground">
                                No se encontraron países
                            </div>
                        ) : (
                            filteredCountries.map((c) => {
                                const isSelected = c.code === selectedCountry.code;
                                return (
                                    <button
                                        key={`${c.iso}-${c.code}`}
                                        type="button"
                                        onClick={() => handleSelectCountry(c)}
                                        className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs hover:bg-primary/10 transition-colors ${isSelected ? 'bg-primary/15 font-bold text-primary' : 'text-foreground'}`}
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <span className="text-base leading-none shrink-0">{c.flag}</span>
                                            <span className="truncate">{c.name}</span>
                                        </div>
                                        <span className="font-mono text-muted-foreground shrink-0 ml-2">{c.code}</span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PhoneInput;
