export function ts(year: number, month: number, day: number, hour: number = 0, minute: number = 0, second: number = 0) {
    return new Date(year, month, day, hour, minute, second).getTime();
}
