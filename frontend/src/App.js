import { useState, useEffect } from "react";
import KPI from "./components/KPI";
import Charts from "./components/Charts";
import Table from "./components/Table";
import MasterCategoryChart from "./components/MasterCategoryChart";
import "./index.css";

function App() {
  const [sheets, setSheets] = useState(null);
  const [activeSheet, setActiveSheet] = useState(null);

  // Master sheet states
  const [selectedMasterMonth, setSelectedMasterMonth] = useState("All");
  const [selectedMasterCategory, setSelectedMasterCategory] = useState("All"); // NEW

  // Admin modal states
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthenticatedForUpload, setIsAuthenticatedForUpload] = useState(false);

  // Last updated display
  const [lastUpdated, setLastUpdated] = useState(null);

  // CHANGE THIS TO A STRONG PASSWORD!
  const CORRECT_PASSWORD = "cosco2025";

  // Load data
  useEffect(() => {
    const loadData = async () => {
      let dataLoaded = false;

      const savedData = localStorage.getItem("coscoDashboardData");
      const savedTimestamp = localStorage.getItem("coscoLastUpdated");

      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setSheets(parsed);
          setActiveSheet(Object.keys(parsed)[0]);
          setLastUpdated(savedTimestamp ? new Date(savedTimestamp) : null);
          dataLoaded = true;
        } catch (e) {
          console.error("Corrupted localStorage — clearing and falling back");
          localStorage.removeItem("coscoDashboardData");
          localStorage.removeItem("coscoLastUpdated");
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

  const monthOrder = [
    "May-25", "Jun-25", "Jul-25", "Aug-25",
    "Sep-25", "Oct-25", "Nov-25"
  ];

  const monthDisplay = {
    "May-25": "May 2025",
    "Jun-25": "June 2025",
    "Jul-25": "July 2025",
    "Aug-25": "August 2025",
    "Sep-25": "September 2025",
    "Oct-25": "October 2025",
    "Nov-25": "November 2025"
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

  // Apply category filter to table
  const tableDataForMaster = selectedMasterCategory === "All"
    ? filteredMasterData
    : filteredMasterData.filter(row => row["Category"] === selectedMasterCategory);

  // === CHART: Fixed order + all categories shown ===
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

  const masterTotalHours = filteredMasterData
    .reduce((sum, row) => sum + getHoursValue(row), 0)
    .toFixed(1);

  const formatLastUpdated = lastUpdated
    ? lastUpdated.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="app-shell">
      <div className="app-header">
        <div className="header-inner">
          <div>
            <h1 id="cosco-title" style={{ cursor: "pointer", userSelect: "none" }}>
              COSCO Automation Dashboard
            </h1>
            <p className="subtitle">Dynamic Excel-based POC</p>
          </div>
          <div className="header-meta">
            <span>Report Period: </span>
            <strong>May – Nov 2025</strong>
            {formatLastUpdated && (
              <span style={{ marginLeft: "20px", fontSize: "0.9em", opacity: 0.8 }}>
                Last updated: {formatLastUpdated}
              </span>
            )}
            <button
              className="tab"
              style={{ marginLeft: "20px" }}
              onClick={() => {
                setShowUpdateModal(true);
                setIsAuthenticatedForUpload(false);
                setAuthError("");
                setPasswordInput("");
              }}
            >
              Admin Panel
            </button>
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
                <form onSubmit={handlePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Password"
                    className="file-input"
                    autoFocus
                    required
                  />
                  <button type="submit" className="tab">Submit</button>
                  {authError && <p style={{ color: "red" }}>{authError}</p>}
                </form>
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
              {Object.keys(sheets).map((sheet) => (
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
                </div>
                <div className="card section-card">
                  <h3 className="section-title">Detailed Breakdown (in hours)</h3>
                  <Table data={sheets[activeSheet].data} />
                </div>
              </>
            )}

            {activeSheet === "Master" && (
              <>
                <div className="card section-card">
                  <h3 className="section-title">Master Activity Overview</h3>
                  <p className="section-description">
                    The Master sheet logs detailed support activities for COSCO AMC monitoring which includes daily monitoring, bug fixes/issue resolutions, and enhancements/deployments over several months.
                  </p>
                </div>

                {/* Month Filter */}
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



                {/* Chart */}
                <div className="card section-card">
                  <h3 className="section-title">
                    Category-wise Support Effort (Hours)
                    {selectedMasterMonth !== "All" && ` - ${getDisplayMonth(selectedMasterMonth)}`}
                    {filteredMasterData.length > 0 && (
                      <>
                        {" - "}
                        <strong>Total hours: {masterTotalHours}</strong>
                      </>
                    )}
                  </h3>
                  <MasterCategoryChart data={chartDataForMaster} />
                </div>
                                {/* Category Filter */}
                {/* <div className="card section-card">
                  <h3 className="section-title">Filter by Category</h3>
                  <div className="tabs">
                    <button
                      className={`tab ${selectedMasterCategory === "All" ? "active" : ""}`}
                      onClick={() => setSelectedMasterCategory("All")}
                    >
                      All Categories
                    </button>
                    {FIXED_CATEGORY_ORDER.map((cat) => (
                      <button
                        key={cat}
                        className={`tab ${selectedMasterCategory === cat ? "active" : ""}`}
                        onClick={() => setSelectedMasterCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div> */}
                {/* Table */}
                <div className="card section-card">
                  <div className="section-header-row">
                    <h3 className="section-title">Filter by Category</h3>
                  <div className="tabs">
                    <button
                      className={`tab ${selectedMasterCategory === "All" ? "active" : ""}`}
                      onClick={() => setSelectedMasterCategory("All")}
                    >
                      All Categories
                    </button>
                    {FIXED_CATEGORY_ORDER.map((cat) => (
                      <button
                        key={cat}
                        className={`tab ${selectedMasterCategory === cat ? "active" : ""}`}
                        onClick={() => setSelectedMasterCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                    <h3 className="section-title">
                      Detailed Activity Register (Master)
                      {selectedMasterMonth !== "All" && ` - ${getDisplayMonth(selectedMasterMonth)}`}
                      {selectedMasterCategory !== "All" && ` - ${selectedMasterCategory}`}
                    </h3>
                  </div>
                  <Table data={tableDataForMaster} />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;

function computeKpisFromSummary(summary) {
  if (!summary || summary.type !== "pivot") {
    return { totalSupport: 0, maintenance: 0, bugs: 0, rd: 0, cr: 0 };
  }

  return summary.data
    .filter((row) => row["Row Labels"] !== "Grand Total")
    .reduce(
      (acc, row) => {
        const num = (v) => (typeof v === "number" && !isNaN(v) ? v : 0);
        acc.cr += num(row["CR / Enhancement"]);
        acc.bugs += num(row["Issue / Bug"]);
        acc.rd += num(row["R&D"]);
        acc.maintenance += num(row["Regular Maintenance"]);
        acc.totalSupport += num(row["Grand Total"]);
        return acc;
      },
      { totalSupport: 0, maintenance: 0, bugs: 0, rd: 0, cr: 0 }
    );
}