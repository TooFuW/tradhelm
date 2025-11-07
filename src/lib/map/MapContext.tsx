"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
import type * as maplibregl from "maplibre-gl";

import type { GeoJSONFC } from "./types";

// Standardise les handlers d'événements de couche MapLibre pour le contexte.
type MapEventHandler = (event: maplibregl.MapLayerMouseEvent) => void;

// Table des capacités exposées par le contexte à l'UI.
interface MapContextValue {
    map: maplibregl.Map | null;
    isReady: boolean;
    data: Map<string, GeoJSONFC>;
    attachMap: (map: maplibregl.Map | null) => void;
    registerSource: (id: string, data: GeoJSONFC | string) => Promise<void>;
    addLayer: (layer: maplibregl.LayerSpecification) => Promise<void>;
    removeLayer: (id: string) => void;
    removeSource: (id: string) => void;
    fitToBounds: (bbox: [number, number, number, number]) => void;
    setFeatureState: (params: {
        source: string;
        id: string | number;
        state: Record<string, unknown>;
    }) => void;
    on: (event: string, layerId: string, handler: MapEventHandler) => void;
    off: (event: string, layerId: string, handler: (...args: any[]) => void) => void;
    loadGeoJSON: (url: string) => Promise<GeoJSONFC>;
}

const MapContext = createContext<MapContextValue | undefined>(undefined);
const MapDataContext = createContext<Map<string, GeoJSONFC> | undefined>(
    undefined,
);

