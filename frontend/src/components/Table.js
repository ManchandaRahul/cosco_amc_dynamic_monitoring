// src/components/Table.js
import React from "react";

function Table({ data, headers, keyOrder }) {
  if (!data || data.length === 0) {
    return <div className="no-data">No data available.</div>;
  }

  // Determine columns: use explicit headers if provided, otherwise infer from first row
  const columns = headers || Object.keys(data[0]);

  // Use explicit order if provided, otherwise use the columns array
  const orderedColumns = keyOrder || columns;

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {orderedColumns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {orderedColumns.map((col) => {
                const value = row[col];
                const displayValue =
                  value === 0 || value === "-" || value == null ? "-" : value;
                return <td key={col}>{displayValue}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;