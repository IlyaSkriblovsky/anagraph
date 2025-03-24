import {
    EditObjectMessages,
    isAddObjectMessage,
    isChangeObjectMessage,
    isEditObjectMessage,
    isRemoveObjectMessage,
    MainToWorkerMessage,
    statsReportMessage,
    WorkerToMainMessage,
} from "./messages";
import { assertNever } from "../utils";
import { defaultChartSettings } from "../settings-types";
import { BottomStatus, ChartInfo, DrawContext, FillArea, Id, LineInfo, VerticalFilling } from "./worker-types";
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

export interface CanvasHandler {
    handleMainToWorkerMessage(msg: MainToWorkerMessage): void;
    startSendingFps(): void;
    stopSendingFps(): void;
}

export function createCanvasHandler(sendWorkerToMain: (msg: WorkerToMainMessage) => void): CanvasHandler {
    let drawContext: DrawContext | null = null;

    const chartInfo: ChartInfo = {
        settings: defaultChartSettings,
        xBounds: [0, 1],
        lines: new Map<Id, LineInfo>(),
        verticalFillings: new Map<Id, VerticalFilling>(),
        bottomStatuses: new Map<Id, BottomStatus>(),
        fillAreas: new Map<Id, FillArea>(),
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

    function handleMainToWorkerMessage(msg: MainToWorkerMessage) {
        if (chartInfo.settings._verbose) {
            console.log(
                "WORKER MSG",
                msg.type,
                msg.type.startsWith("change")
                    ? Object.keys((msg as unknown as any).attrs ?? {})
                    : msg.type === "setXBoundsAndRedraw"
                    ? msg
                    : undefined,
            );
        }
        switch (msg.type) {
            case "setCanvas": {
                const { canvas, devicePixelRatio } = msg;
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
                    drawContext.devicePixelRatio = msg.devicePixelRatio;
                }
                planRedraw();
                return;
            }

            case "setCanvasSize": {
                if (drawContext) {
                    drawContext.canvas.width = msg.width;
                    drawContext.canvas.height = msg.height;
                    planRedraw();
                }
                return;
            }

            case "setXBoundsAndRedraw": {
                chartInfo.xBounds = msg.xBounds;
                planRedraw();
                return;
            }

            case "setChartSettings": {
                chartInfo.settings = msg.chartSettings;
                return;
            }
        }

        if (isEditObjectMessage("Line", msg)) {
            if (handleObjectMessages("Line", msg, chartInfo.lines)) {
                planRedraw();
            }
            return;
        }
        if (isEditObjectMessage("VerticalFilling", msg)) {
            if (handleObjectMessages("VerticalFilling", msg, chartInfo.verticalFillings)) {
                planRedraw();
            }
            return;
        }
        if (isEditObjectMessage("BottomStatus", msg)) {
            if (handleObjectMessages("BottomStatus", msg, chartInfo.bottomStatuses)) {
                planRedraw();
            }
            return;
        }
        if (isEditObjectMessage("FillArea", msg)) {
            if (handleObjectMessages("FillArea", msg, chartInfo.fillAreas)) {
                planRedraw();
            }
            return;
        }

        assertNever(msg);
    }

    function sendFps() {
        const now = new Date().getTime();
        const fps = (framesDrawn / (now - lastDrawTime)) * 1e3;
        lastDrawTime = now;
        framesDrawn = 0;
        sendWorkerToMain(statsReportMessage(fps));
    }

    let fpsTimer: ReturnType<typeof setInterval> | null = null;
    function startSendingFps() {
        fpsTimer = setInterval(() => {
            sendFps();
        }, 1e3);
    }
    function stopSendingFps() {
        if (fpsTimer) {
            clearInterval(fpsTimer);
            fpsTimer = null;
        }
    }

    return {
        handleMainToWorkerMessage,
        startSendingFps,
        stopSendingFps,
    };
}

export function startWorker(): void {
    // This functions should be call from inside the Web Worker
    const handler = createCanvasHandler((msg) => global.postMessage(msg));
    handler.startSendingFps();
    addEventListener("message", (event) => handler.handleMainToWorkerMessage(event.data));
}
