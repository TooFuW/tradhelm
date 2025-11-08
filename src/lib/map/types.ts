// Types GeoJSON
export interface GeoJSONFC {
    type: "FeatureCollection";
    features: Array<{
        type: "Feature";
        properties: Record<string, any>;
        geometry: {
            type: "Polygon" | "Point" | "LineString";
            coordinates: number[][][] | number[][] | number[];
        };
    }>;
}

// Types de configuration API
export interface APIConfig {
    baseURL: string;
    timeout: number;
    headers: Record<string, string>;
}

// Types de réponse API
export interface APIResponse<T> {
    success: boolean;
    data: T;
    error?: string;
}

// Helper pour les requêtes API (à utiliser dans MapContext)
export async function apiRequest<T>(
    endpoint: string,
    options?: RequestInit
): Promise<APIResponse<T>> {
    try {
        const response = await fetch(`/api${endpoint}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...options?.headers,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                data: data,
                error: data.message || "Erreur API",
            };
        }

        return {
            success: true,
            data,
        };
    } catch (error) {
        return {
            success: false,
            data: null as any,
            error: error instanceof Error ? error.message : "Erreur inconnue",
        };
    }
}