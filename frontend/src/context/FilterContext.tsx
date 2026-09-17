import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface FilterContextType {
    selectedCiudad: string;
    setSelectedCiudad: (id: string) => void;
    selectedSucursal: string;
    setSelectedSucursal: (id: string) => void;
    userSucursal: any | null;
    userCiudad: any | null;
    isRestrictedToBranch: boolean;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isAdmin } = useAuth();

    const userSucursal = user?.sucursal || user?.personal?.sucursal || null;
    const userCiudad = userSucursal?.ciudad || null;
    const isRestrictedToBranch = !isAdmin && Boolean(userSucursal?.id);

    const [selectedCiudad, setSelectedCiudadState] = useState<string>('');
    const [selectedSucursal, setSelectedSucursalState] = useState<string>('');

    // Synchronize filters when user or restriction changes
    useEffect(() => {
        if (isRestrictedToBranch && userSucursal?.id) {
            setSelectedSucursalState(String(userSucursal.id));
            if (userCiudad?.id) {
                setSelectedCiudadState(String(userCiudad.id));
            }
        }
    }, [isRestrictedToBranch, userSucursal?.id, userCiudad?.id]);

    const setSelectedCiudad = (id: string) => {
        if (isRestrictedToBranch) return; // Prevent non-admin from changing
        setSelectedCiudadState(id);
    };

    const setSelectedSucursal = (id: string) => {
        if (isRestrictedToBranch) return; // Prevent non-admin from changing
        setSelectedSucursalState(id);
    };

    return (
        <FilterContext.Provider value={{ 
            selectedCiudad, 
            setSelectedCiudad, 
            selectedSucursal, 
            setSelectedSucursal,
            userSucursal,
            userCiudad,
            isRestrictedToBranch
        }}>
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