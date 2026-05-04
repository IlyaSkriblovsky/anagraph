import { DrawContext } from "../worker-types";
import { GridLineSettings } from "../../settings-types";
import { Bounds, Rect } from "../../basic-types";
import { generateTicks, scale } from "../../utils";

export function drawYGrid(
    drawContext: DrawContext,
    minYLegendHeight: number,
    minYEdgeHeight: number,
    lineSettings: GridLineSettings,
    yBounds: Bounds,
    drawArea: Rect,
) {
    const { color, lineWidth } = lineSettings;

    const { ctx } = drawContext;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    for (const y of generateTicks(yBounds, drawArea.height, minYLegendHeight, minYEdgeHeight)) {
        const ypx = Math.round(scale(y, yBounds, [drawArea.y + drawArea.height, drawArea.y])) + 0.5;
        ctx.beginPath();
        ctx.moveTo(drawArea.x, ypx);
        ctx.lineTo(drawArea.x + drawArea.width, ypx);
        ctx.stroke();
    }
    ctx.restore();
}
