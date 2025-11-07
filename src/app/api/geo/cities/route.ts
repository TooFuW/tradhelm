import { NextResponse } from "next/server";

import type { GeoJSONFC } from "@/lib/map/types";

const cities: GeoJSONFC = {
    type: "FeatureCollection",
    features: [
        {
            type: "Feature",
            properties: { name: "Paris" },
            bbox: [2.2522, 48.7566, 2.4522, 48.9566],
            geometry: {
                type: "Point",
                coordinates: [2.3522, 48.8566],
            },
        },
        {
            type: "Feature",
            properties: { name: "Nairobi" },
            bbox: [36.7219, -1.45, 36.9419, -1.15],
            geometry: {
                type: "Point",
                coordinates: [36.8219, -1.2921],
            },
        },
        {
            type: "Feature",
            properties: { name: "Tokyo" },
            bbox: [139.5919, 35.5299, 139.9319, 35.8099],
            geometry: {
                type: "Point",
                coordinates: [139.6917, 35.6895],
            },
        },
    ],
};

export async function GET() {
    return NextResponse.json(cities);
}
