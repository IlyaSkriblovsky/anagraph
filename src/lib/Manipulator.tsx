import { CSSProperties, useState } from "react";
import { useDragAndZoom } from "./useDragAndZoom";
import { useBoundsContext } from "./BoundsManager";

interface ManipulatorProps {
    style: CSSProperties;
    onHover?: (x: number, event: PointerEvent) => void;
    onHoverEnd?: () => void;
}

export function Manipulator(props: ManipulatorProps) {
    const { onHover, onHoverEnd } = props;
    const { xBoundsLimit, settledXBounds, onManipulation, onManipulationEnd } = useBoundsContext();

    const [glass, setGlass] = useState<HTMLDivElement | null>(null);

    useDragAndZoom(glass, settledXBounds, onManipulation, onManipulationEnd, onHover, onHoverEnd, {
        boundsLimit: xBoundsLimit,
    });

    return (
        <div
            ref={setGlass}
            className="glass"
            style={{
                position: "absolute",
                touchAction: "none",
                ...props.style,
            }}
        />
    );
}
