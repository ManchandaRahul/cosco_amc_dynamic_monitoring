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

export default function Charts({ data = [], activeSheet }) {
  if (!data || data.length === 0) {
    return <p>No data available</p>;
  }

  // ✅ FIX 1: Correct sheet detection
  const isCBSChanges =
    typeof activeSheet === "string" &&
    activeSheet.toLowerCase().includes("cbs");

  // ✅ FIX 2: Robust hours column detection
  const detectHoursKey = (row) => {
    if ("No. of hours" in row) return "No. of hours";
    if ("No of hours" in row) return "No of hours";
    if ("Hours" in row) return "Hours";
    return null;
  };

  const hoursKey = isCBSChanges
    ? detectHoursKey(data[0])
    : "Grand Total";

  if (!hoursKey) {
    return (
      <p style={{ color: "red" }}>
        Hours column not found for sheet: {activeSheet}
      </p>
    );
  }

  // ✅ FIX 3: Prepare clean numeric data
  const chartData = data.map((row) => ({
    Month: row["Month"],
    value: Number(row[hoursKey]) || 0
  }));

  const title = isCBSChanges
    ? "CBS Changes & Enhancements Trend"
    : "Support Trend";

  const yLabel = isCBSChanges
    ? "Enhancement Hours"
    : "Total Support Hours";

  return (
    <div>
      <h4 style={{ marginBottom: 12, fontWeight: 600 }}>{title}</h4>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart 
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          
          <XAxis 
            dataKey="Month"
            label={{ 
              value: "Month", 
              position: "insideBottom", 
              offset: -5,
              style: { fontWeight: 600 }
            }}
          />
          
          <YAxis
            label={{
              value: yLabel,
              angle: -90,
              position: "insideLeft"
            }}
          />
          
          <Tooltip formatter={(v) => `${v} hrs`} />

          <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]}>
            <LabelList
              dataKey="value"
              position="top"
              formatter={(v) => (v > 0 ? v : "")}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}