const MasterCategorySummary = ({ data }) => {
  if (!data || data.length === 0) return null;

  const categories = [
    "CR / Enhancement",
    "Issue / Bug",
    "R&D",
    "Regular Maintenance"
  ];

  const monthMap = {};
  const grandTotals = {};

  // Initialize grand totals
  categories.forEach((c) => (grandTotals[c] = 0));
  grandTotals["Grand Total"] = 0;

  data.forEach((row) => {
    const month = row.Month?.trim();
    const category = row.Category?.trim();
    const hours = Number(row.Hours);

    if (!month || !category || isNaN(hours)) return;
    if (!categories.includes(category)) return;

    // Initialize month row
    if (!monthMap[month]) {
      monthMap[month] = {};
      categories.forEach((c) => (monthMap[month][c] = 0));
      monthMap[month]["Grand Total"] = 0;
    }

    // Add values
    monthMap[month][category] += hours;
    monthMap[month]["Grand Total"] += hours;

    grandTotals[category] += hours;
    grandTotals["Grand Total"] += hours;
  });

  const months = Object.keys(monthMap);

  return (
    <div className="card">
      <h3 className="chart-title">Master – Monthly Category Summary</h3>

      <table>
        <thead>
          <tr>
            <th>Month</th>
            {categories.map((c) => (
              <th key={c}>{c}</th>
            ))}
            <th>Grand Total</th>
          </tr>
        </thead>

        <tbody>
          {months.map((month) => (
            <tr key={month}>
              <td>{month}</td>
              {categories.map((c) => (
                <td key={c}>{monthMap[month][c] || ""}</td>
              ))}
              <td>{monthMap[month]["Grand Total"]}</td>
            </tr>
          ))}

          {/* GRAND TOTAL ROW */}
          <tr style={{ fontWeight: "bold", background: "#f1f5f9" }}>
            <td>Grand Total</td>
            {categories.map((c) => (
              <td key={c}>{grandTotals[c].toFixed(1)}</td>
            ))}
            <td>{grandTotals["Grand Total"].toFixed(1)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default MasterCategorySummary;
