"use client";

import { useMap, useMapData } from "@/src/lib/map/MapContext";
import { useState } from "react";

// Petit HUD flottant pour tester l'intégration d'UI multiples au-dessus de la carte.
export function MapOverlay() {
    const [openPanel, setOpenPanel] = useState(false);
    const {  } = useMap();
    const data = useMapData();

    return (
        <aside className="hud">
            <div className="hud_topbar">
                <div className="hud_ressource">
                    <svg style={{color: "red"}} xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m14 12-8.381 8.38a1 1 0 0 1-3.001-3L11 9"/>
                        <path d="M15 15.5a.5.5 0 0 0 .5.5A6.5 6.5 0 0 0 22 9.5a.5.5 0 0 0-.5-.5h-1.672a2 2 0 0 1-1.414-.586l-5.062-5.062a1.205 1.205 0 0 0-1.704 0L9.352 5.648a1.205 1.205 0 0 0 0 1.704l5.062 5.062A2 2 0 0 1 15 13.828z"/>
                    </svg>
                    <div className="hud_ressource_quantite gauche">
                        2
                    </div>
                </div>
                <div className="hud_ressource">
                    <div className="hud_ressource_quantite gauche">
                        2
                    </div>
                </div>
                <div className="hud_ressource">
                    <div className="hud_ressource_quantite gauche">
                        2
                    </div>
                </div>
                <div className="hud_ressource">
                    <div className="hud_ressource_quantite gauche">
                        2
                    </div>
                </div>
                <div className="hud_ressource">
                    <div className="hud_ressource_quantite gauche">
                        2
                    </div>
                </div>
                <div className="hud_ressources">
                    <div className="hud_ressource">
                        <div className="hud_ressource_quantite gauche">
                            2
                        </div>
                    </div>
                    <div className="hud_ressource">
                        <div className="hud_ressource_quantite droite">
                            2
                        </div>
                    </div>
                </div>
                <div className="hud_time">
                    <h3>12:30</h3>
                    <h3>08 Novembre 2025</h3>
                </div>
                <div className="hud_ressource">
                    <div className="hud_ressource_quantite droite">
                        2
                    </div>
                </div>
                <div className="hud_ressource">
                    <div className="hud_ressource_quantite droite">
                        2
                    </div>
                </div>
                <div className="hud_ressource">
                    <div className="hud_ressource_quantite droite">
                        2
                    </div>
                </div>
                <div className="hud_ressource">
                    <div className="hud_ressource_quantite droite">
                        2
                    </div>
                </div>
                <div className="hud_ressource">
                    <div className="hud_ressource_quantite droite">
                        2
                    </div>
                </div>
            </div>

            <div className="hud_bottombar" style={{bottom: openPanel ? "0px" : "-50dvh"}}>
                {/**<div className="hud_bottombar_opener" onClick={() => setOpenPanel(!openPanel)}>
                    <svg style={{transform: openPanel ? "rotate(180deg)" : ""}} width="30px" height="30px" viewBox="0 -4.5 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg">
                        <g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                            <g id="Icon-Set-Filled" transform="translate(-521.000000, -1202.000000)" fill="#ffffffff">
                                <path d="M544.345,1213.39 L534.615,1202.6 C534.167,1202.15 533.57,1201.95 532.984,1201.99 C532.398,1201.95 531.802,1202.15 531.354,1202.6 L521.624,1213.39 C520.797,1214.22 520.797,1215.57 521.624,1216.4 C522.452,1217.23 523.793,1217.23 524.621,1216.4 L532.984,1207.13 L541.349,1216.4 C542.176,1217.23 543.518,1217.23 544.345,1216.4 C545.172,1215.57 545.172,1214.22 544.345,1213.39" id="chevron-up"></path>
                            </g>
                        </g>
                    </svg>
                </div>*/}
            </div>
        </aside>
    );
}
