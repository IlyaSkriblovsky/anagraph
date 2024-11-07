import { CSSProperties, useState } from "react";
import { useDragAndZoom } from "./useDragAndZoom";
import { useBoundsContext } from "./BoundsManager";

interface ManipulatorProps {
    style: CSSProperties;
    onHover?: (x: number, event: PointerEvent) => void;
    onHoverEnd?: () => void;
    onTouchUp?: (x: number, event: PointerEvent) => void;
    boundsMinVisibleX?: number;
}

export function Manipulator(props: ManipulatorProps) {
    const { onHover, onHoverEnd, onTouchUp, boundsMinVisibleX } = props;
    const { xBoundsLimit, settledXBounds, onManipulation, onManipulationEnd } = useBoundsContext();

    const [glass, setGlass] = useState<HTMLDivElement | null>(null);

    useDragAndZoom(glass, settledXBounds, onManipulation, onManipulationEnd, onHover, onHoverEnd, onTouchUp, {
        boundsLimit: xBoundsLimit,
        boundsMinVisibleX: boundsMinVisibleX,
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
