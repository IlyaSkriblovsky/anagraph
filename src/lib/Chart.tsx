import React, {
    createContext,
    CSSProperties,
    forwardRef,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from "react";
import { useWorkerCreator } from "./WorkerCreatorContext";
import {
    MainToWorkerMessage,
    setCanvasMessage,
    setCanvasSizeMessage,
    setChartSettingsMessage,
    setXBoundsAndRedrawMessage,
    WorkerToMainMessage,
} from "./worker/messages";
import { useDeepCompareEffect, useLatest, useUnmount } from "react-use";
import { useBoundsContext } from "./BoundsManager";
import { Manipulator } from "./Manipulator";
import { DeepPartial, noop } from "ts-essentials";
import deepmerge from "deepmerge";
import { Bounds, divSize, Size } from "./basic-types";
import { ChartSettings, defaultChartSettings } from "./settings-types";
import { BottomStatus, Id, LineInfo, VerticalFilling } from "./worker/worker-types";
import { calcManipulationAreaLpx } from "./layout-utils";
import { createCanvasHandler } from "./worker";

interface ChartContextType {
    addLine(id: Id, lineInfo: LineInfo): void;
    changeLine(id: Id, lineInfo: Partial<LineInfo>): void;
    removeLine(id: Id): void;

    addVerticalFilling(id: Id, verticalFilling: VerticalFilling): void;
    changeVerticalFilling(id: Id, verticalFilling: Partial<VerticalFilling>): void;
    removeVerticalFilling(id: Id): void;

    addBottomStatus(id: Id, bottomStatus: BottomStatus): void;
    changeBottomStatus(id: Id, bottomStatus: Partial<BottomStatus>): void;
    removeBottomStatus(id: Id): void;
}

export const ChartContext = createContext<ChartContextType>({
    addLine: noop,
    changeLine: noop,
    removeLine: noop,

    addVerticalFilling: noop,
    changeVerticalFilling: noop,
    removeVerticalFilling: noop,

    addBottomStatus: noop,
    changeBottomStatus: noop,
    removeBottomStatus: noop,
});

export function useChartContext(): ChartContextType {
    return useContext(ChartContext);
}

interface ChartProps {
    className?: string;
    style?: CSSProperties;
    settings?: DeepPartial<ChartSettings>;

    children?: ReactNode | ReactNode[];

    onHover?: (x: number, event: PointerEvent) => void;
    onHoverEnd?: () => void;
    onTouchUp?: (x: number, event: PointerEvent) => void;
    onChangeBoundsEnd?: (bounds: Bounds) => void;
    onChangeBounds?: (bounds: Bounds) => void;
}

function arrayMergeOverwrite<T>(_: T[], sourceArray: T[]): T[] {
    return sourceArray;
}

interface CanvasWorkerSubset {
    postMessage(msg: MainToWorkerMessage, transfer?: Transferable[]): void;
    addEventListener(event: "message", handler: (msg: MessageEvent<WorkerToMainMessage>) => void): void;
    removeEventListener(event: "message", handler: (msg: MessageEvent<WorkerToMainMessage>) => void): void;
    terminate(): void;
}

function createFallbackPseudoWorker(): CanvasWorkerSubset {
    console.log("Anagraph: Warning: OffscreenCanvas is not supported, using single-threaded drawing code");
    const handler = createCanvasHandler((msg) => global.postMessage(msg));
    handler.startSendingFps();
    return {
        postMessage(msg: MainToWorkerMessage, transfer?: Transferable[]) {
            setTimeout(() => handler.handleMainToWorkerMessage(msg), 0);
        },
        addEventListener: global.addEventListener.bind(global),
        removeEventListener: global.removeEventListener.bind(global),
        terminate: () => {
            handler.stopSendingFps();
        },
    };
}
function useWorker(): CanvasWorkerSubset {
    const hasOffscreenSupport = HTMLCanvasElement.prototype.transferControlToOffscreen !== undefined;
    const workerCreator = useWorkerCreator();
    const worker = useMemo((): CanvasWorkerSubset => {
        if (hasOffscreenSupport) {
            return workerCreator();
        } else {
            return createFallbackPseudoWorker();
        }
    }, [hasOffscreenSupport]);
    useUnmount(() => worker.terminate());
    return worker;
}

function useCanvas(onResize: (sizeCpx: Size) => void) {
    const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

    const [canvasSizeCpx, setCanvasSizeCpx] = useState<Size>({ width: 100, height: 100 });

    const onCanvasResize = useCallback(
        function onCanvasResize(entries: ResizeObserverEntry[]) {
            if (canvas == null) return;

            const dpr = window.devicePixelRatio;
            const width = entries[0].contentBoxSize[0].inlineSize * dpr;
            const height = entries[0].contentBoxSize[0].blockSize * dpr;
            setCanvasSizeCpx({ width, height });
            onResize({ width, height });
        },
        [canvas, setCanvasSizeCpx, onResize],
    );

    const sizeObserver = useMemo(() => new ResizeObserver(onCanvasResize), [onCanvasResize]);
    useEffect(() => {
        if (canvas == null) return;
        sizeObserver.observe(canvas);
        return () => sizeObserver.unobserve(canvas);
    }, [canvas, sizeObserver]);

    return { canvas, setCanvas, canvasSizeCpx };
}

export interface ChartRef {
    xToPixelOffset(x: number): number | null;
    pixelOffsetToX(pixelOffset: number): number | null;
    setViewBounds(bounds: Bounds): void;
}

export const Chart = forwardRef<ChartRef, ChartProps>((props, ref) => {
    const { onHover, onHoverEnd, onTouchUp, onChangeBoundsEnd, onChangeBounds } = props;

    const worker = useWorker();

    const onCanvasResize = useCallback(
        (sizeCpx: Size) => worker.postMessage(setCanvasSizeMessage(sizeCpx.width, sizeCpx.height)),
        [worker],
    );

    const { canvas, setCanvas, canvasSizeCpx } = useCanvas(onCanvasResize);

    useEffect(() => {
        if (canvas == null) return;

        if (canvas.transferControlToOffscreen === undefined) {
            worker.postMessage(setCanvasMessage(canvas, window.devicePixelRatio));
            return;
        }

        const offscreenCanvas = canvas.transferControlToOffscreen();
        worker.postMessage(setCanvasMessage(offscreenCanvas, window.devicePixelRatio), [offscreenCanvas]);
    }, [canvas]);

    useEffect(() => {
        worker?.postMessage(setCanvasMessage(undefined, window.devicePixelRatio));
    }, [window.devicePixelRatio]);

    const effectiveSettings = useMemo(
        () =>
            deepmerge<ChartSettings, DeepPartial<ChartSettings>>(defaultChartSettings, props.settings ?? {}, {
                arrayMerge: arrayMergeOverwrite,
            }),
        [props.settings],
    );

    useDeepCompareEffect(() => {
        worker.postMessage(setChartSettingsMessage(effectiveSettings));
        sendRedraw.current();
    }, [worker, effectiveSettings]);

    const { getCurrentXBounds, addXBoundsCallback, removeXBoundsCallback, onManipulationEnd } = useBoundsContext();
    const sendRedraw = useRef(() => {
        worker.postMessage(setXBoundsAndRedrawMessage(getCurrentXBounds()));
    });
    useEffect(() => {
        addXBoundsCallback(sendRedraw.current);
        return () => removeXBoundsCallback(sendRedraw.current);
    }, []);

    const sendMessage = useCallback((message: MainToWorkerMessage) => worker.postMessage(message), [worker]);

    const [fps, setFps] = useState(0);
    useEffect(() => {
        const onMessage = (event: MessageEvent<WorkerToMainMessage>) => {
            if (event.data.type === "statsReport") {
                setFps(event.data.fps);
            }
        };
        worker.addEventListener("message", onMessage);
        return () => worker.removeEventListener("message", onMessage);
    }, [worker]);

    const chartContextValue = useMemo<ChartContextType>(
        () => ({
            addLine: (id, lineInfo) => sendMessage({ type: "addLine", id, attrs: lineInfo }),
            changeLine: (id, lineInfo) => sendMessage({ type: "changeLine", id, attrs: lineInfo }),
            removeLine: (id) => sendMessage({ type: "removeLine", id }),

            addVerticalFilling: (id, verticalFilling) =>
                sendMessage({ type: "addVerticalFilling", id, attrs: verticalFilling }),
            changeVerticalFilling: (id, verticalFilling) =>
                sendMessage({ type: "changeVerticalFilling", id, attrs: verticalFilling }),
            removeVerticalFilling: (id) => sendMessage({ type: "removeVerticalFilling", id }),

            addBottomStatus: (id, bottomStatus) => sendMessage({ type: "addBottomStatus", id, attrs: bottomStatus }),
            changeBottomStatus: (id, bottomStatus) =>
                sendMessage({ type: "changeBottomStatus", id, attrs: bottomStatus }),
            removeBottomStatus: (id) => sendMessage({ type: "removeBottomStatus", id }),
        }),
        [worker],
    );

    const gridAreaLpx = useMemo(
        () => calcManipulationAreaLpx(divSize(canvasSizeCpx, window.devicePixelRatio), effectiveSettings),
        [canvasSizeCpx, effectiveSettings],
    );
    const latestGridAreaLpx = useLatest(gridAreaLpx);

    useImperativeHandle(
        ref,
        (): ChartRef => ({
            xToPixelOffset: (x: number) => {
                const xBounds = getCurrentXBounds();
                if (x < xBounds[0] || x > xBounds[1]) {
                    return null;
                }

                const percent = (x - xBounds[0]) / (xBounds[1] - xBounds[0]);
                return latestGridAreaLpx.current.x + percent * latestGridAreaLpx.current.width;
            },
            pixelOffsetToX: (pixelOffset: number) => {
                const xBounds = getCurrentXBounds();
                const gridAreaX = latestGridAreaLpx.current.x;
                const gridAreaWidth = latestGridAreaLpx.current.width;

                if (pixelOffset < gridAreaX || pixelOffset > gridAreaX + gridAreaWidth) {
                    return null;
                }

                const percent = (pixelOffset - gridAreaX) / gridAreaWidth;

                return xBounds[0] + percent * (xBounds[1] - xBounds[0]);
            },
            setViewBounds: (bounds: Bounds) => {
                onManipulationEnd(bounds);
                onChangeBoundsEnd?.(bounds);
                return;
            },
        }),
        [],
    );

    const isDevelopmentMode = process.env.NODE_ENV === "development";

    return (
        <div className={props.className} style={{ position: "relative", height: "350px", ...props.style }}>
            <canvas ref={setCanvas} style={{ width: "100%", height: "100%" }} />
            <Manipulator
                style={{
                    top: gridAreaLpx.y,
                    left: gridAreaLpx.x,
                    width: gridAreaLpx.width,
                    height: gridAreaLpx.height,
                }}
                onHover={onHover}
                onHoverEnd={onHoverEnd}
                onTouchUp={onTouchUp}
                onChangeBoundsEnd={onChangeBoundsEnd}
                onChangeBounds={onChangeBounds}
            />
            <ChartContext.Provider value={chartContextValue}>{props.children}</ChartContext.Provider>

            {isDevelopmentMode && fps !== 0 ? (
                <div
                    style={{
                        position: "absolute",
                        right: 0,
                        top: 0,
                        padding: "3px 6px",
                        background: "rgba(0,0,0,0.6)",
                        zIndex: 999,
                        color: "#fff",
                        borderRadius: "4px",
                        fontFamily: "monospace",
                    }}
                >
                    FPS: {fps.toFixed(1)}
                </div>
            ) : null}
        </div>
    );
});
