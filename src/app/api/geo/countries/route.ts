import { NextResponse } from "next/server";

import type { GeoJSONFC } from "@/lib/map/types";

const countries: GeoJSONFC = {
    type: "FeatureCollection",
    features: [
        {
            type: "Feature",
            properties: { name: "Northland" },
            bbox: [-20, 5, 20, 35],
            geometry: {
                type: "Polygon",
                coordinates: [
                    [
                        [-20, 5],
                        [20, 5],
                        [20, 35],
                        [-20, 35],
                        [-20, 5],
                    ],
                ],
            },
        },
        {
            type: "Feature",
            properties: { name: "Southreach" },
            bbox: [25, -25, 55, 5],
            geometry: {
                type: "Polygon",
                coordinates: [
                    [
                        [25, -25],
                        [55, -25],
                        [55, 5],
                        [25, 5],
                        [25, -25],
                    ],
                ],
            },
        },
    ],
};

export async function GET() {
    return NextResponse.json(countries);
}
