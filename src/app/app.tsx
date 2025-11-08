"use client";

import { GameStart } from "../components/map/GameStart";
import { MapOverlay } from "../components/map/MapOverlay";
import { useMapContext } from "../lib/map/MapContext";
import type { Map as MapLibreMap } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import "../styles/map.css";

type MapLibreModule = typeof import("maplibre-gl");

let maplibreCache: MapLibreModule | null = null;

async function getMapLibre(): Promise<MapLibreModule> {
    if (maplibreCache) return maplibreCache;
    maplibreCache = await import("maplibre-gl");
    return maplibreCache;
}

export default function MapGrid() {
    const { gameStarted, batimentSelected, setBatimentSelected, selectSquare, setHoveredSquareId, hoveredSquareId, selectedSquare } = useMapContext();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MapLibreMap | null>(null);
    const TILE_SIZE = 50;
    const GRID_WIDTH = 40;
    const GRID_HEIGHT = 30;

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
        })();

        return () => {
            cancelled = true;
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let q = 0; q < GRID_WIDTH; q++) {
            for (let r = 0; r < GRID_HEIGHT; r++) {
                const x = q * TILE_SIZE + viewOffset.x;
                const y = r * TILE_SIZE + viewOffset.y;
                const squareId = `${q},${r}`;

                if (selectedSquare?.id === squareId && batimentSelected) {
                    const image = new Image();
                    image.src = batimentSelected;
                    image.onload = () => {const PAD = 5;
                        const inner = TILE_SIZE - PAD;

                        const scale = Math.min(inner / image.width, inner / image.height);
                        const dw = Math.round(image.width * scale);
                        const dh = Math.round(image.height * scale);

                        const dx = x + 2 + (inner - dw) / 2;
                        const dy = y + 2 + (inner - dh) / 2;

                        ctx.drawImage(image, dx, dy, dw, dh);
                    };
                }

                ctx.fillStyle = selectedSquare?.id === squareId
                    ? "#3b82f6"
                    : hoveredSquareId === squareId
                    ? "#60a5fa"
                    : "#00ff0dff";

                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = "#374151";
                ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
            }
        }
    }, [hoveredSquareId, selectedSquare, viewOffset, batimentSelected]);

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left - viewOffset.x;
        const y = e.clientY - rect.top - viewOffset.y;

        const q = Math.floor(x / TILE_SIZE);
        const r = Math.floor(y / TILE_SIZE);

        if (q >= 0 && q < GRID_WIDTH && r >= 0 && r < GRID_HEIGHT) {
            setHoveredSquareId(`${q},${r}`);
        } else {
            setHoveredSquareId(null);
        }
    };

    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        setBatimentSelected(null);

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left - viewOffset.x;
        const y = e.clientY - rect.top - viewOffset.y;

        const q = Math.floor(x / TILE_SIZE);
        const r = Math.floor(y / TILE_SIZE);

        if (q >= 0 && q < GRID_WIDTH && r >= 0 && r < GRID_HEIGHT) {
            selectSquare(`${q},${r}`);
        }
    };

    return (
        <div className="map-root">
            {gameStarted
                ? <MapOverlay />
                : <GameStart />
            }
            <div className="map-canvas" ref={containerRef}>
                <canvas
                    ref={canvasRef}
                    onMouseMove={handleMouseMove}
                    onClick={handleClick}
                    onMouseLeave={() => setHoveredSquareId(null)}
                />
            </div>
        </div>
    );
}
