import React, { createContext, useContext, useState } from 'react';

interface FilterContextType {
    selectedCiudad: string;
    setSelectedCiudad: (id: string) => void;
    selectedSucursal: string;
    setSelectedSucursal: (id: string) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedCiudad, setSelectedCiudad] = useState('');
    const [selectedSucursal, setSelectedSucursal] = useState('');

    return (
        <FilterContext.Provider value={{ selectedCiudad, setSelectedCiudad, selectedSucursal, setSelectedSucursal }}>
            {children}
        </FilterContext.Provider>
    );
};

export const useFilters = () => {
    const context = useContext(FilterContext);
    if (!context) {
        throw new Error('useFilters must be used within a FilterProvider');
    }
    return context;
};