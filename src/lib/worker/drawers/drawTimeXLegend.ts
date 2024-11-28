import { DrawContext } from "../worker-types";
import { LegendSettings } from "../../settings-types";
import { Bounds, Rect } from "../../basic-types";
import { generateTimeTicks, scale } from "../../utils";
import { timeXLabel } from "../labels";

export function drawTimeXLegend(
    drawContext: DrawContext,
    legendSettings: LegendSettings,
    xBounds: Bounds,
    xLegendArea: Rect,
) {
    const { ctx, devicePixelRatio: dpr } = drawContext;

    ctx.save();
    ctx.fillStyle = legendSettings.labels.color;
    ctx.textBaseline = "top";
    ctx.font = `${legendSettings.labels.fontStyle} ${legendSettings.labels.fontSize * dpr}px ${
        legendSettings.labels.fontFamily
    }`;

    const sampleSize = ctx.measureText("00.00.0001"); // for not set start time on left corner of x-axis
    const bulletRadiusDpr = legendSettings.bulletRadius * dpr;

    let prevX: number | null = null;

    for (const x of generateTimeTicks(
        xBounds,
        xLegendArea.width,
        (sampleSize.width / xLegendArea.width) * (xBounds[1] - xBounds[0]) * 1.1,
    )) {
        const xpx = Math.round(scale(x, xBounds, [xLegendArea.x, xLegendArea.x + xLegendArea.width]));
        ctx.beginPath();
        ctx.ellipse(xpx, xLegendArea.y, bulletRadiusDpr, bulletRadiusDpr, 0, 0, 2 * Math.PI);
        ctx.fill();

        const text = timeXLabel(x, prevX);
        prevX = x;

        let y = xLegendArea.y + legendSettings.x.gap * dpr;
        for (let i = 0, len = text.length; i < len; i++) {
            const line = text[i];
            const measure: TextMetrics = ctx.measureText(line);
            ctx.fillText(line, xpx - measure.width / 2, y);
            y += measure.fontBoundingBoxAscent + measure.fontBoundingBoxDescent;
        }
    }
    ctx.restore();
}
