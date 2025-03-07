import {
    EditObjectMessages,
    isAddObjectMessage,
    isChangeObjectMessage,
    isEditObjectMessage,
    isRemoveObjectMessage,
    MainToWorkerMessage,
    statsReportMessage,
} from "./messages";
import { assertNever } from "../utils";
import { defaultChartSettings } from "../settings-types";
import { BottomStatus, ChartInfo, DrawContext, Id, LineInfo, VerticalFilling } from "./worker-types";
import { drawChart } from "./drawers/drawChart";

function handleObjectMessages<K extends string, O extends object>(
    baseType: K,
    msg: EditObjectMessages<K, O>,
    map: Map<Id, O>,
): boolean {
    if (isAddObjectMessage(baseType, msg)) {
        map.set(msg.id, msg.attrs);
        return true;
    } else if (isChangeObjectMessage(baseType, msg)) {
        const obj = map.get(msg.id);
        if (obj) {
            map.set(msg.id, { ...obj, ...msg.attrs });
            return true;
        }
    } else if (isRemoveObjectMessage(baseType, msg)) {
        map.delete(msg.id);
        return true;
    }
    return false;
}

export function startWorker() {
    let drawContext: DrawContext | null = null;

    const chartInfo: ChartInfo = {
        settings: defaultChartSettings,
        xBounds: [0, 1],
        lines: new Map<Id, LineInfo>(),
        verticalFillings: new Map<Id, VerticalFilling>(),
        bottomStatuses: new Map<Id, BottomStatus>(),
    };

    let framesDrawn = 0;
    let lastDrawTime = 0;
    let drawPlanned = false;
    function planRedraw() {
        if (drawPlanned) return;

        drawPlanned = true;
        requestAnimationFrame(() => {
            if (drawContext) {
                drawChart(drawContext, chartInfo);
                framesDrawn++;
            }
            drawPlanned = false;
        });
    }

    setInterval(() => {
        const now = new Date().getTime();
        const fps = (framesDrawn / (now - lastDrawTime)) * 1e3;
        lastDrawTime = now;
        framesDrawn = 0;
        postMessage(statsReportMessage(fps));
    }, 1e3);

    addEventListener("message", (msg: MessageEvent<MainToWorkerMessage>) => {
        if (chartInfo.settings._verbose) {
            console.log(
                "WORKER MSG",
                msg.data.type,
                msg.data.type.startsWith("change")
                    ? Object.keys((msg.data as unknown as any).attrs ?? {})
                    : msg.data.type === "setXBoundsAndRedraw"
                    ? msg.data
                    : undefined,
            );
        }
        switch (msg.data.type) {
            case "setCanvas": {
                const { canvas, devicePixelRatio } = msg.data;
                if (canvas) {
                    const ctx = canvas.getContext("2d", { desynchronized: true });
                    if (ctx) {
                        drawContext = {
                            canvas,
                            ctx,
                            devicePixelRatio,
                        };
                    } else {
                        drawContext = null;
                    }
                }
                if (drawContext) {
                    drawContext.devicePixelRatio = msg.data.devicePixelRatio;
                }
                planRedraw();
                return;
            }

            case "setCanvasSize": {
                if (drawContext) {
                    drawContext.canvas.width = msg.data.width;
                    drawContext.canvas.height = msg.data.height;
                    planRedraw();
                }
                return;
            }

            case "setXBoundsAndRedraw": {
                chartInfo.xBounds = msg.data.xBounds;
                planRedraw();
                return;
            }

            case "setChartSettings": {
                chartInfo.settings = msg.data.chartSettings;
                return;
            }
        }

        if (isEditObjectMessage("Line", msg.data)) {
            if (handleObjectMessages("Line", msg.data, chartInfo.lines)) {
                planRedraw();
            }
            return;
        }
        if (isEditObjectMessage("VerticalFilling", msg.data)) {
            if (handleObjectMessages("VerticalFilling", msg.data, chartInfo.verticalFillings)) {
                planRedraw();
            }
            return;
        }
        if (isEditObjectMessage("BottomStatus", msg.data)) {
            if (handleObjectMessages("BottomStatus", msg.data, chartInfo.bottomStatuses)) {
                planRedraw();
            }
            return;
        }

        assertNever(msg.data);
    });
}

