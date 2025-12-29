const MasterCategorySummary = ({ data }) => {
  if (!data || data.length === 0) return null;

  const categories = [
    "Regular Maintenance",
    "CR / Enhancement",
    "Issue / Bug",
    "R&D"
  ];

  const monthMap = {};
  const grandTotals = {};

  // Initialize grand totals
  categories.forEach((c) => (grandTotals[c] = 0));
  grandTotals["Grand Total"] = 0;

  // Detect hours key
  const hoursKeyOptions = ["No. of hours", "No of hours", "Hours", "hours"];
  
  const getHoursValue = (row) => {
    for (const key of hoursKeyOptions) {
      if (key in row) return Number(row[key]) || 0;
    }
    return 0;
  };

  data.forEach((row) => {
    const month = row.Month?.trim();
    const category = row.Category?.trim();
    const hours = getHoursValue(row);

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
    <div className="card section-card">
      <h3 className="section-title">Master – Monthly Category Summary</h3>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Month</th>
              {categories.map((c) => (
                <th key={c} style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>{c}</th>
              ))}
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Grand Total</th>
            </tr>
          </thead>

          <tbody>
            {months.map((month) => (
              <tr key={month}>
                <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>{month}</td>
                {categories.map((c) => (
                  <td key={c} style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                    {monthMap[month][c] > 0 ? monthMap[month][c].toFixed(1) : "—"}
                  </td>
                ))}
                <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>
                  {monthMap[month]["Grand Total"].toFixed(1)}
                </td>
              </tr>
            ))}

            {/* GRAND TOTAL ROW */}
            <tr style={{ fontWeight: "bold", background: "#f1f5f9" }}>
              <td style={{ padding: '12px' }}>Grand Total</td>
              {categories.map((c) => (
                <td key={c} style={{ padding: '12px', textAlign: 'right' }}>
                  {grandTotals[c].toFixed(1)}
                </td>
              ))}
              <td style={{ padding: '12px', textAlign: 'right' }}>
                {grandTotals["Grand Total"].toFixed(1)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MasterCategorySummary;