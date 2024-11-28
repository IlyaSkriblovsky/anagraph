import { DrawContext, VerticalFilling } from "../worker-types";
import { Bounds, Rect } from "../../basic-types";

export function drawVerticalFilling(
    drawContext: DrawContext,
    fillingAttrs: VerticalFilling,
    xBounds: Bounds,
    plotArea: Rect,
) {
    const { ctx } = drawContext;
    const { color, intervals } = fillingAttrs;

    if (intervals.length === 0) return;

    const [xMin, xMax] = xBounds;
    const { x: plotAreaX, y: plotAreaY, width: plotAreaW, height: plotAreaH } = plotArea;

    const gridWidthDivXBounds = plotAreaW / (xMax - xMin);

    ctx.fillStyle = color;

    for (const [x1, x2] of intervals) {
        const t1 = Math.round((x1 - xMin) * gridWidthDivXBounds + plotAreaX);
        const t2 = Math.round((x2 - xMin) * gridWidthDivXBounds + plotAreaX);
        const width = Math.max(t2 - t1, 1);

        // FIXME: optimize this by skipping drawing if the filling is outside of the plot area
        // FIXME #2: maybe optimize this by using binary search to find the first interval that is inside the plot area
        ctx.fillRect(t1, plotAreaY, width, plotAreaH);
    }
}
