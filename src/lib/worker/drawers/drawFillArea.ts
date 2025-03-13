import { DrawContext, FillArea, LineInfo } from "../worker-types";
import { Bounds, Rect } from "../../basic-types";
import { visualDownsample } from "../../downsample";

export function drawFillArea(drawContext: DrawContext, fillAreaAttrs: FillArea, xBounds: Bounds, drawArea: Rect) {
    const {
        points,
        yBounds: [yMin, yMax],
        fillColor,
        borderWidth,
        borderColor,
    } = fillAreaAttrs;

    const { ctx, devicePixelRatio } = drawContext;

    const pointsX = points.map(([x]) => x);

    const minVisibleX = Math.min(...pointsX);
    const maxVisibleX = Math.max(...pointsX);

    const areaWidth = maxVisibleX - minVisibleX;

    const xBoundsWithDoubleAreaWidth: readonly [number, number] = [xBounds[0] - areaWidth, xBounds[1] + areaWidth];

    const [downX, downY] = visualDownsample(points, xBoundsWithDoubleAreaWidth, drawArea.width);

    if (downX.length === 0) return;

    const [xMin, xMax] = xBounds;
    const { x: gridRectX, y: gridRectY, width: gridRectWidth, height: gridRectHeight } = drawArea;
    const gridBottom = gridRectY + gridRectHeight;
    const gridWidthDivXBounds = gridRectWidth / (xMax - xMin);
    const gridHeightDivYBounds = gridRectHeight / (yMax - yMin);
    // Math.round() is here because canvas is faster with integer coordinates
    for (let i = 0, len = downX.length; i < len; i++) {
        downX[i] = Math.round((downX[i] - xMin) * gridWidthDivXBounds + gridRectX);
    }
    for (let i = 0, len = downY.length; i < len; i++) {
        const y = downY[i];
        downY[i] = y == null ? null : Math.round(gridBottom - (y - yMin) * gridHeightDivYBounds);
    }

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

    if (borderWidth) {
        ctx.stroke();
    }

    ctx.fill();
}
