import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  Cell
} from "recharts";

/**
 * Category-wise Aggregated Support Effort
 * Source: Master sheet
 * Logic: Sum Hours by Category
 */
export default function MasterCategoryChart({ data = [], onCategoryClick, selectedCategory }) {
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
  // 3️⃣ Calculate Total Hours and add as final bar
  // ---------------------------------------------
  const totalHours = chartData
    .reduce((sum, item) => sum + item.hours, 0);

  // Add Grand Total as the last bar
  chartData.push({
    category: "Grand Total",
    hours: Number(totalHours.toFixed(1)),
    isGrandTotal: true
  });

  // ---------------------------------------------
  // 4️⃣ Handle bar click
  // ---------------------------------------------
  const handleBarClick = (data) => {
    if (!onCategoryClick) return;
    
    // If clicking on Grand Total or the already selected category, show all
    if (data.isGrandTotal || data.category === selectedCategory) {
      onCategoryClick("All");
    } else {
      onCategoryClick(data.category);
    }
  };

  // ---------------------------------------------
  // 5️⃣ Render chart with clickable bars
  // ---------------------------------------------
  return (
    <div style={{ position: "relative" }}>
      <ResponsiveContainer width="100%" height={380}>
        <BarChart
          data={chartData}
          margin={{ top: 30, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis 
            dataKey="category"
            label={{ 
              value: "Category", 
              position: "insideBottom", 
              offset: -5,
              style: { fontWeight: 600 }
            }}
          />

          <YAxis
            domain={[0, (dataMax) => Math.ceil(dataMax * 1.15)]}
            label={{
              value: "Total Hours",
              angle: -90,
              position: "insideLeft"
            }}
          />

          <Tooltip 
            formatter={(v) => `${v} hrs`}
            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
          />

          <Bar 
            dataKey="hours" 
            radius={[6, 6, 0, 0]}
            onClick={handleBarClick}
            style={{ cursor: 'pointer' }}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`}
                fill={
                  selectedCategory === "All" 
                    ? "#3b82f6"
                    : entry.category === selectedCategory || entry.isGrandTotal
                    ? "#3b82f6"
                    : "#93c5fd"
                }
              />
            ))}
            <LabelList
              dataKey="hours"
              position="top"
              formatter={(v) => `${v}`}
              style={{ fontWeight: "600", fill: "#1f2937" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      <p style={{ 
        textAlign: 'center', 
        fontSize: '0.9em', 
        color: '#6b7280', 
        marginTop: '8px',
        fontStyle: 'italic'
      }}>
        💡 Click on any bar to filter the table below
      </p>
    </div>
  );
}