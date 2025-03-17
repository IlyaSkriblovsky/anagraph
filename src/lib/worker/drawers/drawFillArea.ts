import { DrawContext, FillArea } from "../worker-types";
import { Bounds, Rect } from "../../basic-types";
import { transformDataToDrawAreaCoord } from "./draw-utils";

export function drawFillArea(drawContext: DrawContext, fillAreaAttrs: FillArea, xBounds: Bounds, drawArea: Rect) {
    const { points, yBounds, fillColor, borderWidth, borderColor } = fillAreaAttrs;

    const { ctx, devicePixelRatio } = drawContext;

    const downX: number[] = [];
    const downY: number[] = [];

    for (let i = 0; i < points.length; i++) {
        downX.push(points[i][0]);
        downY.push(points[i][1]);
    }

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
