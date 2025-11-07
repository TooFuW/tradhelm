import { NextResponse } from "next/server";

import type { GeoJSONFC } from "@/lib/map/types";

const roads: GeoJSONFC = {
    type: "FeatureCollection",
    features: [
        {
            type: "Feature",
            properties: { name: "Equatorial Trail" },
            geometry: {
                type: "LineString",
                coordinates: [
                    [-15, 10],
                    [0, 12],
                    [15, 8],
                    [30, 6],
                ],
            },
        },
        {
            type: "Feature",
            properties: { name: "Meridian Highway" },
            geometry: {
                type: "LineString",
                coordinates: [
                    [40, -20],
                    [38, -5],
                    [37, 8],
                    [36, 18],
                ],
            },
        },
    ],
};

export async function GET() {
    return NextResponse.json(roads);
}
