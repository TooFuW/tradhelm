"use client";

import { useMapContext } from "@/src/lib/map/MapContext";
import { useEffect, useMemo, useState } from "react";
import { io, type Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:5742";

export function GameStart() {
    const { setGameStarted, gamesList } = useMapContext();
    const [name, setName] = useState("");
    const [socket, setSocket] = useState<Socket | null>(null);
    const [lobbyGames, setLobbyGames] = useState<string[]>(gamesList);

    const trimmedName = useMemo(() => name.trim(), [name]);

    useEffect(() => {
        const instance = io(SOCKET_URL, {
            auth: { token: "optional-token" },
        });

        setSocket(instance);

        instance.on("connect", () => {
            console.log("connected:", instance.id);
        });

        instance.on("games:list", (games: string[]) => {
            console.log("lobby:", games);
            setLobbyGames(games);
        });

        instance.on("game:update", (snapshot: unknown) => {
            console.log("game:", snapshot);
            setGameStarted(true);
        });

        instance.on("disconnect", () => {
            console.log("socket disconnected");
        });

        return () => {
            instance.off("connect");
            instance.off("games:list");
            instance.off("game:update");
            instance.off("disconnect");
            instance.disconnect();
        };
    }, [setGameStarted]);

    function createGame() {
        if (!socket) return;
        socket.emit("game:create");
    }

    function joinGame(gameId: string) {
        if (!socket || !trimmedName) return;
        socket.emit("game:join", { gameId, name: trimmedName });
    }

    return (
        <aside className="startmenu">
            <div className="startmenu_content">
                <img src="/logo.png" alt="" />
                <h2>Bienvenue sur Tradhelm</h2>
                <p>Entrez votre nom et cliquez sur "Nouveau Jeu"</p>
                <input type="text" id="pseudo" placeholder="Pseudo" value={name} onChange={(e) => setName(e.target.value)} />
                <button className="startmenu_button" onClick={createGame} disabled={!socket}>
                    Nouveau Jeu
                </button>
                {lobbyGames && lobbyGames.length > 0 && (
                    <ul className="startmenu_list">
                        <h3>Rejoindre un jeu</h3>
                        {lobbyGames.map((game) => (
                            <li key={game}>
                                <button className="startmenu_button" onClick={() => joinGame(game)} disabled={!trimmedName || !socket}>
                                    {game}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </aside>
    );
}
