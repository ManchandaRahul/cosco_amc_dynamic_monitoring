import { useState, useEffect } from "react";
import KPI from "./components/KPI";
import Charts from "./components/Charts";
import Table from "./components/Table";
import MasterCategoryChart from "./components/MasterCategoryChart";
import "./index.css";



function App() {
  const [sheets, setSheets] = useState(null);
  const [activeSheet, setActiveSheet] = useState(null);
  const [sheetNotes, setSheetNotes] = useState({});
  const isAdminMode = new URLSearchParams(window.location.search).get('admin') === 'true';

  // Master sheet states
  const [selectedMasterMonth, setSelectedMasterMonth] = useState("All");
  const [selectedMasterCategory, setSelectedMasterCategory] = useState("All");

  // Admin modal states
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthenticatedForUpload, setIsAuthenticatedForUpload] = useState(false);
  const [editingInferences, setEditingInferences] = useState(false);
  const [inferenceDraft, setInferenceDraft] = useState("");

  // Last updated display
  const [lastUpdated, setLastUpdated] = useState(null);

  const CORRECT_PASSWORD = "cosco2025";

  // Load data + notes
  useEffect(() => {
    const loadData = async () => {
      let dataLoaded = false;

      const savedData = localStorage.getItem("coscoDashboardData");
      const savedTimestamp = localStorage.getItem("coscoLastUpdated");
      const savedNotes = localStorage.getItem("coscoNotesData");

      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setSheets(parsed);
          setActiveSheet(Object.keys(parsed)[0]);
          setLastUpdated(savedTimestamp ? new Date(savedTimestamp) : null);

          if (savedNotes) {
            setSheetNotes(JSON.parse(savedNotes));
          }

          dataLoaded = true;
        } catch (e) {
          console.error("Corrupted localStorage — clearing and falling back");
          localStorage.removeItem("coscoDashboardData");
          localStorage.removeItem("coscoLastUpdated");
          localStorage.removeItem("coscoNotesData");
        }
      }

      if (!dataLoaded) {
        try {
          const res = await fetch("/latest-report.json");
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();

          setSheets(data.sheets);
          setActiveSheet(Object.keys(data.sheets)[0]);
          const timestamp = data.lastUpdated || new Date().toISOString();
          setLastUpdated(new Date(timestamp));

          localStorage.setItem("coscoDashboardData", JSON.stringify(data.sheets));
          localStorage.setItem("coscoLastUpdated", timestamp);

          // Load notes.json
          let notesData = {};
          try {
            const notesRes = await fetch("/notes.json");
            if (notesRes.ok) {
              notesData = await notesRes.json();
              setSheetNotes(notesData);
              localStorage.setItem("coscoNotesData", JSON.stringify(notesData));
            }
          } catch (err) {
            console.warn("notes.json not found or failed to load");
          }

        } catch (err) {
          console.error("Failed to load latest-report.json:", err);
        }
      }
    };

    loadData();
  }, []);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === CORRECT_PASSWORD) {
      setIsAuthenticatedForUpload(true);
      setAuthError("");
      setPasswordInput("");
    } else {
      setAuthError("Incorrect password. Try again.");
    }
  };

  const uploadExcel = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:4000/upload-excel", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const json = await res.json();
      setSheets(json.sheets);
      setActiveSheet(Object.keys(json.sheets)[0]);
      setSelectedMasterMonth("All");
      setSelectedMasterCategory("All");

      localStorage.setItem("coscoDashboardData", JSON.stringify(json.sheets));
      const now = new Date().toISOString();
      localStorage.setItem("coscoLastUpdated", now);
      setLastUpdated(new Date(now));

      setShowUpdateModal(false);
      setIsAuthenticatedForUpload(false);
    } catch (err) {
      setAuthError("Upload failed — run local backend or update JSON file.");
    }
  };

  const summary = sheets?.Summary;
  const kpis = computeKpisFromSummary(summary);

  const monthOrder = ["May-25", "Jun-25", "Jul-25", "Aug-25", "Sep-25", "Oct-25", "Nov-25", "Dec-25","Jan-26"];

  const monthDisplay = {
    "May-25": "May 2025",
    "Jun-25": "June 2025",
    "Jul-25": "July 2025",
    "Aug-25": "August 2025",
    "Sep-25": "September 2025",
    "Oct-25": "October 2025",
    "Nov-25": "November 2025",
    "Dec-25": "December 2025",
    "Jan-26": "January 2026"
  };

  const uniqueMonths = Array.from(
    new Set(sheets?.Master?.data?.map((row) => row["Month"]).filter(Boolean) || [])
  );

  const masterMonthCodes = monthOrder.filter((m) => uniqueMonths.includes(m));

  const getDisplayMonth = (code) => monthDisplay[code] || code;

  const filteredMasterData =
    selectedMasterMonth === "All"
      ? sheets?.Master?.data || []
      : sheets?.Master?.data?.filter((row) => row["Month"] === selectedMasterMonth) || [];

  const tableDataForMaster = selectedMasterCategory === "All"
    ? filteredMasterData
    : filteredMasterData.filter(row => row["Category"] === selectedMasterCategory);

