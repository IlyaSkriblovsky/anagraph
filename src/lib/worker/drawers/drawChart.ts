import { ChartInfo, DrawContext } from "../worker-types";
import { Rect } from "../../basic-types";
import { drawTimeXGrid } from "./drawTimeXGrid";
import { drawYGrid } from "./drawYGrid";
import { drawTimeXLegend } from "./drawTimeXLegend";
import { drawYLegend } from "./drawYLegend";
import { drawLine } from "./drawLine";
import { drawVerticalFilling } from "./drawVerticalFilling";
import { drawBottomStatus, drawBottomStatusYLegend } from "./drawBottomStatus";
import { calcBottomStatusesAreaCpx, calcXGridAreaCpx, calcXLegendAreaCpx, calcYGridAreaCpx } from "../../layout-utils";
import { drawFillArea } from "./drawFillArea";

export function drawChart(drawContext: DrawContext, chartInfo: ChartInfo) {
    const t1 = new Date().getTime();
    if (chartInfo.settings._verbose) {
        console.groupCollapsed("drawChart", chartInfo.bottomStatuses.size);
        console.log("drawContext.canvas.height", drawContext.canvas.height);
        console.log("chartInfo.lines.size", chartInfo.lines.size);
        console.log("chartInfo.verticalFillings.size", chartInfo.verticalFillings.size);
        console.log("chartInfo.bottomStatuses.size", chartInfo.bottomStatuses.size);
        console.groupEnd();
    }

    const { settings, lines, verticalFillings, xBounds } = chartInfo;

    const { canvas, ctx, devicePixelRatio: dpr } = drawContext;
    const { width, height } = canvas;

    if (settings.background == null || settings.background === "transparent") {
        ctx.clearRect(0, 0, width, height);
    } else {
        ctx.fillStyle = settings.background;
        ctx.fillRect(0, 0, width, height);
    }

    const xGridArea = calcXGridAreaCpx({ width, height }, settings, dpr);
    const yGridArea: Rect = calcYGridAreaCpx({ width, height }, settings, dpr, chartInfo.bottomStatuses.size);

    if (settings.grid.background != null && settings.grid.background !== "transparent") {
        ctx.fillStyle = settings.grid.background;
        ctx.fillRect(xGridArea.x, xGridArea.y, xGridArea.width, xGridArea.height);
    }
    if (settings.grid.x.draw) {
        drawTimeXGrid(drawContext, settings.grid.lines, settings.legend.labels, xBounds, xGridArea);
    }
    if (settings.grid.y.draw) {
        drawYGrid(drawContext, settings.legend.y.minHeight, settings.grid.lines, settings.grid.y.bounds, yGridArea);
    }

    if (settings.grid.outline.draw) {
        ctx.strokeStyle = settings.grid.outline.color;
        ctx.lineWidth = settings.grid.outline.lineWidth;
        ctx.strokeRect(
            Math.floor(xGridArea.x) + 0.5,
            Math.floor(xGridArea.y) + 0.5,
            Math.ceil(xGridArea.width),
            Math.ceil(xGridArea.height),
        );
    }

    if (settings.legend.x.draw) {
        const xLegendArea = calcXLegendAreaCpx({ width, height }, settings, dpr);
        drawTimeXLegend(drawContext, settings.legend, chartInfo.xBounds, xLegendArea);
    }
    if (settings.legend.y.draw) {
        drawYLegend(drawContext, settings.legend, settings.grid.y.bounds, yGridArea);
    }

    ctx.save();
    let clipPath = new Path2D();
    clipPath.rect(yGridArea.x, yGridArea.y, yGridArea.width, yGridArea.height);
    ctx.clip(clipPath);
    for (const fillAreaAttrs of chartInfo.fillAreas.values()) {
        drawFillArea(drawContext, fillAreaAttrs, chartInfo.xBounds, yGridArea);
    }
    for (const fillingAttrs of verticalFillings.values()) {
        drawVerticalFilling(drawContext, fillingAttrs, xBounds, yGridArea);
    }
    for (const lineAttrs of lines.values()) {
        drawLine(drawContext, lineAttrs, xBounds, yGridArea);
    }
    ctx.restore();

    const bottomStatusArea = calcBottomStatusesAreaCpx({ width, height }, settings, dpr, chartInfo.bottomStatuses.size);

    let y = bottomStatusArea.y;
    for (const bottomStatusAttrs of chartInfo.bottomStatuses.values()) {
        drawBottomStatusYLegend(drawContext, bottomStatusAttrs, settings.legend, {
            x: 0,
            y,
            width: settings.legend.y.width * dpr,
            height: settings.bottomStatuses.eachHeight * dpr,
        });
        y += (settings.bottomStatuses.eachHeight + settings.bottomStatuses.gap) * dpr;
    }

    ctx.save();
    clipPath = new Path2D();
    clipPath.rect(bottomStatusArea.x, bottomStatusArea.y, bottomStatusArea.width, bottomStatusArea.height);
    ctx.clip(clipPath);
    y = bottomStatusArea.y;
    for (const bottomStatusAttrs of chartInfo.bottomStatuses.values()) {
        drawBottomStatus(
            drawContext,
            bottomStatusAttrs,
            xBounds,
            bottomStatusArea.x,
            bottomStatusArea.x + bottomStatusArea.width,
            y,
            settings.bottomStatuses.eachHeight * dpr,
        );
        y += (settings.bottomStatuses.eachHeight + settings.bottomStatuses.gap) * dpr;
    }
    ctx.restore();

    if (chartInfo.settings._verbose) {
        const t2 = new Date().getTime();
        console.log("WORKER drawn in ms:", t2 - t1);
    }
}
