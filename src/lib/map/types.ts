import type { Feature, FeatureCollection } from "geojson";

export type GeoJSONFeature = Feature;
export type GeoJSONFC = FeatureCollection;

export type VectorLayerKind = "point" | "line" | "polygon";

export type LayerStyleOptions = {
    point?: {
        "circle-radius"?: number;
        "circle-color"?: string;
    };
    line?: {
        "line-width"?: number;
        "line-color"?: string;
    };
    polygon?: {
        "fill-color"?: string;
        "fill-opacity"?: number;
    };
};
