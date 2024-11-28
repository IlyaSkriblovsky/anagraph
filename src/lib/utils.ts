import { useState } from "react";
import { Bounds, LineData } from "./basic-types";
import { Id } from "./worker/worker-types";

export function scale(value: number, oldBounds: Bounds, newBounds: Bounds): number {
    return ((value - oldBounds[0]) / (oldBounds[1] - oldBounds[0])) * (newBounds[1] - newBounds[0]) + newBounds[0];
}

export function generateRandomData([minx, maxx]: Bounds, [miny, maxy]: Bounds, n: number, index: number): LineData {
    const data = new Array(n);
    for (let i = 0; i < n; i++) {
        const x = minx + ((maxx - minx) / n) * i;
        const y = (Math.sin((i / n) * 100 + index * 2 + Math.random()) / 2.1 + 0.5) * (maxy - miny) + miny;
        data[i] = [x, y];
    }
    return data;
}

const log10_5 = Math.log10(5);
const log10_4 = Math.log10(4);
const log10_2 = Math.log10(2);

export function* generateTicks(range: Bounds, pixels: number, minPixels: number): Generator<number> {
    const xRange = range[1] - range[0];

    const targetXStepLog = Math.log10((xRange / pixels) * minPixels);
    let xStepLog = Math.ceil(targetXStepLog);
    if (xStepLog - targetXStepLog > log10_5) {
        xStepLog -= log10_5;
    } else if (xStepLog - targetXStepLog > log10_4) {
        xStepLog -= log10_4;
    } else if (xStepLog - targetXStepLog > log10_2) {
        xStepLog -= log10_2;
    }
    const xStep = Math.pow(10, xStepLog);

    const epsilon = 1.0001;

    const xMin = Math.ceil((range[0] * epsilon) / epsilon / xStep) * xStep;
    const xMax = Math.floor((range[1] * epsilon) / xStep) * xStep;

    for (let x = xMin; x <= xMax * epsilon; x += xStep) {
        yield x;
    }
}

// round to nearby lower multiple of base
function floorInBase(value: number, base: number): number {
    return base * Math.floor(value / base);
}

const timeUnitSizeMilliseconds = {
    microsecond: 1e-3,
    millisecond: 1,
    second: 1e3,
    minute: 60e3,
    hour: 60 * 60e3,
    day: 24 * 60 * 60e3,
    month: 30 * 24 * 60 * 60e3,
    quarter: 3 * 30 * 24 * 60 * 60e3,
    year: 365.2425 * 24 * 60 * 60e3,
};

type TimeUnit = keyof typeof timeUnitSizeMilliseconds;

// prettier-ignore
const possibleTicks: [number, TimeUnit][] = [
    [1, "millisecond"], [2, "millisecond"], [5, "millisecond"], [10, "millisecond"], [25, "millisecond"],
    [50, "millisecond"], [100, "millisecond"], [250, "millisecond"], [500, "millisecond"],
    [1, "second"], [2, "second"], [5, "second"], [10, "second"], [30, "second"],
    [1, "minute"], [2, "minute"], [5, "minute"], [10, "minute"], [30, "minute"],
    [1, "hour"], [2, "hour"], [4, "hour"], [8, "hour"], [12, "hour"],
    [1, "day"], [2, "day"], [3, "day"],
    [1 / 4, "month"], [1 / 2, "month"], [1, "month"], [2, "month"], [3, "month"], [6, "month"],
    [1, "year"],
];

