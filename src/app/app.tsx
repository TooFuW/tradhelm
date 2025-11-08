"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { useMapContext } from "../lib/map/MapContext";
import { MapOverlay } from "../components/map/MapOverlay";
import "../styles/map.css";
import { GameStart } from "../components/map/GameStart";

type MapLibreModule = typeof import("maplibre-gl");

let maplibreCache: MapLibreModule | null = null;

async function getMapLibre(): Promise<MapLibreModule> {
    if (maplibreCache) return maplibreCache;
    maplibreCache = await import("maplibre-gl");
    return maplibreCache;
}

// Génère une grille de carrés couvrant le monde
function generateWorldSquareGrid(size: number = 1) {
    const features = [];
    
    // Couvre le monde de -180 à 180 en longitude et -85 à 85 en latitude
    const startLat = -85;
    const endLat = 85;
    const startLon = -180;
    const endLon = 180;
    
    let r = 0;
    let lat = startLat;
    
    while (lat < endLat) {
        let q = 0;
        
        // Calcule la hauteur ajustée pour cette latitude (correction Mercator)
        // On réduit la hauteur en s'éloignant de l'équateur pour compenser l'étirement visuel
        const latRad = (lat * Math.PI) / 180;
        const latHeight = size * Math.cos(latRad);
        
        for (let lon = startLon; lon < endLon; lon += size) {
            const coords = squareCoordinates(lon, lat, size, latHeight);
            const squareId = `${q},${r}`;
            
            features.push({
                type: "Feature" as const,
                properties: { id: squareId, q, r },
                geometry: {
                    type: "Polygon" as const,
                    coordinates: [coords],
                },
            });
            
            q++;
        }
        
        lat += latHeight;
        r++;
    }
    
    return {
        type: "FeatureCollection" as const,
        features,
    };
}

// Calcule les coordonnées d'un carré avec correction de la déformation Mercator
function squareCoordinates(lon: number, lat: number, width: number, height: number) {
    return [
        [lon, lat],
        [lon + width, lat],
        [lon + width, lat + height],
        [lon, lat + height],
        [lon, lat], // Ferme le polygone
    ];
}

export default function AppPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MapLibreMap | null>(null);
    const {
        gameStarted,
        squareCache,
        selectedSquare,
        hoveredSquareId,
        selectSquare,
        setHoveredSquareId,
        fetchGameState,
    } = useMapContext();

    // Initialise la carte avec un fond monde
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        let cancelled = false;

        (async () => {
            const maplibre = await getMapLibre();
            if (cancelled || !containerRef.current) return;

            const map = new maplibre.Map({
                container: containerRef.current,
                style: "https://demotiles.maplibre.org/style.json", // Carte du monde OpenStreetMap
                center: [0, 20],
                zoom: 4,
                attributionControl: false,
            });

            mapRef.current = map;

            map.on("load", () => {
                console.log("Carte chargée");
                
                // Génère la grille de carrés
                const squareGrid = generateWorldSquareGrid(0.5);
                
                map.addSource("square-grid", {
                    type: "geojson",
                    data: squareGrid,
                });

                // Couche de remplissage des carrés
                //map.addLayer({
                //    id: "square-fill",
                //    type: "fill",
                //    source: "square-grid",
                //    paint: {
                //        "fill-color": [
                //            "case",
                //            ["boolean", ["feature-state", "selected"], false],
                //            "#FFD700",
                //            ["boolean", ["feature-state", "hovered"], false],
                //            "#4A90E2",
                //            ["boolean", ["feature-state", "loaded"], false],
                //            "#2C5F8D",
                //            "#1a1a1a",
                //        ],
                //        "fill-opacity": [
                //            "case",
                //            ["boolean", ["feature-state", "loaded"], false],
                //            0.6,
                //            0.2,
                //        ],
                //    },
                //});

                // Couche de contour
                map.addLayer({
                    id: "square-outline",
                    type: "line",
                    source: "square-grid",
                    paint: {
                        "line-color": [
                            "case",
                            ["boolean", ["feature-state", "loaded"], false],
                            "#88CCEE",
                            "#444444",
                        ],
                        "line-width": [
                            "case",
                            ["boolean", ["feature-state", "selected"], false],
                            2.5,
                            0.5,
                        ],
                    },
                });
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

    // Charge l'état initial
    useEffect(() => {
        fetchGameState();
    }, [fetchGameState]);

    // Met à jour l'état visuel des carrés en cache
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !map.getSource("square-grid")) return;

        squareCache.forEach((square) => {
            map.setFeatureState(
                { source: "square-grid", id: square.id },
                { loaded: true }
            );
        });
    }, [squareCache]);

    // Met à jour la sélection
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !map.getSource("square-grid")) return;

        // Réinitialise tous les états de sélection
        map.removeFeatureState({ source: "square-grid" });
        
        // Réapplique les carrés chargés
        squareCache.forEach((square) => {
            map.setFeatureState(
                { source: "square-grid", id: square.id },
                { loaded: true }
            );
        });

        // Applique la sélection
        if (selectedSquare) {
            map.setFeatureState(
                { source: "square-grid", id: selectedSquare.id },
                { selected: true }
            );
        }
    }, [selectedSquare, squareCache]);

    // Gère les interactions
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const handleClick = (e: any) => {
            const features = map.queryRenderedFeatures(e.point, {
                layers: ["square-fill"],
            });

            if (features.length > 0) {
                const squareId = features[0].properties?.id;
                selectSquare(squareId);
            } else {
                selectSquare(null);
            }
        };

        const handleMouseMove = (e: any) => {
            const features = map.queryRenderedFeatures(e.point, {
                layers: ["square-fill"],
            });

            const canvas = map.getCanvas();
            
            if (features.length > 0) {
                canvas.style.cursor = "pointer";
                const squareId = features[0].properties?.id;
                setHoveredSquareId(squareId);
                
                // État visuel du hover
                if (squareId !== selectedSquare?.id) {
                    map.setFeatureState(
                        { source: "square-grid", id: squareId },
                        { hovered: true }
                    );
                }
                
                // Retire le hover des autres
                if (hoveredSquareId && hoveredSquareId !== squareId && hoveredSquareId !== selectedSquare?.id) {
                    map.setFeatureState(
                        { source: "square-grid", id: hoveredSquareId },
                        { hovered: false }
                    );
                }
            } else {
                canvas.style.cursor = "";
                if (hoveredSquareId && hoveredSquareId !== selectedSquare?.id) {
                    map.setFeatureState(
                        { source: "square-grid", id: hoveredSquareId },
                        { hovered: false }
                    );
                }
                setHoveredSquareId(null);
            }
        };

        map.on("click", handleClick);
        map.on("mousemove", handleMouseMove);

        return () => {
            map.off("click", handleClick);
            map.off("mousemove", handleMouseMove);
        };
    }, [selectSquare, setHoveredSquareId, selectedSquare, hoveredSquareId]);

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
            {gameStarted
                ? <MapOverlay />
                : <GameStart />
            }
            <div ref={containerRef} className="map-canvas" />
        </div>
    );
}