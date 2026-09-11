import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rutaService } from '../../api/rutaService';
import { personalService } from '../../api/personalService';
import { sucursalService } from '../../api/sucursalService';
import { clientService } from '../../api/clientService';
import type { Cliente } from '../../api/clientService';
import type { Ruta } from '../../api/rutaService';
import { 
    Search, Plus, Pencil, Trash2, Map, 
    X, Save, AlignLeft, ChevronLeft, ChevronRight, Check,
    Printer, FileText, FileSpreadsheet, User, Building2, Users,
    CheckSquare, Square, Eye, Phone, MapPin,
    ArrowRightLeft
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { toast } from 'sonner';
import { exportToPDF, exportToExcel, printData } from '../../utils/exportUtils';
import { formatCurrency } from '../../utils/currencyUtils';
import { useFilters } from '../../context/FilterContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const RutasPage: React.FC = () => {
    const { selectedCiudad, selectedSucursal } = useFilters();
    const queryClient = useQueryClient();
    
    // Modal states
    const [isEditing, setIsEditing] = useState(false);
    const [currentRuta, setCurrentRuta] = useState<Partial<Ruta>>({});
    const [selectedClientIds, setSelectedClientIds] = useState<number[]>([]);
    const [modalClientSearch, setModalClientSearch] = useState('');
    const [filterClientsBySucursal, setFilterClientsBySucursal] = useState(true);
    const [onlyUnassignedClients, setOnlyUnassignedClients] = useState(true);

    // Cartera / Hoja de Visitas Modal state
    const [viewingRuta, setViewingRuta] = useState<Ruta | null>(null);
    const [viewingClientSearch, setViewingClientSearch] = useState('');

    // Pagination and Search states
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    // Queries
    const { data: rutasList, isLoading: loadingRutas } = useQuery({
        queryKey: ['rutas'],
        queryFn: rutaService.getAll,
    });

    const { data: clientsList, isLoading: loadingClients } = useQuery({
        queryKey: ['clients'],
        queryFn: () => clientService.getAll(),
    });

    const { data: sucursales } = useQuery({
        queryKey: ['sucursales'],
        queryFn: sucursalService.getAll,
    });

    const { data: personalList } = useQuery({
        queryKey: ['personal'],
        queryFn: personalService.getAll,
    });

    const vendedores = useMemo(() => {
        if (!personalList) return [];
        return personalList.filter(p => p.cargo === 'VENDEDOR' && p.activo);
    }, [personalList]);

    // Initialize selected clients when editing a route
    useEffect(() => {
        if (isEditing) {
            if (currentRuta.id) {
                if (currentRuta.clientes && currentRuta.clientes.length > 0) {
                    setSelectedClientIds(currentRuta.clientes.map((c: any) => c.id));
                } else if (clientsList) {
                    const assigned = clientsList.filter(c => c.ruta?.id === currentRuta.id).map(c => c.id);
                    setSelectedClientIds(assigned);
                } else {
                    setSelectedClientIds([]);
                }
            } else {
                setSelectedClientIds([]);
            }
            setModalClientSearch('');
        }
    }, [isEditing, currentRuta, clientsList]);

    // Export for main table
    const exportColumns = [
        { header: 'Ruta / Zona', dataKey: 'nombre' },
        { header: 'Descripción', dataKey: 'descripcion' },
        { header: 'Vendedor Asignado', dataKey: 'vendedorName' },
        { header: 'Sucursal / Ciudad', dataKey: 'sucursalName' },
        { header: 'Clientes Asignados', dataKey: 'totalClientes' },
        { header: 'Estado', dataKey: 'activo' }
    ];

    const excelColumns = [
        { header: 'ID', dataKey: 'id' },
        ...exportColumns
    ];

    const getExportData = (data: Ruta[]) => {
        return data.map(r => ({
            ...r,
            vendedorName: r.vendedor ? `${r.vendedor.nombres} ${r.vendedor.apellidos}` : 'Sin Asignar',
            sucursalName: r.sucursal?.nombre ? `${r.sucursal.nombre}${r.sucursal.ciudad?.nombre ? ` (${r.sucursal.ciudad.nombre})` : ''}` : 'Sin Asignar',
            totalClientes: r.clientes ? r.clientes.length : 0
        }));
    };

    const handlePrint = () => {
        if (!rutasList) return;
        printData('Reporte de Rutas de Venta', exportColumns, getExportData(filteredRutas));
    };

    const handleExportPDF = () => {
        if (!rutasList) return;
        exportToPDF('Reporte de Rutas de Venta', exportColumns, getExportData(filteredRutas), 'rutas_reporte');
    };

    const handleExportExcel = () => {
        if (!rutasList) return;
        exportToExcel(excelColumns, getExportData(filteredRutas), 'rutas_reporte');
    };

    // Mutations
    const createMutation = useMutation({
        mutationFn: rutaService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rutas'] });
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            setIsEditing(false);
            setCurrentRuta({});
            setSelectedClientIds([]);
            toast.success('Ruta y cartera de clientes creadas con éxito');
        },
        onError: () => {
            toast.error('Ocurrió un error al crear la ruta');
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: Ruta) => rutaService.update(data.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rutas'] });
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            setIsEditing(false);
            setCurrentRuta({});
            setSelectedClientIds([]);
            toast.success('Ruta y cartera de clientes actualizadas con éxito');
        },
        onError: () => {
            toast.error('Ocurrió un error al actualizar la ruta');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: rutaService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rutas'] });
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            toast.error('Ruta desactivada');
        },
        onError: () => {
            toast.error('Ocurrió un error al desactivar la ruta');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const submitData = {
            ...currentRuta,
            vendedor: currentRuta.vendedor?.id ? { id: Number(currentRuta.vendedor.id) } : null,
            sucursal: currentRuta.sucursal?.id ? { id: Number(currentRuta.sucursal.id) } : null,
            clienteIds: selectedClientIds
        } as any;

        if (currentRuta.id) {
            updateMutation.mutate(submitData as Ruta);
        } else {
            createMutation.mutate(submitData);
        }
    };

    const handleDelete = (id: number) => {
        setDeleteConfirmId(id);
    };

    const confirmDelete = () => {
        if (deleteConfirmId) {
            deleteMutation.mutate(deleteConfirmId);
            setDeleteConfirmId(null);
        }
    };

    // Filtered list of routes for main table
    const filteredRutas = useMemo(() => {
        if (!rutasList) return [];
        let filtered = rutasList;
        
        if (selectedCiudad) {
            filtered = filtered.filter(r => 
                r.sucursal?.ciudad?.id === Number(selectedCiudad) ||
                r.vendedor?.sucursal?.ciudad?.id === Number(selectedCiudad)
            );
        }

        if (selectedSucursal) {
            filtered = filtered.filter(r => r.sucursal?.id === Number(selectedSucursal));
        }

        return filtered.filter(r => {
            const query = searchTerm.toLowerCase();
            const matchName = r.nombre.toLowerCase().includes(query);
            const matchDesc = r.descripcion ? r.descripcion.toLowerCase().includes(query) : false;
            const matchVendedor = r.vendedor ? `${r.vendedor.nombres} ${r.vendedor.apellidos}`.toLowerCase().includes(query) : false;
            const matchSucursal = r.sucursal?.nombre ? r.sucursal.nombre.toLowerCase().includes(query) : false;
            const matchClientes = r.clientes ? r.clientes.some((c: any) => 
                (c.persona?.nombres && c.persona.nombres.toLowerCase().includes(query)) ||
                (c.persona?.apellidos && c.persona.apellidos.toLowerCase().includes(query)) ||
                (c.persona?.ci && c.persona.ci.toLowerCase().includes(query))
            ) : false;

            return matchName || matchDesc || matchVendedor || matchSucursal || matchClientes;
        });
    }, [rutasList, searchTerm, selectedCiudad, selectedSucursal]);

    const totalPages = Math.ceil(filteredRutas.length / itemsPerPage) || 1;
    
    const paginatedRutas = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredRutas.slice(start, start + itemsPerPage);
    }, [filteredRutas, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCiudad, selectedSucursal]);

    // Modal client selection helpers
    const availableClientsForModal = useMemo(() => {
        if (!clientsList) return [];
        let list = clientsList.filter(c => c.activo);

        // Filter out clients assigned to other routes if onlyUnassignedClients is true
        if (onlyUnassignedClients) {
            list = list.filter(c => 
                !c.ruta || 
                !c.ruta.id || 
                (currentRuta.id && c.ruta.id === currentRuta.id) ||
                selectedClientIds.includes(c.id)
            );
        }

        // Filter by sucursal if requested and sucursal is chosen
        if (filterClientsBySucursal && currentRuta.sucursal?.id) {
            list = list.filter(c => !c.sucursal || c.sucursal.id === currentRuta.sucursal?.id);
        }

        // Apply text filter
        if (modalClientSearch.trim()) {
            const q = modalClientSearch.toLowerCase();
            list = list.filter(c => 
                (c.persona?.nombres && c.persona.nombres.toLowerCase().includes(q)) ||
                (c.persona?.apellidos && c.persona.apellidos.toLowerCase().includes(q)) ||
                (c.persona?.ci && c.persona.ci.toLowerCase().includes(q)) ||
                (c.persona?.direccion && c.persona.direccion.toLowerCase().includes(q)) ||
                (c.codigo && c.codigo.toLowerCase().includes(q))
            );
        }

        return list;
    }, [clientsList, onlyUnassignedClients, filterClientsBySucursal, currentRuta.id, currentRuta.sucursal, modalClientSearch, selectedClientIds]);

    const handleToggleClient = (clientId: number) => {
        setSelectedClientIds(prev => 
            prev.includes(clientId) ? prev.filter(id => id !== clientId) : [...prev, clientId]
        );
    };

    const handleSelectAllFilteredClients = () => {
        const filteredIds = availableClientsForModal.map(c => c.id);
        setSelectedClientIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    };

    const handleDeselectAllFilteredClients = () => {
        const filteredIds = new Set(availableClientsForModal.map(c => c.id));
        setSelectedClientIds(prev => prev.filter(id => !filteredIds.has(id)));
    };

    // Viewing Ruta Clientes helper
    const viewingRutaClients = useMemo(() => {
        if (!viewingRuta || !clientsList) return [];
        let list = clientsList.filter(c => c.ruta?.id === viewingRuta.id);

        if (viewingClientSearch.trim()) {
            const q = viewingClientSearch.toLowerCase();
            list = list.filter(c => 
                (c.persona?.nombres && c.persona.nombres.toLowerCase().includes(q)) ||
                (c.persona?.apellidos && c.persona.apellidos.toLowerCase().includes(q)) ||
                (c.persona?.ci && c.persona.ci.toLowerCase().includes(q)) ||
                (c.persona?.direccion && c.persona.direccion.toLowerCase().includes(q)) ||
                (c.persona?.telefono && c.persona.telefono.toLowerCase().includes(q))
            );
        }
        return list;
    }, [viewingRuta, clientsList, viewingClientSearch]);

    // Print Hoja de Ruta y Visitas
    const handlePrintHojaDeRuta = (ruta: Ruta, clients: Cliente[]) => {
        const dateStr = format(new Date(), "dd 'de' MMMM, yyyy - HH:mm", { locale: es });
        const vendedorNombre = ruta.vendedor ? `${ruta.vendedor.nombres} ${ruta.vendedor.apellidos}` : 'Sin Asignar';
        const vendedorTelefono = ruta.vendedor?.telefono || '-';
        const sucursalNombre = ruta.sucursal?.nombre ? `${ruta.sucursal.nombre}${ruta.sucursal.ciudad?.nombre ? ` (${ruta.sucursal.ciudad.nombre})` : ''}` : 'Sin Asignar';

        const totalDeuda = clients.reduce((sum, c) => sum + (Number(c.deudaActual) || 0), 0);

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Hoja de Ruta y Visitas - ${ruta.nombre}</title>
                <style>
                    @page { size: portrait; margin: 10mm; }
                    body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 10px; color: #1e293b; font-size: 11px; }
                    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0284c7; padding-bottom: 8px; margin-bottom: 12px; }
                    .logo { max-height: 44px; object-fit: contain; }
                    .title-box { text-align: right; }
                    .doc-title { font-size: 15px; font-weight: 800; color: #0f172a; margin: 0 0 2px 0; text-transform: uppercase; }
                    .doc-sub { font-size: 10px; color: #64748b; margin: 0; }
                    
                    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; margin-bottom: 12px; }
                    .info-item { font-size: 11px; }
                    .info-item strong { color: #0f172a; }
                    
                    table { width: 100%; border-collapse: collapse; margin-top: 6px; }
                    th, td { padding: 6px 5px; border: 1px solid #cbd5e1; font-size: 10px; }
                    th { background-color: #0284c7; color: #ffffff; font-weight: bold; text-align: left; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    tr:nth-child(even) { background-color: #f8fafc; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    
                    .center { text-align: center; }
                    .right { text-align: right; }
                    .check-box { width: 16px; height: 16px; border: 1px solid #475569; display: inline-block; border-radius: 2px; }
                    
                    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; padding-top: 10px; }
                    .sign-box { text-align: center; }
                    .sign-line { border-top: 1px solid #334155; margin-bottom: 4px; }
                    .sign-label { font-size: 10px; font-weight: bold; color: #334155; }
                    .sign-sub { font-size: 9px; color: #64748b; }
                </style>
            </head>
            <body>
                <div class="header">
                    <img src="/logo.jpeg" alt="Logo" class="logo" onerror="this.style.display='none'" />
                    <div class="title-box">
                        <h2 class="doc-title">HOJA DE RUTA Y VISITAS DE VENTAS</h2>
                        <p class="doc-sub">Fecha de Emisión: ${dateStr}</p>
                    </div>
                </div>

                <div class="info-grid">
                    <div class="info-item"><strong>Ruta / Zona:</strong> ${ruta.nombre}</div>
                    <div class="info-item"><strong>Vendedor:</strong> ${vendedorNombre} (Tel: ${vendedorTelefono})</div>
                    <div class="info-item"><strong>Sucursal:</strong> ${sucursalNombre}</div>
                    <div class="info-item"><strong>Total Clientes Asignados:</strong> ${clients.length} | <strong>Deuda en Cartera:</strong> Bs. ${totalDeuda.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    ${ruta.descripcion ? `<div class="info-item" style="grid-column: span 2;"><strong>Descripción de la Zona:</strong> ${ruta.descripcion}</div>` : ''}
                </div>

                <table>
                    <thead>
                        <tr>
                            <th class="center" style="width: 25px;">#</th>
                            <th style="width: 170px;">Cliente / Contacto</th>
                            <th style="width: 75px;">CI / NIT</th>
                            <th style="width: 80px;">Teléfono</th>
                            <th>Dirección</th>
                            <th class="right" style="width: 70px;">Deuda Pend.</th>
                            <th class="center" style="width: 45px;">Visitado</th>
                            <th style="width: 140px;">Observaciones / Pedido</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${clients.length === 0 ? `
                            <tr>
                                <td colspan="8" class="center" style="padding: 15px; color: #64748b;">No hay clientes asignados a esta ruta</td>
                            </tr>
                        ` : clients.map((c, i) => `
                            <tr>
                                <td class="center font-bold">${i + 1}</td>
                                <td>
                                    <strong style="color: #0f172a;">${c.persona ? `${c.persona.nombres} ${c.persona.apellidos}` : 'Sin Nombre'}</strong>
                                    ${c.codigo ? `<br><span style="font-size: 8.5px; color: #64748b;">Cód: ${c.codigo}</span>` : ''}
                                </td>
                                <td>${c.persona?.ci || '-'}</td>
                                <td>${c.persona?.telefono || '-'}</td>
                                <td>${c.persona?.direccion || '-'}</td>
                                <td class="right font-bold" style="color: ${(Number(c.deudaActual) || 0) > 0 ? '#b91c1c' : '#15803d'};">
                                    Bs. ${(Number(c.deudaActual) || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td class="center"><span class="check-box"></span></td>
                                <td></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="signatures">
                    <div class="sign-box">
                        <div class="sign-line"></div>
                        <div class="sign-label">${vendedorNombre}</div>
                        <div class="sign-sub">Firma Vendedor Responsable</div>
                    </div>
                    <div class="sign-box">
                        <div class="sign-line"></div>
                        <div class="sign-label">SUPERVISIÓN / ADMINISTRACIÓN</div>
                        <div class="sign-sub">Firma y Sello de Conformidad</div>
                    </div>
                </div>
            </body>
            </html>
        `;

        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.style.visibility = 'hidden';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document || iframe.contentDocument;
        if (!doc) {
            iframe.remove();
            return;
        }

        doc.open();
        doc.write(html);
        doc.close();

        setTimeout(() => {
            try {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
            } catch (err) {
                console.error('Error printing hoja de ruta:', err);
            } finally {
                setTimeout(() => {
                    iframe.remove();
                }, 1000);
            }
        }, 350);
    };

    const handleExportCarteraExcel = (ruta: Ruta, clients: Cliente[]) => {
        const columns = [
            { header: 'ID', dataKey: 'id' },
            { header: 'Cliente', dataKey: 'clienteNombre' },
            { header: 'CI / NIT', dataKey: 'ci' },
            { header: 'Teléfono', dataKey: 'telefono' },
            { header: 'Dirección', dataKey: 'direccion' },
            { header: 'Límite Crédito', dataKey: 'limiteCredito' },
            { header: 'Deuda Actual', dataKey: 'deudaActual' },
            { header: 'Crédito Disp.', dataKey: 'creditoDisponible' },
        ];

        const data = clients.map(c => ({
            id: c.id,
            clienteNombre: c.persona ? `${c.persona.nombres} ${c.persona.apellidos}` : 'Sin Nombre',
            ci: c.persona?.ci || '-',
            telefono: c.persona?.telefono || '-',
            direccion: c.persona?.direccion || '-',
            limiteCredito: Number(c.limiteCredito) || 0,
            deudaActual: Number(c.deudaActual) || 0,
            creditoDisponible: Number(c.creditoDisponible) || 0,
        }));

        exportToExcel(columns, data, `cartera_clientes_${ruta.nombre.replace(/\s+/g, '_')}`);
    };

    if (loadingRutas) return <div className="p-6 text-center text-muted-foreground animate-pulse">Cargando rutas y cartera de clientes...</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <Map className="w-8 h-8 text-primary/80" />
                        Rutas y Cartera de Clientes
                    </h1>
                    <p className="text-muted-foreground italic">
                        Configura las rutas de venta, designa vendedores y asigna la cartera de clientes a visitar.
                    </p>
                </div>
                <div className="flex items-center flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg text-sm font-medium hover:bg-accent transition-colors shadow-sm" title="Imprimir Lista de Rutas">
                            <Printer className="w-4 h-4 text-muted-foreground" /> 
                            <span className="hidden sm:inline">Imprimir</span>
                        </button>
                        <button onClick={handleExportPDF} className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg text-sm font-medium hover:bg-accent transition-colors shadow-sm" title="Exportar a PDF">
                            <FileText className="w-4 h-4 text-red-500" /> 
                            <span className="hidden sm:inline">PDF</span>
                        </button>
                        <button onClick={handleExportExcel} className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg text-sm font-medium hover:bg-accent transition-colors shadow-sm" title="Exportar a Excel">
                            <FileSpreadsheet className="w-4 h-4 text-green-600" /> 
                            <span className="hidden sm:inline">Excel</span>
                        </button>
                    </div>

                    <div className="hidden sm:block h-8 w-px bg-border mx-1"></div>

                    <button
                        onClick={() => { 
                            setIsEditing(true); 
                            setCurrentRuta({}); 
                            setSelectedClientIds([]);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Nueva Ruta
                    </button>
                </div>
            </div>

            {/* Quick Search */}
            <div className="bg-card p-3 border rounded-lg shadow-sm flex items-center gap-2 max-w-md">
                <Search className="w-5 h-5 text-muted-foreground ml-1" />
                <input 
                    type="text" 
                    placeholder="Buscar por ruta, vendedor, sucursal o cliente..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-transparent border-none outline-none flex-1 text-sm placeholder:text-muted-foreground/70"
                />
                {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="p-1 hover:bg-accent rounded-md text-muted-foreground">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Main Table */}
            <div className="bg-card border rounded-lg shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[750px]">
                        <thead>
                            <tr className="bg-muted/50 border-b">
                                <th className="p-4 text-sm font-semibold text-muted-foreground w-16">#</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Ruta / Zona</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Vendedor Asignado</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Sucursal / Ciudad</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Cartera de Clientes</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground w-28">Estado</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground text-right w-36">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {paginatedRutas.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                        No se encontraron rutas de venta.
                                    </td>
                                </tr>
                            ) : paginatedRutas.map((r, index) => {
                                const clientCount = r.clientes ? r.clientes.length : 0;
                                return (
                                    <tr key={r.id} className="hover:bg-accent/30 transition-colors group">
                                        <td className="p-4 text-sm font-mono text-muted-foreground">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </td>
                                        <td className="p-4 text-sm">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-foreground flex items-center gap-1.5">
                                                    <Map className="w-3.5 h-3.5 text-primary/70" />
                                                    {r.nombre}
                                                </span>
                                                <span className="text-xs text-muted-foreground mt-0.5">
                                                    {r.descripcion || <span className="italic opacity-50">Sin descripción de zona</span>}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm">
                                            {r.vendedor ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                        <User className="w-3.5 h-3.5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-foreground">
                                                            {r.vendedor.nombres} {r.vendedor.apellidos}
                                                        </span>
                                                        {r.vendedor.telefono && (
                                                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                                <Phone className="w-2.5 h-2.5" /> {r.vendedor.telefono}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                                                    Sin Asignar
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm">
                                            {r.sucursal?.nombre ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
                                                    <Building2 className="w-3.5 h-3.5 text-primary/70" />
                                                    {r.sucursal.nombre}
                                                    {r.sucursal.ciudad?.nombre ? ` (${r.sucursal.ciudad.nombre})` : ''}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">Todas las sucursales</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm">
                                            <button
                                                onClick={() => {
                                                    setViewingRuta(r);
                                                    setViewingClientSearch('');
                                                }}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-all cursor-pointer group/btn"
                                                title="Ver cartera de clientes y hoja de visitas"
                                            >
                                                <Users className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                                                <span>{clientCount} {clientCount === 1 ? 'Cliente' : 'Clientes'}</span>
                                            </button>
                                        </td>
                                        <td className="p-4 text-sm">
                                            {r.activo ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-600 dark:text-green-400 uppercase tracking-wider">
                                                    Activo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 uppercase tracking-wider">
                                                    Inactivo
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm">
                                            <div className="flex justify-end gap-2 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        setViewingRuta(r);
                                                        setViewingClientSearch('');
                                                    }}
                                                    title="Ver Cartera y Hoja de Visitas"
                                                    className="p-2 text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 hover:scale-110 active:scale-95 rounded-lg transition-all"
                                                >
                                                    <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                </button>
                                                <button
                                                    onClick={() => { 
                                                        setCurrentRuta(r); 
                                                        setIsEditing(true); 
                                                    }}
                                                    title="Editar"
                                                    className="p-2 text-primary bg-primary/10 hover:bg-primary/20 hover:scale-110 active:scale-95 rounded-lg transition-all"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                {r.activo ? (
                                                    <button
                                                        onClick={() => handleDelete(r.id)}
                                                        title="Desactivar"
                                                        className="p-2 text-red-600 dark:text-red-100 bg-red-100 dark:bg-red-600 hover:bg-red-200 dark:hover:bg-red-700 hover:scale-110 active:scale-95 rounded-lg transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => updateMutation.mutate({ ...r, activo: true } as Ruta, {
                                                            onSuccess: () => toast.success('Ruta activada con éxito')
                                                        })}
                                                        title="Activar"
                                                        className="p-2 text-green-600 dark:text-green-500 bg-green-500/10 hover:bg-green-500/20 hover:scale-110 active:scale-95 rounded-lg transition-all"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t bg-muted/20">
                        <span className="text-sm text-muted-foreground">
                            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredRutas.length)} de {filteredRutas.length}
                        </span>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-medium px-2">
                                Página {currentPage} de {totalPages}
                            </span>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal: Formulario Crear / Editar Ruta y Asignar Cartera */}
            <Modal
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
                title={
                    <span className="flex items-center gap-2 text-primary">
                        <Map className="w-6 h-6 text-primary/80" />
                        {currentRuta.id ? 'Editar Ruta y Asignación de Clientes' : 'Nueva Ruta de Ventas'}
                    </span>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Nombre */}
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-sm font-semibold text-foreground">
                                Nombre de la Ruta <span className="text-destructive">*</span>
                            </label>
                            <div className="relative group">
                                <Map className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Ej. Ruta Norte - Clínicas, Zona Sur - Farmacias..."
                                    value={currentRuta.nombre || ''}
                                    onChange={(e) => setCurrentRuta({ ...currentRuta, nombre: e.target.value })}
                                    className="w-full pl-10 pr-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                                    required
                                />
                            </div>
                        </div>

                        {/* Sucursal */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground">Sucursal Asignada</label>
                            <div className="relative group">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <select
                                    value={currentRuta.sucursal?.id || ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        const found = sucursales?.find(s => s.id === Number(val));
                                        setCurrentRuta({ 
                                            ...currentRuta, 
                                            sucursal: found ? found : undefined 
                                        });
                                    }}
                                    className="w-full pl-10 pr-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer text-sm"
                                >
                                    <option value="">-- Sin Sucursal Asignada --</option>
                                    {sucursales?.filter(s => s.activo !== false || s.id === currentRuta.sucursal?.id).map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.nombre}{s.ciudad?.nombre ? ` (${s.ciudad.nombre})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Vendedor */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground">Vendedor Designado</label>
                            <div className="relative group">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <select
                                    value={currentRuta.vendedor?.id || ''}
                                    onChange={(e) => setCurrentRuta({ 
                                        ...currentRuta, 
                                        vendedor: e.target.value ? { id: Number(e.target.value) } as any : null 
                                    })}
                                    className="w-full pl-10 pr-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer text-sm"
                                >
                                    <option value="">-- Sin Vendedor Asignado --</option>
                                    {vendedores.map(v => (
                                        <option key={v.id} value={v.id}>
                                            {v.nombres} {v.apellidos} {v.sucursal?.nombre ? `(${v.sucursal.nombre})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Descripción */}
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-sm font-semibold text-foreground">Descripción o Zonas de Cobertura</label>
                            <div className="relative group">
                                <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <textarea
                                    placeholder="Detalles geográficos, avenidas, barrios o puntos clave de visita..."
                                    value={currentRuta.descripcion || ''}
                                    onChange={(e) => setCurrentRuta({ ...currentRuta, descripcion: e.target.value })}
                                    className="w-full pl-10 pr-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[60px] resize-none text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN CARTERA DE CLIENTES */}
                    <div className="border rounded-xl p-4 bg-muted/20 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                            <div>
                                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                                    <Users className="w-4 h-4 text-primary" />
                                    Cartera de Clientes Asignados
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Selecciona los clientes que este vendedor debe visitar en esta ruta.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                                    {selectedClientIds.length} {selectedClientIds.length === 1 ? 'Cliente' : 'Clientes'} Seleccionados
                                </span>
                            </div>
                        </div>

                        {/* Search & Bulk tools */}
                        <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
                            <div className="relative flex-1 w-full">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Filtrar clientes por nombre, CI/NIT o dirección..."
                                    value={modalClientSearch}
                                    onChange={(e) => setModalClientSearch(e.target.value)}
                                    className="w-full pl-9 pr-8 py-1.5 text-xs bg-background border rounded-lg outline-none focus:ring-1 focus:ring-primary"
                                />
                                {modalClientSearch && (
                                    <button 
                                        type="button" 
                                        onClick={() => setModalClientSearch('')} 
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                <button
                                    type="button"
                                    onClick={handleSelectAllFilteredClients}
                                    className="text-xs px-2.5 py-1.5 border rounded-lg bg-background hover:bg-accent font-medium transition-colors"
                                >
                                    Seleccionar ({availableClientsForModal.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeselectAllFilteredClients}
                                    className="text-xs px-2.5 py-1.5 border rounded-lg bg-background hover:bg-accent font-medium text-destructive transition-colors"
                                >
                                    Deseleccionar
                                </button>
                            </div>
                        </div>

                        {/* Filter options */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1 border-t border-border/40">
                            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={onlyUnassignedClients}
                                    onChange={(e) => setOnlyUnassignedClients(e.target.checked)}
                                    className="rounded border-muted-foreground/30 text-primary focus:ring-primary"
                                />
                                <span className="font-medium text-foreground/90">Mostrar solo clientes disponibles (sin ruta asignada o de esta ruta)</span>
                            </label>

                            {currentRuta.sucursal?.id && (
                                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={filterClientsBySucursal}
                                        onChange={(e) => setFilterClientsBySucursal(e.target.checked)}
                                        className="rounded border-muted-foreground/30 text-primary focus:ring-primary"
                                    />
                                    <span>Solo clientes de la sucursal</span>
                                </label>
                            )}
                        </div>

                        {/* List of Clients with checkboxes */}
                        <div className="max-h-56 overflow-y-auto border rounded-lg bg-background divide-y">
                            {loadingClients ? (
                                <div className="p-4 text-center text-xs text-muted-foreground animate-pulse">Cargando clientes...</div>
                            ) : availableClientsForModal.length === 0 ? (
                                <div className="p-6 text-center text-xs text-muted-foreground">
                                    No se encontraron clientes disponibles con los filtros actuales.
                                </div>
                            ) : (
                                availableClientsForModal.map(client => {
                                    const isSelected = selectedClientIds.includes(client.id);
                                    const isAssignedToOther = client.ruta && client.ruta.id !== currentRuta.id;
                                    
                                    return (
                                        <div
                                            key={client.id}
                                            onClick={() => handleToggleClient(client.id)}
                                            className={`p-2.5 flex items-start gap-3 cursor-pointer hover:bg-accent/40 transition-colors ${
                                                isSelected ? 'bg-primary/5' : ''
                                            }`}
                                        >
                                            <div className="mt-0.5 text-primary">
                                                {isSelected ? (
                                                    <CheckSquare className="w-4 h-4 text-primary" />
                                                ) : (
                                                    <Square className="w-4 h-4 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 text-xs">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className={`font-semibold truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                                        {client.persona ? `${client.persona.nombres} ${client.persona.apellidos}` : 'Cliente Sin Nombre'}
                                                    </span>
                                                    {isAssignedToOther && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium shrink-0" title="Actualmente asignado a otra ruta. Al guardarlo se transferirá a esta ruta.">
                                                            <ArrowRightLeft className="w-2.5 h-2.5" />
                                                            Ruta: {client.ruta?.nombre}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground text-[11px] mt-0.5">
                                                    {client.persona?.ci && <span>CI/NIT: {client.persona.ci}</span>}
                                                    {client.persona?.telefono && (
                                                        <span className="flex items-center gap-0.5">
                                                            <Phone className="w-2.5 h-2.5" /> {client.persona.telefono}
                                                        </span>
                                                    )}
                                                    {client.persona?.direccion && (
                                                        <span className="flex items-center gap-0.5 truncate max-w-[250px]" title={client.persona.direccion}>
                                                            <MapPin className="w-2.5 h-2.5" /> {client.persona.direccion}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Estado Toggle */}
                    <div className="flex items-center justify-between p-3.5 border rounded-lg bg-background hover:border-primary/50 transition-colors">
                        <div className="space-y-0.5">
                            <label className="text-sm font-semibold text-foreground">Estado de la Ruta</label>
                            <p className="text-[11px] text-muted-foreground">Activar o desactivar ruta para visitas</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={currentRuta.activo !== false}
                                onChange={(e) => setCurrentRuta({ ...currentRuta, activo: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-border/50">
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-semibold hover:bg-accent transition-all shadow-sm"
                        >
                            <X className="w-4 h-4" /> Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-sm"
                        >
                            <Save className="w-4 h-4" /> Guardar Ruta y Clientes
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal: Ver Cartera de Clientes & Hoja de Ruta de Visitas */}
            <Modal
                isOpen={viewingRuta !== null}
                onClose={() => setViewingRuta(null)}
                title={
                    <span className="flex items-center gap-2 text-primary">
                        <Users className="w-6 h-6 text-primary/80" />
                        Cartera de Clientes - {viewingRuta?.nombre}
                    </span>
                }
            >
                {viewingRuta && (
                    <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
                        {/* Summary Header Card */}
                        <div className="p-4 bg-muted/30 border rounded-xl space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                                <div>
                                    <span className="text-muted-foreground block text-[11px]">VENDEDOR ASIGNADO</span>
                                    <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                                        <User className="w-3.5 h-3.5 text-primary" />
                                        {viewingRuta.vendedor ? `${viewingRuta.vendedor.nombres} ${viewingRuta.vendedor.apellidos}` : 'Sin Vendedor Asignado'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-[11px]">SUCURSAL / CIUDAD</span>
                                    <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                                        <Building2 className="w-3.5 h-3.5 text-primary" />
                                        {viewingRuta.sucursal?.nombre ? `${viewingRuta.sucursal.nombre}${viewingRuta.sucursal.ciudad?.nombre ? ` (${viewingRuta.sucursal.ciudad.nombre})` : ''}` : 'Todas las sucursales'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-[11px]">TOTAL CLIENTES</span>
                                    <span className="font-bold text-primary text-sm mt-0.5 block">
                                        {viewingRutaClients.length} Clientes en Cartera
                                    </span>
                                </div>
                            </div>
                            {viewingRuta.descripcion && (
                                <div className="text-xs border-t pt-2 text-muted-foreground">
                                    <strong className="text-foreground">Cobertura / Zonas:</strong> {viewingRuta.descripcion}
                                </div>
                            )}
                        </div>

                        {/* Top Actions: Print / Export */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                            <div className="relative w-full sm:w-72">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Buscar en esta cartera..."
                                    value={viewingClientSearch}
                                    onChange={(e) => setViewingClientSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-background border rounded-lg outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                <button
                                    onClick={() => handlePrintHojaDeRuta(viewingRuta, viewingRutaClients)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:opacity-90 transition-all shadow-sm"
                                    title="Imprimir Hoja de Visita de Campo con Casillas de Verificación"
                                >
                                    <Printer className="w-3.5 h-3.5" />
                                    Imprimir Hoja de Visitas
                                </button>
                                <button
                                    onClick={() => handleExportCarteraExcel(viewingRuta, viewingRutaClients)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-card border rounded-lg text-xs font-medium hover:bg-accent text-green-600 transition-colors shadow-sm"
                                    title="Exportar cartera a Excel"
                                >
                                    <FileSpreadsheet className="w-3.5 h-3.5" />
                                    Excel
                                </button>
                            </div>
                        </div>

                        {/* Table of assigned clients */}
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="bg-muted/50 border-b">
                                        <th className="p-2.5 font-semibold text-muted-foreground w-10">#</th>
                                        <th className="p-2.5 font-semibold text-muted-foreground">Cliente / Razón Social</th>
                                        <th className="p-2.5 font-semibold text-muted-foreground">CI / NIT</th>
                                        <th className="p-2.5 font-semibold text-muted-foreground">Teléfono</th>
                                        <th className="p-2.5 font-semibold text-muted-foreground">Dirección</th>
                                        <th className="p-2.5 font-semibold text-muted-foreground text-right">Deuda Actual</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {viewingRutaClients.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-6 text-center text-muted-foreground">
                                                No hay clientes asignados a esta ruta. Puedes asignarlos editando la ruta.
                                            </td>
                                        </tr>
                                    ) : (
                                        viewingRutaClients.map((client, index) => (
                                            <tr key={client.id} className="hover:bg-accent/30 transition-colors">
                                                <td className="p-2.5 text-muted-foreground font-mono">{index + 1}</td>
                                                <td className="p-2.5 font-semibold text-foreground">
                                                    {client.persona ? `${client.persona.nombres} ${client.persona.apellidos}` : 'Sin Nombre'}
                                                    {client.codigo && (
                                                        <span className="block text-[10px] text-muted-foreground font-normal">
                                                            Cód: {client.codigo}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-2.5 text-muted-foreground">{client.persona?.ci || '-'}</td>
                                                <td className="p-2.5 text-muted-foreground">{client.persona?.telefono || '-'}</td>
                                                <td className="p-2.5 text-muted-foreground max-w-[180px] truncate" title={client.persona?.direccion}>
                                                    {client.persona?.direccion || '-'}
                                                </td>
                                                <td className={`p-2.5 text-right font-semibold ${(Number(client.deudaActual) || 0) > 0 ? 'text-destructive' : 'text-green-600 dark:text-green-400'}`}>
                                                    {formatCurrency(client.deudaActual)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Bottom close button */}
                        <div className="flex justify-end pt-3 border-t">
                            <button
                                type="button"
                                onClick={() => setViewingRuta(null)}
                                className="px-4 py-2 bg-card border rounded-lg text-sm font-semibold hover:bg-accent transition-all"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal: Desactivar Confirmación */}
            <Modal
                isOpen={deleteConfirmId !== null}
                onClose={() => setDeleteConfirmId(null)}
                title="Desactivar Ruta"
            >
                <div className="space-y-6">
                    <div className="flex items-start gap-4 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
                        <Trash2 className="w-6 h-6 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-sm">Este registro pasará a estado Inactivo</h4>
                            <p className="text-xs mt-1 opacity-90 text-destructive/80">
                                La ruta dejará de estar disponible para asignaciones de visitas, pero conservará su historial y relación de clientes.
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4 border-t border-border/50">
                        <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="flex items-center gap-2 px-5 py-2.5 border rounded-lg text-sm font-semibold hover:bg-accent transition-all shadow-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={confirmDelete}
                            className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
                        >
                            Sí, Desactivar
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default RutasPage;
