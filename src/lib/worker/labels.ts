export function yLabel(value: number | null | undefined, precision: number | null = 1): string {
    if (value == null) {
        return "";
    }

    const str = precision != null ? value.toFixed(precision) : value.toString();

    return str.replace(/([,.]\d*?)0+$/, "$1").replace(/\.$/, "");
}

export function timeXLabel(x: number, prevX: number | null): string[] {
    const dt = new Date(x);
    const prev_dt = prevX == null ? null : new Date(prevX);
    if (
        prev_dt != null &&
        prev_dt.getFullYear() == dt.getFullYear() &&
        prev_dt.getMonth() == dt.getMonth() &&
        prev_dt.getDate() == dt.getDate()
    ) {
        return [`${dt.getHours().toString().padStart(2, "0")}:${dt.getMinutes().toString().padStart(2, "0")}`];
    } else {
        return [
            `${dt.getHours().toString().padStart(2, "0")}:${dt.getMinutes().toString().padStart(2, "0")}`,
            `${dt.getDate().toString().padStart(2, "0")}.${(dt.getMonth() + 1)
                .toString()
                .padStart(2, "0")}.${dt.getFullYear()}`,
        ];
    }
}
