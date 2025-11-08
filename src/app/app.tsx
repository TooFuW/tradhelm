"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { useMapContext } from "../lib/map/MapContext";
import { MapOverlay } from "../components/map/MapOverlay";
import "../styles/map.css";

type MapLibreModule = typeof import("maplibre-gl");

let maplibreCache: MapLibreModule | null = null;

async function getMapLibre(): Promise<MapLibreModule> {
    if (maplibreCache) return maplibreCache;
    maplibreCache = await import("maplibre-gl");
    return maplibreCache;
}

// Génère un hexagone en coordonnées géographiques
function hexToGeoJSON(q: number, r: number, size: number = 0.5) {
    const x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
    const y = size * ((3 / 2) * r);
    
    const angles = [0, 60, 120, 180, 240, 300];
    const coordinates = angles.map(angle => {
        const rad = (Math.PI / 180) * angle;
        return [
            x + size * Math.cos(rad),
            y + size * Math.sin(rad),
        ];
    });
    
    coordinates.push(coordinates[0]); // Fermer le polygone
    
    return {
        type: "Feature" as const,
        properties: { q, r, id: `${q},${r}` },
        geometry: {
            type: "Polygon" as const,
            coordinates: [coordinates],
        },
    };
}

export default function AppPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MapLibreMap | null>(null);
    const {
        tiles,
        selectedTile,
        selectTile,
        setHoveredTile,
        fetchGameState,
        fetchTiles,
    } = useMapContext();

    // Initialisation de la carte
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        let cancelled = false;

        (async () => {
            const maplibre = await getMapLibre();
            if (cancelled || !containerRef.current) return;

            const map = new maplibre.Map({
                container: containerRef.current,
                //style: {
                //    version: 8,
                //    sources: {},
                //    layers: [
                //        {
                //            id: "background",
                //            type: "background",
                //            paint: { "background-color": "#1a2332" },
                //        },
                //    ],
                //},
                style: "https://demotiles.maplibre.org/style.json",
                center: [0, 0],
                zoom: 2,
                attributionControl: false,
            });

            mapRef.current = map;

            map.on("load", () => {
                console.log("Carte chargée");
            });
        })();

        return () => {
            cancelled = true;
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Chargement initial des données
    useEffect(() => {
        fetchGameState();
        fetchTiles();
    }, [fetchGameState, fetchTiles]);

    // Mise à jour de la couche hexagonale
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !map.isStyleLoaded() || tiles.size === 0) return;

        // Générer le GeoJSON à partir des tuiles
        const features = Array.from(tiles.values()).map(tile =>
            hexToGeoJSON(tile.q, tile.r)
        );

        const geojson = {
            type: "FeatureCollection" as const,
            features,
        };

        // Ajouter ou mettre à jour la source
        if (map.getSource("hexagons")) {
            (map.getSource("hexagons") as any).setData(geojson);
        } else {
            map.addSource("hexagons", {
                type: "geojson",
                data: geojson,
            });

            // Couche de remplissage
            map.addLayer({
                id: "hexagons-fill",
                type: "fill",
                source: "hexagons",
                paint: {
                    "fill-color": [
                        "case",
                        ["boolean", ["feature-state", "selected"], false],
                        "#FFD700",
                        ["boolean", ["feature-state", "hovered"], false],
                        "#4A90E2",
                        "#2C5F8D",
                    ],
                    "fill-opacity": 0.6,
                },
            });

            // Couche de contour
            map.addLayer({
                id: "hexagons-outline",
                type: "line",
                source: "hexagons",
                paint: {
                    "line-color": "#88CCEE",
                    "line-width": 1.5,
                },
            });
        }
    }, [tiles]);

    // Gestion de la sélection
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !map.getSource("hexagons")) return;

        // Réinitialiser tous les états
        tiles.forEach(tile => {
            map.removeFeatureState({
                source: "hexagons",
                id: tile.id,
            });
        });

        // Mettre à jour l'état de la tuile sélectionnée
        if (selectedTile) {
            map.setFeatureState(
                {
                    source: "hexagons",
                    id: selectedTile.id,
                },
                { selected: true }
            );
        }
    }, [selectedTile, tiles]);

    // Gestion des interactions
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const handleClick = (e: any) => {
            const features = map.queryRenderedFeatures(e.point, {
                layers: ["hexagons-fill"],
            });

            if (features.length > 0) {
                const tileId = features[0].properties?.id;
                selectTile(tileId);
            } else {
                selectTile(null);
            }
        };

        const handleMouseMove = (e: any) => {
            const features = map.queryRenderedFeatures(e.point, {
                layers: ["hexagons-fill"],
            });

            const canvas = map.getCanvas();
            
            if (features.length > 0) {
                canvas.style.cursor = "pointer";
                const tileId = features[0].properties?.id;
                setHoveredTile(tileId);
                
                // État visuel du hover
                tiles.forEach(tile => {
                    if (tile.id !== selectedTile?.id) {
                        map.setFeatureState(
                            { source: "hexagons", id: tile.id },
                            { hovered: tile.id === tileId }
                        );
                    }
                });
            } else {
                canvas.style.cursor = "";
                setHoveredTile(null);
                
                // Réinitialiser le hover
                tiles.forEach(tile => {
                    if (tile.id !== selectedTile?.id) {
                        map.setFeatureState(
                            { source: "hexagons", id: tile.id },
                            { hovered: false }
                        );
                    }
                });
            }
        };

        map.on("click", handleClick);
        map.on("mousemove", handleMouseMove);

        return () => {
            map.off("click", handleClick);
            map.off("mousemove", handleMouseMove);
        };
    }, [selectTile, setHoveredTile, tiles, selectedTile]);

    // Resize handler
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const handleResize = () => map.resize();
        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div className="map-root">
            <div ref={containerRef} className="map-canvas" />
            <MapOverlay />
        </div>
    );
}