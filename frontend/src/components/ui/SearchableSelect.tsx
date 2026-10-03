import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface SearchableOption {
    value: string | number;
    label: string;
    sublabel?: string;
    code?: string;
    badge?: string;
    badgeVariant?: 'default' | 'success' | 'warning' | 'danger';
    disabled?: boolean;
}

export interface SearchableSelectProps {
    value: string | number | undefined;
    onChange: (value: string) => void;
    options: SearchableOption[];
    placeholder?: string;
    searchPlaceholder?: string;
    disabled?: boolean;
    className?: string;
    allowClear?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
    value,
    onChange,
    options,
    placeholder = 'Seleccione una opción...',
    searchPlaceholder = 'Buscar...',
    disabled = false,
    className = '',
    allowClear = true,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Selected option object
    const selectedOption = useMemo(() => {
        if (value === undefined || value === null || value === '') return null;
        return options.find(opt => String(opt.value) === String(value)) || null;
    }, [options, value]);

    // Filtered options based on search term
    const filteredOptions = useMemo(() => {
        if (!searchTerm.trim()) return options;
        const term = searchTerm.toLowerCase().trim();
        return options.filter(opt => {
            const matchesLabel = opt.label.toLowerCase().includes(term);
            const matchesCode = opt.code ? opt.code.toLowerCase().includes(term) : false;
            const matchesSublabel = opt.sublabel ? opt.sublabel.toLowerCase().includes(term) : false;
            const matchesBadge = opt.badge ? opt.badge.toLowerCase().includes(term) : false;
            return matchesLabel || matchesCode || matchesSublabel || matchesBadge;
        });
    }, [options, searchTerm]);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            // Auto focus search input when opening
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 50);
        } else {
            setSearchTerm('');
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    const handleSelect = (opt: SearchableOption) => {
        if (opt.disabled) return;
        onChange(String(opt.value));
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setSearchTerm('');
    };

    const getBadgeClass = (variant?: 'default' | 'success' | 'warning' | 'danger') => {
        switch (variant) {
            case 'success':
                return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
            case 'warning':
                return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
            case 'danger':
                return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
            default:
                return 'bg-muted text-muted-foreground border-border';
        }
    };

    return (
        <div className={`relative w-full ${className}`} ref={containerRef}>
            {/* Control Button */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full min-h-[40px] px-3 py-1.5 bg-background border rounded-lg text-xs flex items-center justify-between gap-2 text-left transition-all ${
                    disabled 
                        ? 'opacity-60 cursor-not-allowed bg-muted/40' 
                        : 'cursor-pointer hover:border-primary/50 focus:ring-2 focus:ring-primary/20'
                } ${isOpen ? 'ring-2 ring-primary/20 border-primary' : ''}`}
            >
                <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                    {selectedOption ? (
                        <>
                            <div className="flex items-center gap-1.5 min-w-0 flex-wrap sm:flex-nowrap">
                                {selectedOption.code && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-muted text-muted-foreground rounded border shrink-0">
                                        {selectedOption.code}
                                    </span>
                                )}
                                <span className="font-semibold text-foreground text-xs leading-tight line-clamp-2 sm:line-clamp-1">
                                    {selectedOption.label}
                                </span>
                            </div>
                            {selectedOption.sublabel && (
                                <span className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                                    {selectedOption.sublabel}
                                </span>
                            )}
                        </>
                    ) : (
                        <span className="text-muted-foreground text-xs">{placeholder}</span>
                    )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    {allowClear && selectedOption && !disabled && (
                        <span
                            role="button"
                            onClick={handleClear}
                            className="p-1 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                            title="Limpiar selección"
                        >
                            <X className="w-3.5 h-3.5" />
                        </span>
                    )}
                    <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-card border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-80 animate-in fade-in-50 zoom-in-95 min-w-full">
                    {/* Search Input */}
                    <div className="p-2 border-b bg-muted/30 relative flex items-center gap-2">
                        <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-4 pointer-events-none" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="w-full pl-8 pr-8 py-2 text-xs bg-background border rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3.5 p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Options List */}
                    <div className="overflow-y-auto divide-y divide-border/40 max-h-64 p-1 overscroll-contain">
                        {filteredOptions.length === 0 ? (
                            <div className="p-4 text-center text-xs text-muted-foreground">
                                No se encontraron productos
                            </div>
                        ) : (
                            filteredOptions.map((opt) => {
                                const isSelected = String(opt.value) === String(value);
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        disabled={opt.disabled}
                                        onClick={() => handleSelect(opt)}
                                        className={`w-full p-2.5 rounded-lg text-left text-xs flex items-center justify-between gap-3 transition-colors ${
                                            opt.disabled
                                                ? 'opacity-40 cursor-not-allowed bg-muted/20'
                                                : isSelected
                                                ? 'bg-primary/10 text-primary font-medium cursor-pointer'
                                                : 'hover:bg-accent cursor-pointer text-foreground'
                                        }`}
                                    >
                                        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5 min-w-0 flex-wrap sm:flex-nowrap">
                                                {opt.code && (
                                                    <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-muted text-muted-foreground rounded shrink-0">
                                                        {opt.code}
                                                    </span>
                                                )}
                                                <span className="font-medium text-foreground text-xs leading-snug break-words line-clamp-2">{opt.label}</span>
                                            </div>
                                            {opt.sublabel && (
                                                <span className={`text-[11px] leading-tight ${opt.disabled ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                                                    {opt.sublabel}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {isSelected && (
                                                <Check className="w-4 h-4 text-primary" />
                                            )}
                                        </div>
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
