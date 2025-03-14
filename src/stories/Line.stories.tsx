import { Meta, StoryObj } from "@storybook/react";
import { BoundsManager, Chart, Line } from "../lib";
import { monthXBounds, randomDataForMonth, yBounds100 } from "./stories-constants";

export default {
    title: "Anagraph V2/Line",
    component: Line,
} satisfies Meta<typeof Line>;

type Story = StoryObj<typeof Line>;

export const Simple: Story = {
    args: {
        color: "#3b73c4",
        lineWidth: 3,
        points: [
            [-3, 9],
            [-2, 4],
            [-1, 1],
            [0, 0],
            [1, 1],
            [2, 4],
            [3, 9],
        ],
        yBounds: [-2, 10],
    },

    render: (args) => (
        <BoundsManager initialXBounds={[-10, 10]}>
            <Chart
                settings={{
                    grid: { y: { bounds: [-2, 10] } },
                }}
            >
                <Line {...args} />
            </Chart>
        </BoundsManager>
    ),
};

export const MonthOfData: Story = {
    args: {
        color: "#3b73c4",
        lineWidth: 3,
        points: randomDataForMonth,
        yBounds: yBounds100,
        isFill: false,
        fillColor: "rgba(11,122,248,0.5)",
    },
    argTypes: {
        points: {
            table: {
                disable: true,
            },
        },
    },

    render: (args) => (
        <BoundsManager initialXBounds={monthXBounds} xBoundsLimit={monthXBounds}>
            <Chart
                settings={{
                    grid: { y: { bounds: yBounds100 } },
                }}
            >
                <Line {...args} />
            </Chart>
        </BoundsManager>
    ),
};
