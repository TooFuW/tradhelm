"use client";

import {
    createContext,
    useContext,
    useState,
    useCallback,
    useMemo,
    type ReactNode,
} from "react";

export interface SquareTile {
    id: string;
    q: number;
    r: number;
    owner: string | null;
    terrain: string;
    resources: number;
    units: number;
    [key: string]: any;
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
    gameStarted: boolean;
    gamesList: string[];
    gameState: GameState | null;
    playerData: PlayerData | null;
    batimentSelected: string | null;
    
    squareCache: Map<string, SquareTile>;
    selectedSquare: SquareTile | null;
    hoveredSquareId: string | null;
    
    setBatimentSelected: (batimentId: string | null) => void;
    setGameStarted: (started: boolean) => void;
    loadSquareData: (squareId: string) => Promise<SquareTile>;
    selectSquare: (squareId: string | null) => void;
    setHoveredSquareId: (squareId: string | null) => void;
    fetchGameState: () => Promise<void>;
}

const MapContext = createContext<MapContextValue | undefined>(undefined);

export function MapProvider({ children }: { children: ReactNode }) {
    const [gameStarted, setGameStarted] = useState(false);
    const [gamesList] = useState<string[]>(["JG4T5H", "O85AUC", "8C2E5C"]);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [playerData, setPlayerData] = useState<PlayerData | null>(null);
    const [squareCache, setSquareCache] = useState<Map<string, SquareTile>>(new Map());
    const [selectedSquare, setSelectedSquare] = useState<SquareTile | null>(null);
    const [hoveredSquareId, setHoveredSquareId] = useState<string | null>(null);
    const [batimentSelected, setBatimentSelected] = useState<string | null>(null);
    
    const loadingRef = useState(new Map<string, Promise<SquareTile>>())[0];

    const loadSquareData = useCallback(async (squareId: string): Promise<SquareTile> => {
        const cached = squareCache.get(squareId);
        if (cached) {
            return cached;
        }

        const inflight = loadingRef.get(squareId);
        if (inflight) {
            return inflight;
        }

        const promise = (async () => {
            try {
                // const response = await fetch(`/api/square/${squareId}`);
                // const data = await response.json();
                
                await new Promise(resolve => setTimeout(resolve, 300));
                const [q, r] = squareId.split(',').map(Number);
                const data: SquareTile = {
                    id: squareId,
                    q,
                    r,
                    owner: Math.random() > 0.7 ? "player1" : null,
                    terrain: ["plaine", "forêt", "montagne", "eau"][Math.floor(Math.random() * 4)],
                    resources: Math.floor(Math.random() * 100),
                    units: Math.floor(Math.random() * 10),
                };
                
                setSquareCache(prev => {
                    const next = new Map(prev);
                    next.set(squareId, data);
                    return next;
                });
                
                loadingRef.delete(squareId);
                return data;
            } catch (error) {
                loadingRef.delete(squareId);
                console.error(`Erreur chargement carré ${squareId}:`, error);
                throw error;
            }
        })();

        loadingRef.set(squareId, promise);
        return promise;
    }, [squareCache, loadingRef]);

    const selectSquare = useCallback(async (squareId: string | null) => {
        if (!squareId) {
            setSelectedSquare(null);
            return;
        }

        try {
            const squareData = await loadSquareData(squareId);
            setSelectedSquare(squareData);
        } catch (error) {
            console.error("Erreur sélection carré:", error);
        }
    }, [loadSquareData]);

    // Récupère l'état du jeu
    const fetchGameState = useCallback(async () => {
        try {
            // const response = await fetch("/api/game/state");
            // const data = await response.json();
            
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

    const value = useMemo<MapContextValue>(
        () => ({
            gameStarted,
            gamesList,
            gameState,
            playerData,
            batimentSelected,
            squareCache,
            selectedSquare,
            hoveredSquareId,
            setBatimentSelected,
            setGameStarted,
            loadSquareData,
            selectSquare,
            setHoveredSquareId,
            fetchGameState,
        }),
        [
            gameStarted,
            gamesList,
            gameState,
            playerData,
            batimentSelected,
            squareCache,
            selectedSquare,
            hoveredSquareId,
            setBatimentSelected,
            setGameStarted,
            loadSquareData,
            selectSquare,
            setHoveredSquareId,
            fetchGameState,
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