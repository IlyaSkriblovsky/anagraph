import { Bounds } from "../basic-types";
import { ChartSettings } from "../settings-types";
import { BottomStatus, FillArea, Id, LineInfo, VerticalFilling } from "./worker-types";

export type MainToWorkerMessage =
    | SetCanvasMessage
    | SetCanvasSizeMessage
    | SetXBoundsAndRedrawMessage
    | SetChartSettingsMessage
    | EditObjectMessages<"Line", LineInfo>
    | EditObjectMessages<"VerticalFilling", VerticalFilling>
    | EditObjectMessages<"BottomStatus", BottomStatus>
    | EditObjectMessages<"FillArea", FillArea>;

export type WorkerToMainMessage = StatsReportMessage;

interface StatsReportMessage {
    type: "statsReport";
    fps: number;
}

export function statsReportMessage(fps: number): StatsReportMessage {
    return { type: "statsReport", fps };
}

interface SetCanvasMessage {
    type: "setCanvas";
    canvas?: OffscreenCanvas | HTMLCanvasElement;
    devicePixelRatio: number;
}

export function setCanvasMessage(
    canvas: OffscreenCanvas | HTMLCanvasElement | undefined,
    devicePixelRatio: number,
): SetCanvasMessage {
    return { type: "setCanvas", canvas, devicePixelRatio };
}

interface SetCanvasSizeMessage {
    type: "setCanvasSize";
    width: number;
    height: number;
}

export function setCanvasSizeMessage(width: number, height: number): SetCanvasSizeMessage {
    return { type: "setCanvasSize", width, height };
}

interface SetXBoundsAndRedrawMessage {
    type: "setXBoundsAndRedraw";
    xBounds: Bounds;
}

export function setXBoundsAndRedrawMessage(xBounds: Bounds): SetXBoundsAndRedrawMessage {
    return { type: "setXBoundsAndRedraw", xBounds };
}

interface SetChartSettingsMessage {
    type: "setChartSettings";
    chartSettings: ChartSettings;
}

export function setChartSettingsMessage(chartSettings: ChartSettings): SetChartSettingsMessage {
    return { type: "setChartSettings", chartSettings };
}

interface AddObjectMessage<K extends string, O extends object> {
    type: `add${K}`;
    id: Id;
    attrs: O;
}

interface ChangeObjectMessage<K extends string, O extends object> {
    type: `change${K}`;
    id: Id;
    attrs: Partial<O>;
}

interface RemoveObjectMessage<K extends string> {
    type: `remove${K}`;
    id: Id;
}

export type EditObjectMessages<K extends string, O extends object> =
    | AddObjectMessage<K, O>
    | ChangeObjectMessage<K, O>
    | RemoveObjectMessage<K>;
export function isAddObjectMessage<K extends string, O extends object>(
    baseType: K,
    msg: EditObjectMessages<K, O>,
): msg is AddObjectMessage<K, O> {
    return msg.type === `add${baseType}`;
}
export function isChangeObjectMessage<K extends string, O extends object>(
    baseType: K,
    msg: EditObjectMessages<K, O>,
): msg is ChangeObjectMessage<K, O> {
    return msg.type === `change${baseType}`;
}
export function isRemoveObjectMessage<K extends string, O extends object>(
    baseType: K,
    msg: EditObjectMessages<K, O>,
): msg is RemoveObjectMessage<K> {
    return msg.type === `remove${baseType}`;
}
export function isEditObjectMessage(
    baseType: "Line",
    msg: MainToWorkerMessage,
): msg is EditObjectMessages<"Line", LineInfo>;
export function isEditObjectMessage(
    baseType: "VerticalFilling",
    msg: MainToWorkerMessage,
): msg is EditObjectMessages<"VerticalFilling", VerticalFilling>;
export function isEditObjectMessage(
    baseType: "BottomStatus",
    msg: MainToWorkerMessage,
): msg is EditObjectMessages<"BottomStatus", VerticalFilling>;
export function isEditObjectMessage(
    baseType: "FillArea",
    msg: MainToWorkerMessage,
): msg is EditObjectMessages<"FillArea", FillArea>;
export function isEditObjectMessage<K extends string, O extends object>(
    baseType: K,
    msg: MainToWorkerMessage,
): boolean {
    const editMsg = msg as EditObjectMessages<K, O>;
    return (
        isAddObjectMessage(baseType, editMsg) ||
        isChangeObjectMessage(baseType, editMsg) ||
        isRemoveObjectMessage(baseType, editMsg)
    );
}
