import React from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Tags, Layers, Building2, MapPin, Settings } from 'lucide-react';

const configModules = [
    { name: 'Marcas', path: '/marcas', icon: Bookmark, description: 'Gestionar las marcas de los productos' },
    { name: 'Categorías', path: '/categorias', icon: Tags, description: 'Clasificar los productos en categorías' },
    { name: 'Grupos', path: '/grupos', icon: Layers, description: 'Organizar los productos por grupos' },
    { name: 'Sucursales', path: '/sucursales', icon: Building2, description: 'Configurar las sucursales' },
    { name: 'Ciudades', path: '/ciudades', icon: MapPin, description: 'Listado de ciudades para sucursales' },
];

const ConfiguracionPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <Settings className="w-8 h-8 text-primary/80" />
                        Configuración General
                    </h1>
                    <p className="text-muted-foreground italic mt-1">Módulos de configuración base del sistema. Utilice estas opciones para definir los parámetros generales.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {configModules.map((module) => {
                    const Icon = module.icon;
                    return (
                        <Link 
                            key={module.path} 
                            to={module.path}
                            className="bg-card border rounded-xl p-6 hover:shadow-md transition-all flex flex-col items-center text-center gap-4 group hover:border-primary/50"
                        >
                            <div className="p-4 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors group-hover:scale-110 transform duration-200">
                                <Icon className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">{module.name}</h2>
                                <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default ConfiguracionPage;
