"use client";

import { useMapContext } from "@/src/lib/map/MapContext";
import { useState } from "react";

export function GameStart() {
    const { setGameStarted, gamesList } = useMapContext();
    const [name, setName] = useState("");

    function createGame() {
        if (name) {
            setGameStarted(true);
        }
    }

    function joinGame(gameId: string) {
        if (name) {
            setGameStarted(true);
        }
    }

    return (
        <aside className="startmenu">
            <div className="startmenu_content">
                <h2>Bienvenue sur Tradhelm</h2>
                <p>Entrez votre nom et cliquez sur "Nouveau Jeu"</p>
                <input type="text" id="pseudo" placeholder="Entrez votre nom" onChange={(e) => setName(e.target.value)}/>
                <button className="startmenu_button" onClick={() => createGame()}>
                    Nouveau Jeu
                </button>
                {gamesList && gamesList.length > 0 &&
                    <ul className="startmenu_list">
                        <h3>Rejoindre un jeu</h3>
                        {gamesList.map(game => (
                            <li key={game}>
                                <button className="startmenu_button" onClick={() => joinGame(game)}>
                                    {game}
                                </button>
                            </li>
                        ))}
                    </ul>
                }
            </div>
        </aside>
    )
}