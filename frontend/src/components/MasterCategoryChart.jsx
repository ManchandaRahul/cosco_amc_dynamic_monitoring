import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList
} from "recharts";

/**
 * Category-wise Aggregated Support Effort
 * Source: Master sheet
 * Logic: Sum Hours by Category
 */
export default function MasterCategoryChart({ data = [] }) {
  if (!data || data.length === 0) {
    return <p>No data available</p>;
  }

  // ---------------------------------------------
  // 1️⃣ Aggregate hours by Category
  // ---------------------------------------------
  const categoryMap = {};

  data.forEach((row) => {
    const category = row["Category"];
    const hours = Number(row["Hours"]) || 0;

    if (!category) return;

    categoryMap[category] = (categoryMap[category] || 0) + hours;
  });

  // ---------------------------------------------
  // 2️⃣ Convert to chart-friendly format
  // ---------------------------------------------
  const chartData = Object.keys(categoryMap).map((category) => ({
    category,
    hours: Number(categoryMap[category].toFixed(1))
  }));

  // ---------------------------------------------
  // 3️⃣ Render chart
  // ---------------------------------------------
  return (
    <div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          
          <XAxis dataKey="category" />
          
         <YAxis
  domain={[0, (dataMax) => Math.ceil(dataMax * 1.15)]}
  label={{
    value: "Total Hours",
    angle: -90,
    position: "insideLeft"
  }}
/>


          <Tooltip formatter={(v) => `${v} hrs`} />

          <Bar dataKey="hours" fill="#0284c7" radius={[6, 6, 0, 0]}>
            <LabelList
              dataKey="hours"
              position="top"
              formatter={(v) => `${v}`}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
