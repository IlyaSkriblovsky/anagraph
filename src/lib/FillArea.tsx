import { useEffect } from "react";
import { useChartContext } from "./Chart";
import { useUpdateEffect } from "react-use";
import { Bounds, LineData } from "./basic-types";
import { useId } from "./utils";

interface FillAreaProps {
    points: LineData;
    fillColor: string;
    yBounds: Bounds;
    borderColor?: string;
    borderWidth?: number;
}

export function FillArea(props: FillAreaProps) {
    const { points, fillColor, yBounds, borderColor, borderWidth } = props;

    const id = useId();

    const chartContext = useChartContext();

    useEffect(() => {
        chartContext.addFillArea(id, {
            points,
            yBounds,
            fillColor,
            borderWidth,
            borderColor,
        });
        return () => chartContext.removeFillArea(id);
    }, []);

    useUpdateEffect(() => {
        chartContext.changeFillArea(id, { points, yBounds, fillColor, borderColor, borderWidth });
    }, [points, yBounds, fillColor, borderColor, borderWidth]);

    return null;
}
