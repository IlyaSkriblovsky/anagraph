import { DrawContext, FillArea } from "../worker-types";
import { Bounds, Rect } from "../../basic-types";
import { visualDownsample } from "../../downsample";
import { transformDataToDrawAreaCoord } from "./draw-utils";

export function drawFillArea(drawContext: DrawContext, fillAreaAttrs: FillArea, xBounds: Bounds, drawArea: Rect) {
    const { points, yBounds, fillColor, borderWidth, borderColor } = fillAreaAttrs;

    const { ctx, devicePixelRatio } = drawContext;

    const pointsX = points.map(([x]) => x);

    const minVisibleX = Math.min(...pointsX);
    const maxVisibleX = Math.max(...pointsX);

    const areaWidth = maxVisibleX - minVisibleX;

    const xBoundsWithDoubleAreaWidth: readonly [number, number] = [xBounds[0] - areaWidth, xBounds[1] + areaWidth];

    const [downX, downY] = visualDownsample(points, xBoundsWithDoubleAreaWidth, drawArea.width);

    if (downX.length === 0) return;

    transformDataToDrawAreaCoord(xBounds, yBounds, drawArea, downX, downY);

    ctx.lineWidth = (borderWidth ?? 2) * devicePixelRatio;
    ctx.lineCap = "square";
    ctx.lineJoin = "bevel";
    ctx.strokeStyle = borderColor ?? "rgba(255, 255, 255, 0.2)";
    ctx.fillStyle = fillColor;

    ctx.beginPath();

    for (let i = 0; i < downX.length; i++) {
        const x = downX[i];
        const y = downY[i];

        if (y == null) {
            continue;
        }

        ctx.lineTo(x, y);
    }

    ctx.closePath();

    ctx.fill();

    if (borderWidth) {
        ctx.stroke();
    }
}