export function createFallback(): Worker {
    let drawContext: DrawContext | null = null;

    const chartInfo: ChartInfo = {
        settings: defaultChartSettings,
        xBounds: [0, 1],
        lines: new Map<Id, LineInfo>(),
        verticalFillings: new Map<Id, VerticalFilling>(),
        bottomStatuses: new Map<Id, BottomStatus>(),
    };

    let framesDrawn = 0;
    let lastDrawTime = 0;
    let drawPlanned = false;
    function planRedraw() {
        if (drawPlanned) return;

        drawPlanned = true;
        requestAnimationFrame(() => {
            if (drawContext) {
                drawChart(drawContext, chartInfo);
                framesDrawn++;
            }
            drawPlanned = false;
        });
    }

    setInterval(() => {
        const now = new Date().getTime();
        const fps = (framesDrawn / (now - lastDrawTime)) * 1e3;
        lastDrawTime = now;
        framesDrawn = 0;
        postMessage(statsReportMessage(fps));
    }, 1e3);

    const fu = (msg: MessageEvent<MainToWorkerMessage>) => {
        if (chartInfo.settings._verbose) {
            console.log(
                "WORKER MSG",
                msg.data.type,
                msg.data.type.startsWith("change")
                    ? Object.keys((msg.data as unknown as any).attrs ?? {})
                    : msg.data.type === "setXBoundsAndRedraw"
                    ? msg.data
                    : undefined,
            );
        }

        if (!msg?.data?.type) {
            return;
        }

        switch (msg.data.type) {
            case "setCanvas": {
                const { canvas, devicePixelRatio } = msg.data;
                if (canvas) {
                    const ctx = canvas.getContext("2d", { desynchronized: true });
                    if (ctx) {
                        drawContext = {
                            canvas,
                            ctx,
                            devicePixelRatio,
                        };
                    } else {
                        drawContext = null;
                    }
                }
                if (drawContext) {
                    drawContext.devicePixelRatio = msg.data.devicePixelRatio;
                }
                planRedraw();
                return;
            }

            case "setCanvasSize": {
                if (drawContext) {
                    drawContext.canvas.width = msg.data.width;
                    drawContext.canvas.height = msg.data.height;
                    planRedraw();
                }
                return;
            }

            case "setXBoundsAndRedraw": {
                chartInfo.xBounds = msg.data.xBounds;
                planRedraw();
                return;
            }

            case "setChartSettings": {
                chartInfo.settings = msg.data.chartSettings;
                return;
            }
        }

        if (isEditObjectMessage("Line", msg.data)) {
            if (handleObjectMessages("Line", msg.data, chartInfo.lines)) {
                planRedraw();
            }
            return;
        }
        if (isEditObjectMessage("VerticalFilling", msg.data)) {
            if (handleObjectMessages("VerticalFilling", msg.data, chartInfo.verticalFillings)) {
                planRedraw();
            }
            return;
        }
        if (isEditObjectMessage("BottomStatus", msg.data)) {
            if (handleObjectMessages("BottomStatus", msg.data, chartInfo.bottomStatuses)) {
                planRedraw();
            }
            return;
        }

        assertNever(msg.data);
    };

    return {
        postMessage(data) {
            setTimeout(() => {
                // @ts-ignore
                fu({ data: data, type: data.type });
            }, 0);
        },
        onmessage: null,
        terminate() {
            console.debug("terminate");
        },
        addEventListener<K extends keyof WorkerEventMap>(
            type: K,
            listener: (this: Worker, ev: WorkerEventMap[K]) => any,
            options?: boolean | AddEventListenerOptions,
        ) {},
        removeEventListener<K extends keyof WorkerEventMap>(
            type: K,
            listener: (this: Worker, ev: WorkerEventMap[K]) => any,
            options?: boolean | EventListenerOptions,
        ) {},
    } as Worker;
}