// Assure la liaison entre MapLibre et React et expose une API impérative propre.
export function MapProvider({ children }: { children: ReactNode }) {
    const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [dataCache, setDataCache] = useState<Map<string, GeoJSONFC>>(
        () => new Map(),
    );

    // Références internes pour piloter MapLibre sans déclencher de re-render React.
    const mapRef = useRef<maplibregl.Map | null>(null);
    const isReadyRef = useRef(false);
    const dataRef = useRef(dataCache);
    const inflightRef = useRef(new Map<string, Promise<GeoJSONFC>>());
    const pendingSourcesRef = useRef(
        new Map<string, maplibregl.GeoJSONSourceSpecification>(),
    );
    const pendingLayersRef = useRef<maplibregl.LayerSpecification[]>([]);
    const pendingEventsRef = useRef<
        Array<{ event: string; layerId: string; handler: MapEventHandler }>
    >([]);
    const registeredSourcesRef = useRef(new Set<string>());
    const registeredLayersRef = useRef(new Set<string>());
    const listenersRef = useRef<
        Map<string, Map<string, Set<(...args: any[]) => void>>>
    >(new Map());
    const detachLoadHandlerRef = useRef<(() => void) | null>(null);

    // Suit en permanence la dernière version du cache de données.
    useEffect(() => {
        dataRef.current = dataCache;
    }, [dataCache]);

    // Miroir du flag "prêt" à utiliser côté callbacks asynchrones.
    useEffect(() => {
        isReadyRef.current = isReady;
    }, [isReady]);

    // Gestion centralisée des écouteurs pour faciliter l'attache/détache
    const trackListener = useCallback(
        (event: string, layerId: string, handler: (...args: any[]) => void) => {
            let layerMap = listenersRef.current.get(event);
            if (!layerMap) {
                layerMap = new Map();
                listenersRef.current.set(event, layerMap);
            }

            let handlers = layerMap.get(layerId);
            if (!handlers) {
                handlers = new Set();
                layerMap.set(layerId, handlers);
            }

            handlers.add(handler);
        },
        [],
    );

    // Retire un handler connu du registre maison.
    const untrackListener = useCallback(
        (event: string, layerId: string, handler: (...args: any[]) => void) => {
            const layerMap = listenersRef.current.get(event);
            if (!layerMap) return;

            const handlers = layerMap.get(layerId);
            if (!handlers) return;

            handlers.delete(handler);

            if (handlers.size === 0) {
                layerMap.delete(layerId);
            }

            if (layerMap.size === 0) {
                listenersRef.current.delete(event);
            }
        },
        [],
    );

    // Détache tous les écouteurs enregistrés si la carte disparaît/changée.
    const detachTrackedListeners = useCallback((map: maplibregl.Map | null) => {
        if (!map) return;

        listenersRef.current.forEach((layerMap, event) => {
            layerMap.forEach((handlers, layerId) => {
                handlers.forEach((handler) => {
                    map.off(event as any, layerId, handler as any);
                });
            });
        });

        listenersRef.current.clear();
    }, []);

    // Supprime proprement tout ce qui a été ajouté par le Provider (layers, sources, events).
    const cleanupMapArtifacts = useCallback(
        (map: maplibregl.Map | null) => {
            if (!map) return;

            detachTrackedListeners(map);

            registeredLayersRef.current.forEach((layerId) => {
                if (map.getLayer(layerId)) {
                    map.removeLayer(layerId);
                }
            });
            registeredLayersRef.current.clear();

            registeredSourcesRef.current.forEach((sourceId) => {
                if (map.getSource(sourceId)) {
                    map.removeSource(sourceId);
                }
            });
            registeredSourcesRef.current.clear();
        },
        [detachTrackedListeners],
    );

    // A la première disponibilité de la carte on rejoue toutes les opérations en attente.
    // A la première disponibilité de la carte on rejoue toutes les opérations en attente.
    const flushPending = useCallback(
        (map: maplibregl.Map) => {
            pendingSourcesRef.current.forEach((source, id) => {
                if (map.getSource(id)) {
                    map.removeSource(id);
                }

                map.addSource(id, source);
                registeredSourcesRef.current.add(id);
            });
            pendingSourcesRef.current.clear();

            pendingLayersRef.current.forEach((layer) => {
                if (map.getLayer(layer.id)) {
                    map.removeLayer(layer.id);
                }
                map.addLayer(layer);
                registeredLayersRef.current.add(layer.id);
            });
            pendingLayersRef.current = [];

            pendingEventsRef.current.forEach(({ event, layerId, handler }) => {
                map.on(event as any, layerId, handler);
                trackListener(event, layerId, handler);
            });
            pendingEventsRef.current = [];
        },
        [trackListener],
    );

    // Charge et met en cache les FeatureCollection pour éviter de frapper plusieurs fois l'API.
    // Charge et met en cache les FeatureCollection pour éviter de frapper plusieurs fois l'API.
    const loadGeoJSON = useCallback(
        async (url: string) => {
            const cached = dataRef.current.get(url);
            if (cached) {
                return cached;
            }

            const inflight = inflightRef.current.get(url);
            if (inflight) {
                return inflight;
            }

            const fetchPromise = fetch(url)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(
                            `Impossible de charger le GeoJSON (${response.status}): ${url}`,
                        );
                    }
                    return response.json() as Promise<GeoJSONFC>;
                })
                .then((json) => {
                    if (json.type !== "FeatureCollection") {
                        throw new Error(
                            `Le fichier ${url} doit être un FeatureCollection GeoJSON`,
                        );
                    }

                    setDataCache((prev) => {
                        const next = new Map(prev);
                        next.set(url, json);
                        return next;
                    });
                    inflightRef.current.delete(url);
                    return json;
                })
                .catch((error) => {
                    inflightRef.current.delete(url);
                    throw error;
                });

            inflightRef.current.set(url, fetchPromise);
            return fetchPromise;
        },
        [],
    );

    // Ajoute (ou met en file d'attente) une source GeoJSON MapLibre.
    const registerSource = useCallback(
        async (id: string, data: GeoJSONFC | string) => {
            const resolvedData = typeof data === "string" ? await loadGeoJSON(data) : data;

            const source: maplibregl.GeoJSONSourceSpecification = {
                type: "geojson",
                data: resolvedData,
            };

            const map = mapRef.current;
            if (!map || !isReadyRef.current) {
                pendingSourcesRef.current.set(id, source);
                return;
            }

            if (map.getSource(id)) {
                map.removeSource(id);
            }

            map.addSource(id, source);
            registeredSourcesRef.current.add(id);
        },
        [loadGeoJSON],
    );

    // Ajoute (ou met en file d'attente) une couche MapLibre.
    const addLayer = useCallback(
        async (layer: maplibregl.LayerSpecification) => {
            const map = mapRef.current;
            if (!map || !isReadyRef.current) {
                pendingLayersRef.current.push(layer);
                return;
            }

            if (map.getLayer(layer.id)) {
                map.removeLayer(layer.id);
            }
            map.addLayer(layer);
            registeredLayersRef.current.add(layer.id);
        },
        [],
    );

    // Supprime une couche, qu'elle soit en attente ou déjà montée.
    const removeLayer = useCallback((id: string) => {
        pendingLayersRef.current = pendingLayersRef.current.filter(
            (layer) => layer.id !== id,
        );

        const map = mapRef.current;
        if (map && map.getLayer(id)) {
            map.removeLayer(id);
        }
        registeredLayersRef.current.delete(id);
    }, []);

    // Supprime une source, même si elle était en attente.
    const removeSource = useCallback((id: string) => {
        pendingSourcesRef.current.delete(id);

        const map = mapRef.current;
        if (map && map.getSource(id)) {
            map.removeSource(id);
        }
        registeredSourcesRef.current.delete(id);
    }, []);

    // Encapsule map.fitBounds pour forcer un padding cohérent depuis l'UI.
    const fitToBounds = useCallback(
        (bbox: [number, number, number, number]) => {
            const map = mapRef.current;
            if (!map) return;

            map.fitBounds(bbox, {
                padding: 32,
                duration: 800,
            });
        },
        [],
    );

    // Proxy de setFeatureState afin de conserver toute la logique côté contexte.
    const setFeatureState = useCallback(
        (params: {
            source: string;
            id: string | number;
            state: Record<string, unknown>;
        }) => {
            const map = mapRef.current;
            if (!map) return;

            map.setFeatureState(
                {
                    source: params.source,
                    id: params.id,
                },
                params.state,
            );
        },
        [],
    );

    // Ajoute un handler (ou le met en attente si la carte n'est pas chargée).
    const on = useCallback(
        (event: string, layerId: string, handler: MapEventHandler) => {
            const map = mapRef.current;
            if (!map || !isReadyRef.current) {
                pendingEventsRef.current.push({ event, layerId, handler });
                return;
            }

            map.on(event as any, layerId, handler);
            trackListener(event, layerId, handler);
        },
        [trackListener],
    );

    // Retire un handler, qu'il soit déjà attaché ou encore en attente.
    const off = useCallback(
        (event: string, layerId: string, handler: (...args: any[]) => void) => {
            pendingEventsRef.current = pendingEventsRef.current.filter(
                (entry) =>
                    entry.event !== event ||
                    entry.layerId !== layerId ||
                    entry.handler !== handler,
            );

            const map = mapRef.current;
            if (map && isReadyRef.current) {
                map.off(event as any, layerId, handler as any);
            }

            untrackListener(event, layerId, handler);
        },
        [untrackListener],
    );

    // Interface publique pour brancher l'instance MapLibre créée dans l'arbre client.
    // Interface publique pour brancher l'instance MapLibre créée dans l'arbre client.
    const attachMap = useCallback(
        (instance: maplibregl.Map | null) => {
            if (mapRef.current === instance) {
                return;
            }

            if (detachLoadHandlerRef.current) {
                detachLoadHandlerRef.current();
                detachLoadHandlerRef.current = null;
            }

            if (mapRef.current && mapRef.current !== instance) {
                cleanupMapArtifacts(mapRef.current);
            }

            mapRef.current = instance;
            setMapInstance(instance);

            if (!instance) {
                setIsReady(false);
                isReadyRef.current = false;
                return;
            }

            const handleReady = () => {
                if (detachLoadHandlerRef.current) {
                    detachLoadHandlerRef.current();
                    detachLoadHandlerRef.current = null;
                }
                if (!isReadyRef.current) {
                    isReadyRef.current = true;
                    setIsReady(true);
                    flushPending(instance);
                }
            };

            if (instance.isStyleLoaded()) {
                handleReady();
            } else {
                instance.on("load", handleReady);
                detachLoadHandlerRef.current = () => {
                    instance.off("load", handleReady);
                };
            }
        },
        [cleanupMapArtifacts, flushPending],
    );

    // Cleanup global au démontage pour éviter les fuites MapLibre.
    // Cleanup global au démontage pour éviter les fuites MapLibre.
    useEffect(() => {
        return () => {
            if (detachLoadHandlerRef.current) {
                detachLoadHandlerRef.current();
                detachLoadHandlerRef.current = null;
            }
            cleanupMapArtifacts(mapRef.current);
            pendingSourcesRef.current.clear();
            pendingLayersRef.current = [];
            pendingEventsRef.current = [];
            mapRef.current = null;
        };
    }, [cleanupMapArtifacts]);

    const contextValue = useMemo<MapContextValue>(
        () => ({
            map: mapInstance,
            isReady,
            data: dataCache,
            attachMap,
            registerSource,
            addLayer,
            removeLayer,
            removeSource,
            fitToBounds,
            setFeatureState,
            on,
            off,
            loadGeoJSON,
        }),
        [
            mapInstance,
            isReady,
            dataCache,
            attachMap,
            registerSource,
            addLayer,
            removeLayer,
            removeSource,
            fitToBounds,
            setFeatureState,
            on,
            off,
            loadGeoJSON,
        ],
    );

    return (
        <MapContext.Provider value={contextValue}>
            <MapDataContext.Provider value={dataCache}>
                {children}
            </MapDataContext.Provider>
        </MapContext.Provider>
    );
}

// Hook pratique pour consommer toutes les capacités Map dans les composants clients.
export function useMap(): MapContextValue {
    const context = useContext(MapContext);
    if (!context) {
        throw new Error("useMap doit être utilisé à l'intérieur de MapProvider");
    }
    return context;
}

// Hook ne renvoyant que le cache GeoJSON (utile aux UI qui consomment les données).
export function useMapData(): Map<string, GeoJSONFC> {
    const context = useContext(MapDataContext);
    if (!context) {
        throw new Error("useMapData doit être utilisé à l'intérieur de MapProvider");
    }
    return context;
}
