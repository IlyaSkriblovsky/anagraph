import { Bounds } from "./basic-types";

export interface LabelSettings {
    color: string;

    fontFamily: string;
    fontStyle: string;
    fontSize: number;
}

export interface GridLineSettings {
    lineWidth: number;
    color: string;
}

export interface LegendSettings {
    labels: LabelSettings;
    bulletRadius: number;
    x: {
        draw: boolean;
        height: number;
        gap: number;
    };
    y: {
        draw: boolean;
        width: number;
        gap: number;
        minHeight: 48;
    };
}

export interface ChartSettings {
    _verbose: boolean;
    background: string | null;
    legend: LegendSettings;
    grid: {
        x: { draw: boolean };
        y: { draw: boolean; bounds: Bounds };
        background: string | null;
        lines: GridLineSettings;
        outline: {
            draw: boolean;
            lineWidth: number;
            color: string;
        };
    };
    topGap: number;
    bottomStatuses: {
        topMargin: number;
        bottomMargin: number;
        eachHeight: number;
        gap: number;
    };
    boundsMinVisibleX?: number;
}

export const defaultChartSettings: ChartSettings = {
    _verbose: false,
    background: null,
    legend: {
        x: {
            draw: true,
            height: 42,
            gap: 6,
        },
        y: {
            draw: true,
            width: 60,
            gap: 8,
            minHeight: 48,
        },

        bulletRadius: 2,
        labels: {
            color: "#666699",

            fontFamily: "sans-serif",
            fontStyle: "normal",
            fontSize: 16,
        },
    },
    grid: {
        x: { draw: true },
        y: { draw: true, bounds: [0, 1] },
        background: null,
        lines: {
            color: "#cccccc",
            lineWidth: 1,
        },
        outline: {
            draw: true,
            color: "#cccccc",
            lineWidth: 1,
        },
    },
    topGap: 10,
    bottomStatuses: {
        topMargin: 10,
        bottomMargin: 10,
        eachHeight: 10,
        gap: 3,
    },
};
