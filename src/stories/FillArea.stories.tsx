import { Meta, StoryObj } from "@storybook/react";
import { BoundsManager, Chart, Line } from "../lib";
import { FillArea } from "../lib/FillArea";

export default {
    title: "Anagraph V2/FillArea",
    component: FillArea,
} satisfies Meta<typeof FillArea>;

type Story = StoryObj<typeof FillArea>;

export const Simple: Story = {
    args: {
        fillColor: "rgba(135,13,53, 0.2)",
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
        borderColor: "rgba(0,0,0, 1)",
        borderWidth: 2,
    },

    render: (args) => (
        <BoundsManager initialXBounds={[-10, 10]}>
            <Chart
                settings={{
                    grid: { y: { bounds: [-2, 10] } },
                }}
            >
                <FillArea {...args} />
            </Chart>
        </BoundsManager>
    ),
};
