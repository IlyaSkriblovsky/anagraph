import { createContext, ReactElement, ReactNode, useContext, useMemo } from "react";
import { Rect } from "./utils";
import { CanvasContext } from "./Canvas";

// cpx -- canvas pixels (physical device pixels)
// lpx -- logical pixels (css px)

// Xcpx = Xlpx * window.devicePixelRatio

interface LabelSettings {
    textColor: string;
    bulletRadius: number;
    fontFamily: string;
    fontSize: number;
    xLabelsGap: number;
    yLabelsGap: number;
    yLabelsHeight: 48;
}

interface Layout {
    bottomLabelsHeight: number; // in lpx
    leftLabelsWidth: number; // in lpx

    topGap: number; // in lpx

    labelsSettings: LabelSettings;
}

const defaultLayout: Layout = {
    bottomLabelsHeight: 36, //36,
    leftLabelsWidth: 56,

    topGap: 10,

    labelsSettings: {
        textColor: "#666699",
        bulletRadius: 3,
        fontFamily: "sans-serif",
        fontSize: 16,
        xLabelsGap: 3,
        yLabelsGap: 8,
        yLabelsHeight: 48,
    },
};
const LayoutContext = createContext<Layout>(defaultLayout);

interface LayoutManagerProps extends Partial<Layout> {
    children: ReactNode | ReactNode[];
}
export function LayoutManager(props: LayoutManagerProps): ReactElement {
    const value = useMemo(() => ({ ...defaultLayout, ...props }), [props]);
    return <LayoutContext.Provider value={value}>{props.children}</LayoutContext.Provider>;
}

export function useGridRectCpx(): Rect {
    const layout = useContext(LayoutContext);
    const { canvasSizeCpx } = useContext(CanvasContext);

    const dpr = window.devicePixelRatio;

    return useMemo(
        () => ({
            x: layout.leftLabelsWidth * dpr,
            y: layout.topGap * dpr,
            width: canvasSizeCpx.width - layout.leftLabelsWidth * dpr,
            height: canvasSizeCpx.height - layout.bottomLabelsHeight * dpr - layout.topGap * dpr,
        }),
        [layout, canvasSizeCpx, dpr]
    );
}

export function useGridRectLpx(): Rect {
    const layout = useContext(LayoutContext);
    const { canvasSizeCpx } = useContext(CanvasContext);

    const dpr = window.devicePixelRatio;

    return useMemo(
        () => ({
            x: layout.leftLabelsWidth,
            y: layout.topGap,
            width: canvasSizeCpx.width / dpr - layout.leftLabelsWidth,
            height: canvasSizeCpx.height / dpr - layout.bottomLabelsHeight - layout.topGap,
        }),
        [layout, canvasSizeCpx, dpr]
    );
}

export function useLabelSettings(): LabelSettings {
    const layout = useContext(LayoutContext);
    return layout.labelsSettings;
}