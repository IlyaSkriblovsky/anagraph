import React, {
    createContext,
    ReactElement,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { noop } from "ts-essentials";
import { useCallbackList } from "./useCallbackList";

import { Bounds } from "./basic-types";

type BoundsHandler = (xBounds: Bounds) => void;

interface BoundsContextType {
    xBoundsLimit?: Bounds;

    addXBoundsCallback(fn: BoundsHandler): void;

    removeXBoundsCallback(fn: BoundsHandler): void;

    settledXBounds: Bounds;

    onManipulation(bounds: Bounds): void;

    onManipulationEnd(bounds: Bounds): void;

    getCurrentXBounds(): Bounds;

    xBoundsMinVisible?: number;
}

const BoundsContext = createContext<BoundsContextType>({
    addXBoundsCallback: noop,
    removeXBoundsCallback: noop,

    settledXBounds: [0, 1],

    onManipulation: noop,
    onManipulationEnd: noop,

    getCurrentXBounds: () => [0, 1],
});

interface BoundsManagerProps {
    initialXBounds: Bounds;
    xBoundsLimit?: Bounds;
    xBoundsMinVisible?: number;

    children: ReactNode | ReactNode[];
}

export function BoundsManager(props: BoundsManagerProps): ReactElement {
    const { initialXBounds, xBoundsLimit, xBoundsMinVisible, children } = props;

    const {
        addCallback: addXBoundsCallback,
        removeCallback: removeXBoundsCallback,
        callCallbacks: callXBoundsCallbacks,
    } = useCallbackList<BoundsHandler>();

    const [finalXBounds, setFinalXBounds] = useState<Bounds>(initialXBounds);
    const finalXBoundsRef = useRef(initialXBounds);
    const tmpXBounds = useRef<Bounds | null>(null);

    const getCurrentXBounds = useRef(() => tmpXBounds.current ?? finalXBoundsRef.current).current;

    const onManipulation = useCallback(
        (bounds: Bounds) => {
            tmpXBounds.current = bounds;
            callXBoundsCallbacks(bounds);
        },
        [callXBoundsCallbacks],
    );
    const onManipulationEnd = useCallback(
        (bounds: Bounds) => {
            tmpXBounds.current = null;
            finalXBoundsRef.current = bounds;
            setFinalXBounds(bounds);
            callXBoundsCallbacks(bounds);
        },
        [setFinalXBounds, callXBoundsCallbacks],
    );

    useEffect(() => {
        finalXBoundsRef.current = initialXBounds;
        setFinalXBounds(initialXBounds);
        callXBoundsCallbacks(initialXBounds);
    }, [initialXBounds[0], initialXBounds[1]]);

    const contextValue: BoundsContextType = {
        xBoundsLimit,
        addXBoundsCallback,
        removeXBoundsCallback,
        onManipulation,
        onManipulationEnd,
        settledXBounds: finalXBounds,
        getCurrentXBounds,
        xBoundsMinVisible,
    };
    const context = useMemo(() => contextValue, Object.values(contextValue));

    return <BoundsContext.Provider value={context}>{children}</BoundsContext.Provider>;
}

export function useBoundsContext(): BoundsContextType {
    return useContext(BoundsContext);
}
