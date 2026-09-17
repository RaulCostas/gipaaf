import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Trash2 } from 'lucide-react';

interface LocationPickerMapProps {
    latitud?: number | null;
    longitud?: number | null;
    onChange: (lat: number | null, lng: number | null) => void;
    title?: string;
    description?: string;
    defaultCenter?: [number, number]; // [lat, lng]
    defaultZoom?: number;
}

const customMarkerIcon = L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
        <div style="transform: translate(-16px, -36px); cursor: pointer;">
            <svg width="32" height="38" viewBox="0 0 24 24" fill="#2563eb" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.35));">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3.5" fill="#ffffff"></circle>
            </svg>
        </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
});

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
    latitud,
    longitud,
    onChange,
    title = 'Ubicación en Mapa',
    description = 'Haz clic en el mapa para marcar la ubicación exacta.',
    defaultCenter = [-16.5000, -68.1500], // Default La Paz, Bolivia
    defaultZoom = 13,
}) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);

    const hasValidCoords = typeof latitud === 'number' && typeof longitud === 'number' && !isNaN(latitud) && !isNaN(longitud);

    // Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current) return;
        if (mapInstanceRef.current) return;

        const initialLat = hasValidCoords ? latitud! : defaultCenter[0];
        const initialLng = hasValidCoords ? longitud! : defaultCenter[1];
        const initialZoom = hasValidCoords ? 15 : defaultZoom;

        const map = L.map(mapContainerRef.current, {
            center: [initialLat, initialLng],
            zoom: initialZoom,
            zoomControl: true,
            scrollWheelZoom: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
            maxZoom: 19,
        }).addTo(map);

        map.on('click', (e: L.LeafletMouseEvent) => {
            const { lat, lng } = e.latlng;
            onChange(Number(lat.toFixed(7)), Number(lng.toFixed(7)));
        });

        mapInstanceRef.current = map;

        // Force redraw after modal animation
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 250);

        return () => {
            clearTimeout(timer);
            map.remove();
            mapInstanceRef.current = null;
            markerRef.current = null;
        };
    }, []);

    // Update marker and pan when coordinates change
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        if (hasValidCoords) {
            const pos: [number, number] = [latitud!, longitud!];

            if (!markerRef.current) {
                const marker = L.marker(pos, {
                    icon: customMarkerIcon,
                    draggable: true,
                }).addTo(map);

                marker.on('dragend', () => {
                    const latlng = marker.getLatLng();
                    onChange(Number(latlng.lat.toFixed(7)), Number(latlng.lng.toFixed(7)));
                });

                markerRef.current = marker;
            } else {
                markerRef.current.setLatLng(pos);
            }

            const currentCenter = map.getCenter();
            const dist = Math.hypot(currentCenter.lat - pos[0], currentCenter.lng - pos[1]);
            if (dist > 0.0001) {
                map.flyTo(pos, Math.max(map.getZoom(), 16), { animate: true, duration: 1.2 });
            }
        } else {
            if (markerRef.current) {
                markerRef.current.remove();
                markerRef.current = null;
            }
            if (defaultCenter) {
                map.setView(defaultCenter, defaultZoom);
            }
        }
    }, [latitud, longitud, hasValidCoords, onChange, defaultCenter, defaultZoom]);

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('La geolocalización no es soportada por su navegador.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                const lat = Number(latitude.toFixed(7));
                const lng = Number(longitude.toFixed(7));
                onChange(lat, lng);
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo([lat, lng], 16, { animate: true });
                }
            },
            (err) => {
                console.error('Error obteniendo ubicación:', err);
                alert('No se pudo obtener la ubicación GPS actual.');
            },
            { enableHighAccuracy: true }
        );
    };

    const handleClearLocation = () => {
        onChange(null, null);
    };

    return (
        <div className="space-y-2 p-3.5 bg-card/60 dark:bg-card/40 border rounded-xl shadow-xs">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-primary shrink-0" />
                        {title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors cursor-pointer"
                        title="Usar mi ubicación actual"
                    >
                        <Navigation className="w-3 h-3" />
                        <span className="hidden sm:inline">Mi Ubicación</span>
                    </button>
                    {hasValidCoords && (
                        <button
                            type="button"
                            onClick={handleClearLocation}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg transition-colors cursor-pointer"
                            title="Quitar ubicación"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>

            {/* Map Container */}
            <div className="relative rounded-lg overflow-hidden border border-border/80 shadow-inner z-0">
                <div
                    ref={mapContainerRef}
                    className="w-full h-56 sm:h-64 bg-muted/40 z-0"
                    style={{ minHeight: '220px' }}
                />
            </div>

            {/* Bottom Coordinate Pills (matching reference design) */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
                <div className="px-3 py-1.5 bg-slate-900 dark:bg-slate-800 text-slate-100 dark:text-slate-200 rounded-md text-xs font-mono font-medium shadow-xs border border-slate-700/50">
                    Lat: <span className="text-emerald-400 font-bold">{latitud !== null && latitud !== undefined ? latitud : 'No marcado'}</span>
                </div>
                <div className="px-3 py-1.5 bg-slate-900 dark:bg-slate-800 text-slate-100 dark:text-slate-200 rounded-md text-xs font-mono font-medium shadow-xs border border-slate-700/50">
                    Lng: <span className="text-emerald-400 font-bold">{longitud !== null && longitud !== undefined ? longitud : 'No marcado'}</span>
                </div>
            </div>
        </div>
    );
};

export default LocationPickerMap;
