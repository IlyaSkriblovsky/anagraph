import { CSSProperties, useState, useCallback } from "react";
import { useDragAndZoom } from "./useDragAndZoom";
import { useBoundsContext } from "./BoundsManager";
import { Bounds } from "./basic-types";
import { useLatest } from "react-use";

interface ManipulatorProps {
    style: CSSProperties;
    onHover?: (x: number, event: PointerEvent) => void;
    onHoverEnd?: () => void;
    onTouchUp?: (x: number, event: PointerEvent) => void;
    onChangeBoundsEnd?: (bounds: Bounds) => void;
    onChangeBounds?: (bounds: Bounds) => void;
}

export function Manipulator(props: ManipulatorProps) {
    const { onHover, onHoverEnd, onTouchUp, onChangeBoundsEnd, onChangeBounds } = props;
    const { xBoundsLimit, xBoundsMinVisible, settledXBounds, onManipulation, onManipulationEnd } = useBoundsContext();

    const [glass, setGlass] = useState<HTMLDivElement | null>(null);

    const latestChangeBoundsEnd = useLatest(onChangeBoundsEnd);

    const onEnd = useCallback(
        (bounds: Bounds) => {
            onManipulationEnd(bounds);
            latestChangeBoundsEnd.current?.(bounds);
        },
        [onManipulationEnd],
    );

    const latestChangeBounds = useLatest(onChangeBounds);

    const onChange = useCallback(
        (bounds: Bounds) => {
            onManipulation(bounds);
            latestChangeBounds.current?.(bounds);
        },
        [onManipulation],
    );

    useDragAndZoom(glass, settledXBounds, onChange, onEnd, onHover, onHoverEnd, onTouchUp, {
        boundsLimit: xBoundsLimit,
        xMinVisible: xBoundsMinVisible,
    });

    return (
        <div
            ref={setGlass}
            className="glass"
            style={{
                position: "absolute",
                touchAction: "pan-x pan-y",
                ...props.style,
            }}
        />
    );
}
