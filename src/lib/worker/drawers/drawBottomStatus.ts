import { BottomStatus, DrawContext } from "../worker-types";
import { Bounds, Rect } from "../../basic-types";
import { LegendSettings } from "../../settings-types";

export function drawBottomStatusYLegend(
    drawContext: DrawContext,
    bottomStatusAttrs: BottomStatus,
    legendSettings: LegendSettings,
    yLegendArea: Rect,
) {
    const { ctx } = drawContext;
    const { color } = bottomStatusAttrs;

    ctx.fillStyle = color;
    ctx.beginPath();
    const radius = Math.min(yLegendArea.width, yLegendArea.height) / 2;
    ctx.ellipse(
        yLegendArea.x + yLegendArea.width - legendSettings.y.gap - radius,
        yLegendArea.y + yLegendArea.height / 2,
        radius,
        radius,
        0,
        0,
        2 * Math.PI,
    );
    ctx.fill();
}

export function drawBottomStatus(
    drawContext: DrawContext,
    bottomStatusAttrs: BottomStatus,
    xBounds: Bounds,
    drawX1: number,
    drawX2: number,
    drawY: number,
    drawHeight: number,
) {
    const { ctx } = drawContext;
    const { intervals, color } = bottomStatusAttrs;

    if (intervals.length === 0) return;

    const [xMin, xMax] = xBounds;

    const multiplier = (drawX2 - drawX1) / (xMax - xMin);

    ctx.fillStyle = color;

    for (const [x1, x2] of intervals) {
        const t1 = Math.round((x1 - xMin) * multiplier + drawX1);
        const t2 = Math.round((x2 - xMin) * multiplier + drawX1);
        const width = Math.max(t2 - t1, 1);

        // FIXME: optimize this by skipping drawing if the filling is outside of the plot area
        // FIXME #2: maybe optimize this by using binary search to find the first interval that is inside the plot area
        ctx.fillRect(t1, drawY, width, drawHeight);
    }
}
