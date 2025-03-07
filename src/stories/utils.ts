import AnagraphChartWorker from "./storybook-worker";
import { createFallback } from "../lib/index";

export function ts(year: number, month: number, day: number, hour: number = 0, minute: number = 0, second: number = 0) {
    return new Date(year, month, day, hour, minute, second).getTime();
}

export function getCreateWorkerOrFallback(): () => Worker {
    const isSupport = HTMLCanvasElement.prototype.transferControlToOffscreen !== undefined;

    if (!isSupport) {
        return () => createFallback();
    }

    return () => new AnagraphChartWorker();
}
