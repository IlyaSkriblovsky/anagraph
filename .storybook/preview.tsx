import type { Preview } from "@storybook/react";
import { WorkerCreatorProvider } from "../src/lib";
import { getCreateWorkerOrFallback } from "../src/stories/utils";

const preview: Preview = {
    parameters: {
        actions: { argTypesRegex: "^on[A-Z].*" },
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },
    },
    decorators: [
        (Story, context) => (
            <WorkerCreatorProvider workerCreator={getCreateWorkerOrFallback()}>{Story()}</WorkerCreatorProvider>
        ),
    ],
};

export default preview;
