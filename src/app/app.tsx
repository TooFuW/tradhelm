"use client";

import { useEffect, useRef } from "react";
import type { Map as MapLibreInstance, MapLayerMouseEvent } from "maplibre-gl";

import { useMap } from "../lib/map/MapContext";
import type { GeoJSONFeature } from "../lib/map/types";
import "../styles/map.css";

type MapLibreModule = typeof import("maplibre-gl");

let maplibreCache: MapLibreModule | null = null;

async function getMapLibre(): Promise<MapLibreModule> {
    if (maplibreCache) {
        return maplibreCache;
    }
    maplibreCache = await import("maplibre-gl");
    return maplibreCache;
}

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

    useEffect(() => {
        if (typeof window === "undefined" || !containerRef.current) {
            return;
        }

        let cancelled = false;
        let mapInstance: MapLibreInstance | null = null;

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

    useEffect(() => {
        if (!map) {
            return undefined;
        }

        const handleResize = () => {
            map.resize();
        };

        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [map]);

    useEffect(() => {
        if (!isReady || initializedRef.current) {
            return;
        }
        initializedRef.current = true;

        const bootstrapLayers = async () => {
            await registerSource("countries", "/api/geo/countries");
            await registerSource("roads", "/api/geo/roads");
            await registerSource("cities", "/api/geo/cities");

            await addLayer({
                id: "countries-fill",
                type: "fill",
                source: "countries",
                paint: {
                    "fill-color": "#218774",
                    "fill-opacity": 0.4,
                },
            });

            await addLayer({
                id: "roads-line",
                type: "line",
                source: "roads",
                paint: {
                    "line-color": "#f97316",
                    "line-width": 2.5,
                },
            });

            await addLayer({
                id: "cities-circle",
                type: "circle",
                source: "cities",
                paint: {
                    "circle-radius": 5,
                    "circle-color": "#e11d48",
                },
            });
        };

        bootstrapLayers().catch((error) => {
            console.error("Erreur lors de l'initialisation des couches:", error);
        });
    }, [isReady, registerSource, addLayer]);

    useEffect(() => {
        if (!isReady || !map) {
            return;
        }

        const handleCountryEnter = () => {
            map.getCanvas().style.cursor = "pointer";
        };

        const handleCountryLeave = () => {
            map.getCanvas().style.cursor = "";
        };

        const handleCityClick = (event: MapLayerMouseEvent) => {
            const feature = event.features?.[0] as GeoJSONFeature | undefined;
            if (!feature) {
                return;
            }

            const name = feature.properties?.["name"];
            if (typeof name === "string") {
                console.info(`Ville sélectionnée: ${name}`);
            }

            if (
                Array.isArray(feature.bbox) &&
                feature.bbox.length === 4 &&
                feature.bbox.every((value) => typeof value === "number")
            ) {
                fitToBounds(feature.bbox as [number, number, number, number]);
                return;
            }

            if (
                feature.geometry.type === "Point" &&
                Array.isArray(feature.geometry.coordinates)
            ) {
                const [lon, lat] = feature.geometry.coordinates as [number, number];
                map.flyTo({
                    center: [lon, lat],
                    zoom: 5,
                    essential: true,
                });
            }
        };

        on("mouseenter", "countries-fill", handleCountryEnter);
        on("mouseleave", "countries-fill", handleCountryLeave);
        on("click", "cities-circle", handleCityClick);

        return () => {
            off("mouseenter", "countries-fill", handleCountryEnter);
            off("mouseleave", "countries-fill", handleCountryLeave);
            off("click", "cities-circle", handleCityClick);
            map.getCanvas().style.cursor = "";
        };
    }, [isReady, map, on, off, fitToBounds]);

    return (
        <div className="map-root">
            <div ref={containerRef} className="map-canvas" />
        </div>
    );
}

export default function AppPage() {
    return <MapScene />;
}
