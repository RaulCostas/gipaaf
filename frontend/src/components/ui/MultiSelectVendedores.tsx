import React, { useState, useRef, useEffect } from 'react';
import { User, ChevronDown, Search, X, Lock } from 'lucide-react';

export interface MultiSelectVendedoresProps {
    vendedores?: any[];
    selectedVendedores: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    isRestrictedVendor?: boolean;
    userPersonal?: any;
    className?: string;
}

export const MultiSelectVendedores: React.FC<MultiSelectVendedoresProps> = ({
    vendedores = [],
    selectedVendedores,
    onChange,
    placeholder = 'Todos los Vendedores',
    isRestrictedVendor = false,
    userPersonal,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    if (isRestrictedVendor && userPersonal) {
        return (
            <div className={`flex items-center gap-2 bg-card border border-primary/30 rounded-lg px-3 py-2 shadow-sm text-sm text-primary font-medium ${className}`}>
                <User className="w-4 h-4 text-primary shrink-0" />
                <span>Mis Registros ({userPersonal.nombres} {userPersonal.apellidos})</span>
                <Lock className="w-3.5 h-3.5 text-muted-foreground ml-1" />
            </div>
        );
    }

    const filteredVendedores = vendedores.filter(v => {
        if (!searchText.trim()) return true;
        const fullName = `${v.nombres || ''} ${v.apellidos || ''}`.toLowerCase();
        return fullName.includes(searchText.toLowerCase());
    });

    const getButtonLabel = () => {
        if (selectedVendedores.length === 0) return placeholder;
        if (selectedVendedores.length === 1) {
            const found = vendedores.find(v => String(v.id) === selectedVendedores[0]);
            return found ? `${found.nombres} ${found.apellidos}` : '1 Vendedor';
        }
        return `${selectedVendedores.length} Vendedores seleccionados`;
    };

    const handleToggle = (idStr: string) => {
        if (selectedVendedores.includes(idStr)) {
            onChange(selectedVendedores.filter(id => id !== idStr));
        } else {
            onChange([...selectedVendedores, idStr]);
        }
    };

    const handleSelectAll = () => {
        onChange(vendedores.map(v => String(v.id)));
    };

    const handleDeselectAll = () => {
        onChange([]);
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between gap-2 bg-card border rounded-lg px-3 py-2 shadow-sm text-sm font-medium transition-all hover:border-primary/50 cursor-pointer w-full ${
                    selectedVendedores.length > 0 ? 'border-primary/50 text-foreground bg-primary/5' : 'text-muted-foreground'
                }`}
            >
                <div className="flex items-center gap-2 truncate max-w-[220px]">
                    <User className={`w-4 h-4 shrink-0 ${selectedVendedores.length > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="truncate">{getButtonLabel()}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-1">
                    {selectedVendedores.length > 0 && (
                        <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-primary text-primary-foreground">
                            {selectedVendedores.length}
                        </span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-72 bg-popover text-popover-foreground border rounded-xl shadow-xl z-50 p-2 animate-in fade-in-0 zoom-in-95">
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-muted/50 rounded-lg mb-2 border">
                        <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <input
                            type="text"
                            placeholder="Buscar vendedor..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="bg-transparent border-none outline-none text-xs flex-1 placeholder:text-muted-foreground/70"
                            autoFocus
                        />
                        {searchText && (
                            <button type="button" onClick={() => setSearchText('')} className="text-muted-foreground hover:text-foreground">
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center justify-between px-2 py-1 border-b mb-1 text-[11px] text-muted-foreground">
                        <button
                            type="button"
                            onClick={handleSelectAll}
                            className="hover:text-primary font-semibold transition-colors cursor-pointer"
                        >
                            Seleccionar todos
                        </button>
                        <button
                            type="button"
                            onClick={handleDeselectAll}
                            className="hover:text-destructive font-semibold transition-colors cursor-pointer"
                        >
                            Deseleccionar todos
                        </button>
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-0.5 py-1">
                        {filteredVendedores.length === 0 ? (
                            <div className="p-3 text-center text-xs text-muted-foreground italic">
                                No se encontraron vendedores
                            </div>
                        ) : (
                            filteredVendedores.map(v => {
                                const isChecked = selectedVendedores.includes(String(v.id));
                                return (
                                    <label
                                        key={v.id}
                                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs cursor-pointer select-none transition-colors ${
                                            isChecked ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => handleToggle(String(v.id))}
                                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                                        />
                                        <span className="truncate flex-1">{v.nombres} {v.apellidos}</span>
                                        {v.sucursal?.nombre && (
                                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                {v.sucursal.nombre}
                                            </span>
                                        )}
                                    </label>
                                );
                            })
                        )}
                    </div>

                    {selectedVendedores.length > 0 && (
                        <div className="pt-2 border-t mt-1 flex items-center justify-between text-[11px] px-2">
                            <span className="text-muted-foreground font-medium">
                                {selectedVendedores.length} seleccionado{selectedVendedores.length > 1 ? 's' : ''}
                            </span>
                            <button
                                type="button"
                                onClick={handleDeselectAll}
                                className="text-primary hover:underline font-semibold cursor-pointer"
                            >
                                Limpiar selección
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MultiSelectVendedores;
