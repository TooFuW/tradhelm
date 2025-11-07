"use client";

import { useMemo } from "react";

import { useMap, useMapData } from "@/src/lib/map/MapContext";

// Petit panneau flottant pour tester l'intégration d'UI au-dessus de la carte.
export function MapOverlay() {
    const { isReady, map, fitToBounds } = useMap();
    const data = useMapData();

    // Construit une vue résumée des sources et du nombre de features chargées.
    const loadedSources = useMemo(() => {
        return Array.from(data.entries()).map(([key, collection]) => ({
            key,
            count: collection.features.length,
        }));
    }, [data]);

    // Simule une action "vue globale" pour valider fitToBounds côté UI.
    const handleWorldView = () => {
        fitToBounds([-180, -60, 180, 85]);
    };

    // Permet de revenir rapidement au cadrage initial utilisé lors du montage.
    const handleResetNorth = () => {
        if (!map) {
            return;
        }
        map.flyTo({ center: [0, 20], zoom: 2.5, essential: true });
    };

    return (
        <aside className="map-overlay">
            <div className="map-overlay__status">
                {isReady ? "Carte prête" : "Chargement de la carte..."}
            </div>

            <div className="map-overlay__section">
                <p className="map-overlay__title">Sources chargées</p>
                {loadedSources.length === 0 ? (
                    <p className="map-overlay__muted">Aucune donnée pour le moment.</p>
                ) : (
                    <ul>
                        {loadedSources.map(({ key, count }) => (
                            <li key={key}>
                                <span>{key}</span>
                                <span className="map-overlay__badge">{count}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="map-overlay__section map-overlay__actions">
                <button type="button" onClick={handleWorldView}>
                    Vue globale
                </button>
                <button type="button" onClick={handleResetNorth} disabled={!map}>
                    Recentre
                </button>
            </div>
        </aside>
    );
}
