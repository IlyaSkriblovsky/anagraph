import { Bounds, Rect } from "../../basic-types";

export function transformDataToDrawAreaCoord(
    xBounds: Bounds,
    yBounds: Bounds,
    drawArea: Rect,
    downX: number[],
    downY: (number | null)[],
) {
    const [xMin, xMax] = xBounds;
    const [yMin, yMax] = yBounds;

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
}
