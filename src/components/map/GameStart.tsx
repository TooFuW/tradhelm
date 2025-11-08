"use client";

import { useMapContext } from "@/src/lib/map/MapContext";
import { use, useEffect, useMemo, useState } from "react";
import { io, type Socket } from "socket.io-client";

const SOCKET_URL = "http://bonus.nc:5742";

export function GameStart() {
    const { setGameStarted, gamesList } = useMapContext();
    const [name, setName] = useState("");
    const [socket, setSocket] = useState<Socket | null>(null);
    const [lobbyGames, setLobbyGames] = useState<{
        id: string;
        nb_joueurs: number;
    }[]>(gamesList);
        let token = localStorage.getItem("token");
    const [instance, setInstance] = useState<Socket | null>(io(SOCKET_URL, {
            auth: { token },
        }));

    const trimmedName = useMemo(() => name.trim(), [name]);

    useEffect(() => {
        console.log("Socket instance created", instance);

        if (!instance) return;

        setSocket(instance);

        instance.on("connect", () => {
            console.log("connected:", token );
        });

        instance.on("session:token", (newToken) => {
            localStorage.setItem("token", newToken);
            console.log("new token received:", newToken);
        });

        instance.on("games:list", (games) => {
            // fonction executée quand on reçoit la liste des jeux dispo
            console.log("EXECUTED");
            console.log("lobby:", games);

            // [{id : ehbnf, nb_joueurs : eufenun}]
            console.log(games);
            setLobbyGames(games);
        });

        instance.on("game:update", (snapshot: unknown) => {
            console.log("game:", snapshot);
            setGameStarted(true);
        });

        instance.on("disconnect", () => {
            console.log("socket disconnected");
        });

        instance?.emit("game:create", { username: trimmedName });
    }, []);

    function createGame() {
        instance?.emit("game:create", { username: trimmedName });
    }

    function joinGame(gameId: string) {
        if (!trimmedName || !instance) return;
        instance.emit("game:join", { gameId, name: trimmedName });
        setGameStarted(true);
    }

    return (
        <aside className="startmenu">
            <div className="startmenu_content">
                <img src="/logo.png" alt="" />
                <h2>Bienvenue sur Tradhelm</h2>
                <p>Entrez votre nom et rejoignez une partie ou créez-en une</p>
                <input type="text" id="pseudo" placeholder="Pseudo" value={name} onChange={(e) => setName(e.target.value)} />
                <button className="startmenu_button" onClick={createGame}>
                    Nouveau Jeu
                </button>
                {lobbyGames && lobbyGames.length > 0 && (
                    <ul className="startmenu_list">
                        <h3>Rejoindre un jeu</h3>
                        {lobbyGames.map((game) => (
                            <li key={game.id}>
                                <button className="startmenu_button" onClick={() => joinGame(game.id)}>
                                    {game.id} ({game.nb_joueurs} joueurs)
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </aside>
    );
}
