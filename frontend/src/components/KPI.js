export default function KPI({ kpis }) {
  return (
    <div className="kpi-row">
      <div className="kpi-card black">
        <h2>{kpis.totalSupport} hrs</h2>
        <span>Total Support</span>
      </div>

      <div className="kpi-card blue">
        <h2>{kpis.maintenance} hrs</h2>
        <span>Regular Maintenance</span>
      </div>

      <div className="kpi-card green">
        <h2>{kpis.bugs} hrs</h2>
        <span>Issue / Bugs</span>
      </div>

      <div className="kpi-card orange">
        <h2>{kpis.rd} hrs</h2>
        <span>R&amp;D</span>
      </div>

      <div className="kpi-card red">
        <h2>{kpis.cr} hrs</h2>
        <span>CR / Enhancements</span>
      </div>
    </div>
  );
}
