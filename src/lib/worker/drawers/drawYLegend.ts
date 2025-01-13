import { DrawContext } from "../worker-types";
import { LegendSettings } from "../../settings-types";
import { Bounds, Rect } from "../../basic-types";
import { generateTicks, scale } from "../../utils";
import { yLabel } from "../labels";

export function drawYLegend(drawContext: DrawContext, legendSettings: LegendSettings, yBounds: Bounds, drawArea: Rect) {
    const { ctx, devicePixelRatio: dpr } = drawContext;

    ctx.save();
    ctx.fillStyle = legendSettings.labels.color;
    ctx.font = `${legendSettings.labels.fontStyle} ${legendSettings.labels.fontSize * dpr}px ${
        legendSettings.labels.fontFamily
    }`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    const bulletRadiusDpr = legendSettings.bulletRadius * dpr;

    for (const y of generateTicks(
        yBounds,
        drawArea.height,
        legendSettings.y.minHeight,
        legendSettings.labels.fontSize,
    )) {
        const ypx = Math.round(scale(y, yBounds, [drawArea.y + drawArea.height, drawArea.y]));
        ctx.beginPath();
        ctx.ellipse(drawArea.x, ypx, bulletRadiusDpr, bulletRadiusDpr, 0, 0, 2 * Math.PI);
        ctx.fill();

        const text = yLabel(y);
        const x = drawArea.x - legendSettings.y.gap * dpr;
        ctx.fillText(text, x, ypx);
    }
    ctx.restore();
}
