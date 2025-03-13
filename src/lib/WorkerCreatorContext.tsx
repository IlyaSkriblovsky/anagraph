import { createContext, ReactNode, useContext, useMemo } from "react";

type WorkerCreator = () => Worker;

interface WorkerCreatorContextType {
    workerCreator: WorkerCreator;
}

const WorkerCreatorContext = createContext<WorkerCreatorContextType>({
    workerCreator: () => {
        throw new Error("No worker creator provided");
    },
});

interface WorkerCreatorProviderProps {
    workerCreator: WorkerCreator;
    children: ReactNode | ReactNode[];
}

export function WorkerCreatorProvider(props: WorkerCreatorProviderProps) {
    const value = useMemo(() => ({ workerCreator: props.workerCreator }), [props.workerCreator]);
    return <WorkerCreatorContext.Provider value={value}>{props.children}</WorkerCreatorContext.Provider>;
}

export function useWorkerCreator(): WorkerCreator {
    return useContext(WorkerCreatorContext).workerCreator;
}
