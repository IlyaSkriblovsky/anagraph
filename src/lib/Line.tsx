import { useEffect } from "react";
import { useChartContext } from "./Chart";
import { useUpdateEffect } from "react-use";
import { Bounds, LineData } from "./basic-types";
import { useId } from "./utils";

interface LineProps {
    points: LineData;
    color: string;
    lineWidth?: number;
    yBounds: Bounds;
    isFill?: boolean;
    fillColor?: string;
}

export function Line(props: LineProps) {
    const { points, color, lineWidth = 2, yBounds, fillColor, isFill } = props;

    const id = useId();

    const chartContext = useChartContext();

    useEffect(() => {
        chartContext.addLine(id, {
            points,
            color,
            lineWidth,
            yBounds,
            isFill,
            fillColor,
        });
        return () => chartContext.removeLine(id);
    }, []);

    useUpdateEffect(() => {
        chartContext.changeLine(id, { points, color, lineWidth, yBounds, isFill, fillColor });
    }, [points, color, lineWidth, yBounds, isFill, fillColor]);

    return null;
}
