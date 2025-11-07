"use client";

import { useEffect, useRef } from "react";
import type { Map as MapLibreInstance, MapLayerMouseEvent } from "maplibre-gl";

import { useMap } from "../lib/map/MapContext";
import { MapOverlay } from "../components/map/MapOverlay";
import "../styles/map.css";

type MapLibreModule = typeof import("maplibre-gl");

let maplibreCache: MapLibreModule | null = null;

// Evite de charger maplibre-gl côté serveur ou plusieurs fois côté client.
async function getMapLibre(): Promise<MapLibreModule> {
    if (maplibreCache) {
        return maplibreCache;
    }
    maplibreCache = await import("maplibre-gl");
    return maplibreCache;
}

// Encapsule la scène MapLibre et consomme le contexte partagé exposant la carte.
function MapScene() {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const initializedRef = useRef(false);
    const {
        map,
        attachMap,
        isReady,
        registerSource,
        addLayer,
        on,
        off,
        fitToBounds,
    } = useMap();

    // Monte la carte lorsqu'on dispose d'un conteneur DOM côté client.
    useEffect(() => {
        if (typeof window === "undefined" || !containerRef.current) {
            return;
        }

        let cancelled = false;
        let mapInstance: MapLibreInstance | null = null;

        // Initialisation asynchrone de la carte dès que le conteneur est disponible.
        (async () => {
            const maplibre = await getMapLibre();
            if (cancelled || !containerRef.current) {
                return;
            }

            mapInstance = new maplibre.Map({
                container: containerRef.current,
                style: "https://demotiles.maplibre.org/style.json",
                center: [0, 20],
                zoom: 2.5,
                attributionControl: false,
            });

            attachMap(mapInstance);
        })();

        return () => {
            cancelled = true;
            attachMap(null);
            if (mapInstance) {
                mapInstance.remove();
            }
        };
    }, [attachMap]);

    // Force un resize MapLibre lorsqu'on redimensionne la fenêtre.
    useEffect(() => {
        if (!map) {
            return undefined;
        }

        // Maintient la carte alignée avec le viewport.
        const handleResize = () => {
            map.resize();
        };

        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [map]);

    // Crée les sources/couches GeoJSON une fois la carte prête.
    useEffect(() => {
        if (!isReady || initializedRef.current) {
            return;
        }
        initializedRef.current = true;

        const bootstrapLayers = async () => {
            //await registerSource("countries", "/api/geo/countries");
//
            //await addLayer({
            //    id: "countries-fill",
            //    type: "fill",
            //    source: "countries",
            //    paint: {
            //        "fill-color": "#218774",
            //        "fill-opacity": 0.4,
            //    },
            //});
        };

        bootstrapLayers().catch((error) => {
            console.error("Erreur lors de l'initialisation des couches:", error);
        });
    }, [isReady, registerSource, addLayer]);

    // Enregistre les handlers d'interactions dès que la carte est prête.
    useEffect(() => {
        if (!isReady || !map) {
            return;
        }

        // Signale qu'une zone interactive est survolée.
        const handleCountryEnter = () => {
            map.getCanvas().style.cursor = "pointer";
        };

        // Restaure le curseur par défaut lorsque la couche n'est plus ciblée.
        const handleCountryLeave = () => {
            map.getCanvas().style.cursor = "";
        };

        on("mouseenter", "countries-fill", handleCountryEnter);
        on("mouseleave", "countries-fill", handleCountryLeave);

        return () => {
            off("mouseenter", "countries-fill", handleCountryEnter);
            off("mouseleave", "countries-fill", handleCountryLeave);
            map.getCanvas().style.cursor = "";
        };
    }, [isReady, map, on, off, fitToBounds]);

    return (
        <div className="map-root">
            <div ref={containerRef} className="map-canvas" />
            <MapOverlay />
        </div>
    );
}

// Page Next.js qui délègue tout le rendu à MapScene (le Provider est dans layout.tsx).
export default function AppPage() {
    return <MapScene />;
}
