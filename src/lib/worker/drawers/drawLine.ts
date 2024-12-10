import { DrawContext, LineInfo } from "../worker-types";
import { Bounds, Rect } from "../../basic-types";
import { visualDownsample } from "../../downsample";

export function drawLine(drawContext: DrawContext, lineAttrs: LineInfo, xBounds: Bounds, drawArea: Rect) {
    const {
        color,
        lineWidth,
        points,
        yBounds: [yMin, yMax],
        isFill,
        fillColor,
    } = lineAttrs;

    const { ctx, devicePixelRatio, canvas } = drawContext;

    const [downX, downY] = visualDownsample(points, xBounds, drawArea.width);

    if (downX.length === 0) return;

    ctx.lineWidth = lineWidth * devicePixelRatio;
    ctx.lineCap = "square";
    ctx.lineJoin = "bevel";
    ctx.strokeStyle = color;
    ctx.fillStyle = fillColor ?? color;

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

    ctx.beginPath();
    let penDown: boolean = false;
    let startX: number | null = null;

    function fillPath(startX: number, endX: number) {
        ctx.stroke();
        ctx.lineTo(endX, canvas.height);
        ctx.lineTo(startX, canvas.height);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
    }

    for (let i = 0; i < downX.length; i++) {
        const x = downX[i];
        const y = downY[i];

        if (!startX && y) {
            startX = x;
        }

        if (y == null) {
            if (isFill && startX) {
                const endX = downX[i - 1];
                fillPath(startX, endX);
                startX = null;
            }

            penDown = false;
            continue;
        }
        if (!penDown) {
            ctx.moveTo(x, y);
            penDown = true;
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
    if (isFill && startX) {
        const endX = downX[downX.length - 1];
        fillPath(startX, endX);
    }
}