const downloadMasterExcel = async () => {
  if (!tableDataForMaster || tableDataForMaster.length === 0) {
    alert("No data available to download.");
    return;
  }

  // ✅ Dynamically import browser-only libraries
  const XLSX = await import("xlsx");
  const { saveAs } = await import("file-saver");

  const worksheet = XLSX.utils.json_to_sheet(tableDataForMaster);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Master");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array"
  });

  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });

  const monthLabel =
    selectedMasterMonth === "All"
      ? "All_Months"
      : getDisplayMonth(selectedMasterMonth).replace(" ", "_");

  saveAs(blob, `Master_Data_${monthLabel}.xlsx`);
};


  const FIXED_CATEGORY_ORDER = [
    "Regular Maintenance",
    "CR / Enhancement",
    "Issue / Bug",
    "R&D"
  ];

  const categoryKey = "Category";

  const hoursKeyOptions = ["No. of hours", "No of hours", "Hours", "hours"];

  const getHoursValue = (row) => {
    for (const key of hoursKeyOptions) {
      if (key in row) return Number(row[key]) || 0;
    }
    return 0;
  };

  const presentCategories = new Set(filteredMasterData.map(row => row[categoryKey]).filter(Boolean));

  const dummyRows = FIXED_CATEGORY_ORDER
    .filter(cat => !presentCategories.has(cat))
    .map(cat => ({
      [categoryKey]: cat,
      "No. of hours": 0
    }));

  let chartDataForMaster = [...filteredMasterData, ...dummyRows];

  chartDataForMaster.sort((a, b) => {
    const indexA = FIXED_CATEGORY_ORDER.indexOf(a[categoryKey]);
    const indexB = FIXED_CATEGORY_ORDER.indexOf(b[categoryKey]);
    return indexA - indexB;
  });

  const masterTotalHours = tableDataForMaster
  .reduce((sum, row) => sum + getHoursValue(row), 0)
  .toFixed(1);


  const formatLastUpdated = lastUpdated
    ? lastUpdated.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="app-shell">
      <div className="app-header">
        <div className="header-inner horizontal-header">
          {/* Left: Title */}
          <h1 id="cosco-title" style={{ margin: 0, fontSize: '36px' }}>
            AMC Monitoring
          </h1>

          {/* Center: Logo */}
          <img src="/cosco.png" alt="COSCO Shipping" className="cosco-logo centered-logo" />

          {/* Right: Report info + Admin button */}
          <div className="header-meta">
            <div style={{ textAlign: 'right' }}>
              <span>Report Period: </span>
              <strong>May – Jan 2026</strong>
              {formatLastUpdated && (
                <span style={{ display: 'block', marginTop: '4px', fontSize: '0.9em', opacity: 0.8 }}>
                  Last updated: {formatLastUpdated}
                </span>
              )}
            </div>
            {isAdminMode && (
              <button
                className="admin-panel-btn"
                onClick={() => {
                  setShowUpdateModal(true);
                  setIsAuthenticatedForUpload(false);
                  setAuthError("");
                  setPasswordInput("");
                }}
              >
                Admin Panel
              </button>
            )}
          </div>
        </div>
      </div>

      {showUpdateModal && (
        <div className="modal-overlay" onClick={() => setShowUpdateModal(false)}>
          <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
            <h3>Update Dashboard Report</h3>
            {!isAuthenticatedForUpload ? (
              <>
                <p>Enter password to upload a new report:</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handlePasswordSubmit(e);
                      }
                    }}
                    placeholder="Password"
                    className="file-input"
                    autoFocus
                  />
                  <button onClick={handlePasswordSubmit} className="tab">Submit</button>
                  {authError && <p style={{ color: "red" }}>{authError}</p>}
                </div>
              </>
            ) : (
              <>
                <p>Password accepted. Choose new Excel file:</p>
                <input
                  type="file"
                  accept=".xlsx"
                  className="file-input"
                  onChange={(e) => uploadExcel(e.target.files[0])}
                  autoFocus
                />
                {authError && <p style={{ color: "red" }}>{authError}</p>}

                {/* Inline Inferences Editor */}
                <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #ddd" }}>
                  <h4 style={{ margin: "0 0 12px 0" }}>Edit Key Insights (Inferences)</h4>
                  <p style={{ fontSize: "0.9em", color: "#555", marginBottom: "12px" }}>
                    Current sheet: <strong>{activeSheet || "None selected"}</strong>
                  </p>

                  <button
                    className="tab"
                    style={{ background: "#1976d2", color: "white" }}
                    onClick={() => {
                      const current = sheetNotes[activeSheet]?.inferences || "";
                      setInferenceDraft(current);
                      setEditingInferences(true);
                    }}
                    disabled={!activeSheet}
                  >
                    Edit Insights for This Sheet
                  </button>

                  {editingInferences && activeSheet && (
                    <div style={{ marginTop: "16px" }}>
                      <textarea
                        value={inferenceDraft}
                        onChange={(e) => setInferenceDraft(e.target.value)}
                        rows="6"
                        placeholder="Enter key insights and inferences for this sheet..."
                        style={{
                          width: "100%",
                          padding: "12px",
                          borderRadius: "6px",
                          border: "1px solid #ccc",
                          fontFamily: "inherit",
                          fontSize: "1em"
                        }}
                        autoFocus
                      />
                      <div style={{ marginTop: "12px", display: "flex", gap: "10px" }}>
                        <button
                          className="tab"
                          style={{ background: "#4caf50", color: "white" }}
                          onClick={() => {
                            const updated = {
                              ...sheetNotes,
                              [activeSheet]: {
                                ...(sheetNotes[activeSheet] || {}),
                                inferences: inferenceDraft
                              }
                            };
                            setSheetNotes(updated);
                            localStorage.setItem("coscoNotesData", JSON.stringify(updated));
                            setEditingInferences(false);
                            alert("Key Insights saved! Visible immediately. Update notes.json manually for permanent save.");
                          }}
                        >
                          Save Insights
                        </button>
                        <button
                          className="tab"
                          style={{ background: "#ddd" }}
                          onClick={() => setEditingInferences(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
            <button
              className="tab"
              style={{ marginTop: "20px", background: "#ddd" }}
              onClick={() => {
                setShowUpdateModal(false);
                setIsAuthenticatedForUpload(false);
                setAuthError("");
                setPasswordInput("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="container">
        {sheets && (
          <div className="card row">
            <select
              className="dropdown"
              value={activeSheet || ""}
              onChange={(e) => {
                setActiveSheet(e.target.value);
                setSelectedMasterMonth("All");
                setSelectedMasterCategory("All");
              }}
            >
{Object.keys(sheets)
  .filter(sheet => !/^Sheet\d+$/i.test(sheet))   // 👈 removes Sheet1/2/3
  .map((sheet) => (
    <option key={sheet} value={sheet}>{sheet}</option>
))}
            </select>
          </div>          
        )}

        {!sheets && (
          <div className="card" style={{ textAlign: "center", marginTop: "60px", padding: "40px" }}>
            <h3>Loading report...</h3>
            <p>If this persists, contact administrator.</p>
          </div>
        )}

        {sheets && <div className="kpi-strip"><KPI kpis={kpis} /></div>}

        {activeSheet && sheets && (
          <>
            {/* Summary & cbs changes Sheets */}
            {activeSheet !== "Master" && (
              <>
                <div className="card section-card">
                  <h3 className="section-title">
                    {activeSheet === "Summary" ? "Monthly Support Overview" : "CBS Changes & Enhancements Trend"}
                  </h3>
                  {activeSheet === "cbs changes" && (
                    <p className="section-description">
                      This view focuses exclusively on <strong>CBS-related changes and enhancements</strong>.
                    </p>
                  )}
                  {activeSheet === "Summary" && (
                    <p className="section-description">
                      This summary provides a <strong>month-wise consolidation of total support effort</strong> across CR/Enhancements, Issues/Bugs, R&D, and Regular Maintenance.
                    </p>
                  )}

                  <Charts data={sheets[activeSheet].data} activeSheet={activeSheet} />

                  {/* Key Insights below the chart */}
                  {sheetNotes[activeSheet]?.inferences && (
                    <div
                      className="inference-box"
                      style={{
                        marginTop: "24px",
                        padding: "18px",
                        background: "#f0f7ff",
                        borderRadius: "10px",
                        borderLeft: "5px solid #1e88e5",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
                      }}
                    >
                      <strong style={{ color: "#1565c0", fontSize: "1.1em" }}>
                        Inferences
                      </strong>
                      <p
                        style={{
                          margin: "12px 0 0",
                          whiteSpace: "pre-line",
                          lineHeight: "1.8",
                          color: "#333"
                        }}
                      >
                        {sheetNotes[activeSheet].inferences}
                      </p>
                    </div>
                  )}
                </div>

                <div className="card section-card">
                  <h3 className="section-title">Detailed Breakdown (in hours)</h3>
                  <Table data={sheets[activeSheet].data} />
                </div>
              </>
            )}

            {/* Master Sheet */}
            {activeSheet === "Master" && (
              <>
                <div className="card section-card">
                  <h3 className="section-title">Master Activity Overview</h3>
                  <p className="section-description">
                    The Master sheet logs detailed support activities for COSCO AMC monitoring which includes daily monitoring, bug fixes/issue resolutions, and enhancements/deployments.
                  </p>
                </div>

                <div className="card section-card">
                  <h3 className="section-title">Filter by Month</h3>
                  <div className="tabs">
                    <button
                      className={`tab ${selectedMasterMonth === "All" ? "active" : ""}`}
                      onClick={() => setSelectedMasterMonth("All")}
                    >
                      All Months
                    </button>
                    {masterMonthCodes.map((code) => (
                      <button
                        key={code}
                        className={`tab ${selectedMasterMonth === code ? "active" : ""}`}
                        onClick={() => setSelectedMasterMonth(code)}
                      >
                        {getDisplayMonth(code)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="card section-card">
                  <h3 className="section-title">
                    Category-wise Support Effort (Hours)
                    {selectedMasterMonth !== "All" && ` - ${getDisplayMonth(selectedMasterMonth)}`}
                    {selectedMasterCategory !== "All" && ` - ${selectedMasterCategory}`}
                    {filteredMasterData.length > 0 && (
                      <>
                        {" - "}
                        <strong>Total hours: {masterTotalHours}</strong>
                      </>
                    )}
                  </h3>

                  <MasterCategoryChart 
                    data={chartDataForMaster}
                    onCategoryClick={setSelectedMasterCategory}
                    selectedCategory={selectedMasterCategory}
                  />

                  {/* Key Insights below Master Category Chart */}
                  {sheetNotes.Master?.inferences && (
                    <div
                      className="inference-box"
                      style={{
                        marginTop: "24px",
                        padding: "18px",
                        background: "#f0f7ff",
                        borderRadius: "10px",
                        borderLeft: "5px solid #1e88e5",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
                      }}
                    >
                      <strong style={{ color: "#1565c0", fontSize: "1.1em" }}>
                        Inferences
                      </strong>
                      <p
                        style={{
                          margin: "12px 0 0",
                          whiteSpace: "pre-line",
                          lineHeight: "1.8",
                          color: "#333"
                        }}
                      >
                        {sheetNotes.Master.inferences}
                      </p>
                    </div>
                  )}
                </div>

                <div className="card section-card">
                  <h3 className="section-title">
                    Detailed Activity Register (Master)
                    
                    {selectedMasterMonth !== "All" && ` - ${getDisplayMonth(selectedMasterMonth)}`}
                    {selectedMasterCategory !== "All" && ` - ${selectedMasterCategory}`}
<button
  className="download-btn"
  onClick={downloadMasterExcel}
>
      Download Excel
    </button>
                  </h3>
                  <Table data={tableDataForMaster} />
                </div>
              </>
            )}
          </>
        )}
      </div>

      <footer className="app-footer">
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', padding: '20px 0' }}>
          <span style={{ fontSize: '0.9em', color: '#555' }}>
            Dashboard developed by 
          </span>
          <img 
            src="/karuyaki.png"  
            alt="Karuyaki" 
            style={{ height: '20px', width: 'auto' }} 
          />
        </div>
      </footer>
    </div>
  );
}

export default App;

function computeKpisFromSummary(summary) {
  const defaults = { totalSupport: 0, maintenance: 0, bugs: 0, rd: 0, cr: 0 };

  if (!summary || summary.type !== "pivot" || !Array.isArray(summary.data)) {
    return defaults;
  }

  const grandTotalRow = summary.data.find(
    (row) => String(row["Month"] || "").trim() === "Grand Total"
  );

  const parseNum = (v) => {
    if (typeof v === "number" && !isNaN(v)) return v;
    if (v === '-' || v === '' || v == null) return 0;
    if (typeof v === "string") {
      const cleaned = v.replace(/,/g, "").trim();
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  if (!grandTotalRow) {
    return summary.data.reduce((acc, row) => {
      if (String(row["Month"] || "").trim() === "Grand Total") return acc;
      acc.cr += parseNum(row["CR / Enhancement"]);
      acc.bugs += parseNum(row["Issue / Bug"]);
      acc.rd += parseNum(row["R&D"]);
      acc.maintenance += parseNum(row["Regular Maintenance"]);
      acc.totalSupport += parseNum(row["Grand Total"]);
      return acc;
    }, { totalSupport: 0, maintenance: 0, bugs: 0, rd: 0, cr: 0 });
  }

  return {
    totalSupport: parseNum(grandTotalRow["Grand Total"]),
    maintenance: parseNum(grandTotalRow["Regular Maintenance"]),
    bugs: parseNum(grandTotalRow["Issue / Bug"]),
    rd: parseNum(grandTotalRow["R&D"]),
    cr: parseNum(grandTotalRow["CR / Enhancement"]),
  };
}