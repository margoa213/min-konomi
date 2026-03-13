"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type ExpenseChartProps = {
  data: {
    category: string;
    amount: number;
  }[];
};

export default function ExpenseChart({ data }: ExpenseChartProps) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
        >
          <CartesianGrid stroke="#2a2a2a" vertical={false} />
          <XAxis
            dataKey="category"
            stroke="#a3a3a3"
            tick={{ fill: "#a3a3a3", fontSize: 12 }}
          />
          <YAxis
            stroke="#a3a3a3"
            tick={{ fill: "#a3a3a3", fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number) => [`${value} kr`, "Beløp"]}
            contentStyle={{
              backgroundColor: "#0a0a0a",
              border: "1px solid #333",
              borderRadius: "12px",
              color: "#fff",
            }}
            labelStyle={{ color: "#fff" }}
          />
          <Bar dataKey="amount" fill="#60a5fa" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}