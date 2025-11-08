"use client";

import {
    createContext,
    useContext,
    useState,
    useCallback,
    useMemo,
    type ReactNode,
} from "react";

// Types
export interface HexTile {
    id: string;
    q: number;
    r: number;
    owner: string | null;
    terrain: string;
    resources: number;
    units: number;
}

export interface PlayerData {
    id: string;
    username: string;
    resources: {
        gold: number;
        food: number;
        wood: number;
        stone: number;
        iron: number;
    };
    territories: number;
    units: number;
}

export interface GameState {
    time: string;
    turn: number;
    players: PlayerData[];
    currentPlayer: string;
}

interface MapContextValue {
    // État du jeu
    gameState: GameState | null;
    playerData: PlayerData | null;
    tiles: Map<string, HexTile>;
    selectedTile: HexTile | null;
    
    // Actions
    selectTile: (tileId: string | null) => void;
    fetchGameState: () => Promise<void>;
    fetchTiles: () => Promise<void>;
    performAction: (action: string, params: any) => Promise<void>;
    
    // Communication map <-> overlay
    hoveredTile: string | null;
    setHoveredTile: (tileId: string | null) => void;
}

const MapContext = createContext<MapContextValue | undefined>(undefined);

export function MapProvider({ children }: { children: ReactNode }) {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [playerData, setPlayerData] = useState<PlayerData | null>(null);
    const [tiles, setTiles] = useState<Map<string, HexTile>>(new Map());
    const [selectedTile, setSelectedTile] = useState<HexTile | null>(null);
    const [hoveredTile, setHoveredTile] = useState<string | null>(null);

    // Récupération de l'état du jeu
    const fetchGameState = useCallback(async () => {
        try {
            // const response = await fetch("/api/game/state");
            // const data = await response.json();
            
            // Mock data
            const mockState: GameState = {
                time: new Date().toISOString(),
                turn: 42,
                currentPlayer: "player1",
                players: [
                    {
                        id: "player1",
                        username: "Joueur1",
                        resources: { gold: 1000, food: 500, wood: 300, stone: 200, iron: 150 },
                        territories: 5,
                        units: 20,
                    },
                ],
            };
            
            setGameState(mockState);
            setPlayerData(mockState.players[0]);
        } catch (error) {
            console.error("Erreur fetchGameState:", error);
        }
    }, []);

    // Récupération des tuiles
    const fetchTiles = useCallback(async () => {
        try {
            // const response = await fetch("/api/game/tiles");
            // const data = await response.json();
            
            // Mock data
            const mockTiles = new Map<string, HexTile>();
            for (let q = -5; q <= 5; q++) {
                for (let r = -5; r <= 5; r++) {
                    const id = `${q},${r}`;
                    mockTiles.set(id, {
                        id,
                        q,
                        r,
                        owner: Math.random() > 0.7 ? "player1" : null,
                        terrain: ["plaine", "forêt", "montagne", "eau"][Math.floor(Math.random() * 4)],
                        resources: Math.floor(Math.random() * 100),
                        units: Math.floor(Math.random() * 10),
                    });
                }
            }
            
            setTiles(mockTiles);
        } catch (error) {
            console.error("Erreur fetchTiles:", error);
        }
    }, []);

    // Sélection d'une tuile
    const selectTile = useCallback((tileId: string | null) => {
        if (!tileId) {
            setSelectedTile(null);
            return;
        }
        
        const tile = tiles.get(tileId);
        if (tile) {
            setSelectedTile(tile);
        }
    }, [tiles]);

    // Action générique (attaque, construction, déplacement, etc.)
    const performAction = useCallback(async (action: string, params: any) => {
        try {
            // const response = await fetch("/api/game/action", {
            //     method: "POST",
            //     headers: { "Content-Type": "application/json" },
            //     body: JSON.stringify({ action, params }),
            // });
            // const result = await response.json();
            
            console.log("Action:", action, params);
            
            // Rafraîchir les données après l'action
            await fetchGameState();
            await fetchTiles();
        } catch (error) {
            console.error("Erreur performAction:", error);
        }
    }, [fetchGameState, fetchTiles]);

    const value = useMemo<MapContextValue>(
        () => ({
            gameState,
            playerData,
            tiles,
            selectedTile,
            selectTile,
            fetchGameState,
            fetchTiles,
            performAction,
            hoveredTile,
            setHoveredTile,
        }),
        [
            gameState,
            playerData,
            tiles,
            selectedTile,
            selectTile,
            fetchGameState,
            fetchTiles,
            performAction,
            hoveredTile,
            setHoveredTile,
        ]
    );

    return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}

export function useMapContext(): MapContextValue {
    const context = useContext(MapContext);
    if (!context) {
        throw new Error("useMapContext doit être utilisé dans MapProvider");
    }
    return context;
}