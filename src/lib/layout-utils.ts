import {divSize, mulRect, Rect, Size} from "./basic-types";
import {ChartSettings} from "./settings-types";

export function calcManipulationAreaLpx(canvasSizeLpx: Size, chartSettings: ChartSettings): Rect {
    return {
        x: chartSettings.legend.y.width,
        y: chartSettings.topGap,
        width: canvasSizeLpx.width - chartSettings.legend.y.width,
        height: canvasSizeLpx.height - chartSettings.topGap - chartSettings.legend.x.height,
    };
}

export function calcYGridAreaLpx(canvasSizeLpx: Size, chartSettings: ChartSettings, bottomStatusCount: number): Rect {
    return {
        x: chartSettings.legend.y.width,
        y: chartSettings.topGap,
        width: canvasSizeLpx.width - chartSettings.legend.y.width,
        height:
            canvasSizeLpx.height -
            chartSettings.topGap -
            chartSettings.legend.x.height -
            (chartSettings.bottomStatuses.eachHeight + chartSettings.bottomStatuses.gap) * bottomStatusCount -
            (bottomStatusCount > 0
                ? chartSettings.bottomStatuses.topMargin +
                chartSettings.bottomStatuses.bottomMargin -
                chartSettings.bottomStatuses.gap
                : 0),
    };
}

export function calcYGridAreaCpx(
    canvasSizeCpx: Size,
    chartSettings: ChartSettings,
    devicePixelRatio: number,
    bottomStatusCount: number,
): Rect {
    const lpx = calcYGridAreaLpx(divSize(canvasSizeCpx, devicePixelRatio), chartSettings, bottomStatusCount);
    return mulRect(lpx, devicePixelRatio);
}

export function calcXGridAreaLpx(canvasSizeLpx: Size, chartSettings: ChartSettings): Rect {
    return {
        x: chartSettings.legend.y.width,
        y: chartSettings.topGap,
        width: canvasSizeLpx.width - chartSettings.legend.y.width - chartSettings.grid.outline.lineWidth,
        height: canvasSizeLpx.height - chartSettings.topGap - chartSettings.legend.x.height,
    };
}

export function calcXGridAreaCpx(canvasSizeCpx: Size, chartSettings: ChartSettings, devicePixelRatio: number): Rect {
    const lpx = calcXGridAreaLpx(divSize(canvasSizeCpx, devicePixelRatio), chartSettings);
    return mulRect(lpx, devicePixelRatio);
}

export function calcBottomStatusesAreaLpx(
    canvasSizeLpx: Size,
    chartSettings: ChartSettings,
    bottomStatusCount: number,
): Rect {
    return {
        x: chartSettings.legend.y.width,
        y:
            canvasSizeLpx.height -
            chartSettings.legend.x.height -
            chartSettings.bottomStatuses.bottomMargin +
            chartSettings.bottomStatuses.gap -
            (chartSettings.bottomStatuses.eachHeight + chartSettings.bottomStatuses.gap) * bottomStatusCount,
        width: canvasSizeLpx.width - chartSettings.legend.y.width,
        height:
            (chartSettings.bottomStatuses.eachHeight + chartSettings.bottomStatuses.gap) * bottomStatusCount -
            chartSettings.bottomStatuses.gap,
    };
}

export function calcBottomStatusesAreaCpx(
    canvasSizeCpx: Size,
    chartSettings: ChartSettings,
    devicePixelRatio: number,
    bottomStatusCount: number,
): Rect {
    const lpx = calcBottomStatusesAreaLpx(divSize(canvasSizeCpx, devicePixelRatio), chartSettings, bottomStatusCount);
    return mulRect(lpx, devicePixelRatio);
}

export function calcXLegendAreaLpx(canvasSizeLpx: Size, chartSettings: ChartSettings): Rect {
    return {
        x: chartSettings.legend.y.width,
        y: canvasSizeLpx.height - chartSettings.legend.x.height,
        width: canvasSizeLpx.width - chartSettings.legend.y.width,
        height: chartSettings.legend.x.height,
    };
}

export function calcXLegendAreaCpx(canvasSizeCpx: Size, chartSettings: ChartSettings, devicePixelRatio: number): Rect {
    const lpx = calcXLegendAreaLpx(divSize(canvasSizeCpx, devicePixelRatio), chartSettings);
    return mulRect(lpx, devicePixelRatio);
}