// inspired by https://github.com/flot/flot/blob/master/source/jquery.flot.time.js#L299
export function* generateTimeTicks(range: Bounds, pixels: number, minSize: number = 60e3): Generator<number> {
    const maxTicksNumber = 0.3 * Math.sqrt(pixels);
    const minMsBetweenTicks = (range[1] - range[0]) / maxTicksNumber;

    let i: number;
    for (i = 0; i < possibleTicks.length - 1; i++) {
        const [[value, unit], [nextValue, nextUnit]] = [possibleTicks[i], possibleTicks[i + 1]];
        const sizeMs = value * timeUnitSizeMilliseconds[unit];
        const nextSizeMs = nextValue * timeUnitSizeMilliseconds[nextUnit];
        if (minMsBetweenTicks < (sizeMs + nextSizeMs) / 2 && sizeMs >= minSize) {
            break;
        }
    }

    let [size, unit] = possibleTicks[i];

    if (unit == "year") {
        const countOfNumberInYear = Math.pow(
            10,
            Math.floor(Math.log(minMsBetweenTicks / timeUnitSizeMilliseconds.year) / Math.LN10),
        );
        const mantissa = minMsBetweenTicks / timeUnitSizeMilliseconds.year / countOfNumberInYear;

        const multipliers = [1, 2, 5, 10];
        for (const multiplier of multipliers) {
            if (size * multiplier * timeUnitSizeMilliseconds.year > minSize) {
                size *= multiplier;
                break;
            }
        }

        const yearSize = countOfNumberInYear * timeUnitSizeMilliseconds.year;

        if (mantissa < 1.5 && yearSize >= minSize) {
            size = countOfNumberInYear;
        } else if (mantissa < 3 && 2 * yearSize >= minSize) {
            size = 2 * countOfNumberInYear;
        } else if (mantissa < 7.5 && 5 * yearSize >= minSize) {
            size = 5 * countOfNumberInYear;
        } else {
            size = 10 * countOfNumberInYear;
            if (size * timeUnitSizeMilliseconds.year < minSize) {
                size *= 2;
            }
        }

        if (size < 1) {
            size = 1;
        }
    }

    const step = size * timeUnitSizeMilliseconds[unit];

    let d = new Date(range[0]);
    switch (unit) {
        case "millisecond":
            d.setMilliseconds(floorInBase(d.getMilliseconds(), size));
            break;
        case "second":
            d.setSeconds(floorInBase(d.getSeconds(), size));
            break;
        case "minute":
            d.setMinutes(floorInBase(d.getMinutes(), size));
            break;
        case "hour":
            d.setHours(floorInBase(d.getHours(), size));
            break;
        case "month":
            d.setMonth(floorInBase(d.getMonth(), size));
            break;
        case "quarter":
            d.setMonth(3 * floorInBase(d.getMonth() / 3, size));
            break;
        case "year":
            d.setFullYear(floorInBase(d.getFullYear(), size));
            break;
    }

    // reset smaller components
    if (step >= timeUnitSizeMilliseconds.second) {
        d.setMilliseconds(0);
    }
    if (step >= timeUnitSizeMilliseconds.minute) {
        d.setSeconds(0);
    }
    if (step >= timeUnitSizeMilliseconds.hour) {
        d.setMinutes(0);
    }
    if (step >= timeUnitSizeMilliseconds.day) {
        d.setHours(0);
    }
    if (step >= timeUnitSizeMilliseconds.day * 30) {
        d.setDate(1);
    }
    if (step >= timeUnitSizeMilliseconds.month * 2) {
        d.setMonth(floorInBase(d.getMonth(), 3));
    }
    if (step >= timeUnitSizeMilliseconds.quarter * 2) {
        d.setMonth(floorInBase(d.getMonth(), 6));
    }
    if (step >= timeUnitSizeMilliseconds.year) {
        d.setMonth(0);
    }

    if (d.getTime() < range[0]) {
        d = new Date(d.getTime() + step);
    }

    let carry = 0;
    let v = Number.NaN;
    let prev;
    do {
        prev = v;
        v = d.getTime();

        yield v;

        if (unit == "month" || unit == "quarter") {
            if (size < 1) {
                // a bit complicated - we'll divide the
                // month/quarter up, but we need to take
                // care of fractions, so we don't end up in
                // the middle of a day
                d.setDate(1);
                const start = d.getTime();
                d.setMonth(d.getMonth() + (unit == "quarter" ? 3 : 1));
                const end = d.getTime();
                d.setTime(v + carry * timeUnitSizeMilliseconds.hour + (end - start) * size);
                carry = d.getHours();
                d.setHours(0);
            } else {
                d.setMonth(d.getMonth() + size * (unit == "quarter" ? 3 : 1));
            }
        } else if (unit == "year") {
            d.setFullYear(d.getFullYear() + size);
        } else {
            d.setTime(v + step);
        }
    } while (v < range[1] && v !== prev);
}

export function assertNever(value: never): never {
    throw new Error(`Unhandled discriminated union member: ${JSON.stringify(value)}`);
}

export function useId() {
    const [id] = useState<Id>(Math.random().toString(36).slice(2));
    return id;
}
