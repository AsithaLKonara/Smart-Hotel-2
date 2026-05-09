/**
 * SmartHotel OS — Grafana Dashboard Template Generator
 * Compiles production-standard, ready-to-import Grafana Dashboard JSON blueprints.
 */

export class DashboardGenerator {
  /**
   * Generates a comprehensive JSON dashboard configuration for occupancy, financial ADR,
   * socket concurrency, queue offsets, and system latency.
   */
  static generateGrafanaJSON(propertyId = 'global-portfolio'): string {
    const dashboard = {
      annotations: { list: [] },
      editable: true,
      fiscalYearStartMonth: 0,
      graphTooltip: 1,
      id: null,
      links: [],
      liveNow: true,
      panels: [
        {
          collapsed: false,
          gridPos: { h: 1, w: 24, x: 0, y: 0 },
          id: 1,
          title: `SmartHotel OS Executive Telemetry [Property: ${propertyId}]`,
          type: "row"
        },
        // Panel: Occupancy Rate (%)
        {
          datasource: { type: "prometheus", uid: "prometheus" },
          fieldConfig: {
            defaults: {
              custom: { drawStyle: "line", lineInterpolation: "smooth" },
              unit: "percent"
            }
          },
          gridPos: { h: 8, w: 8, x: 0, y: 1 },
          id: 2,
          title: "Occupancy Rate (%)",
          type: "timeseries",
          targets: [
            {
              expr: "smarthotel_occupancy_ratio * 100",
              legendFormat: "Occupancy %",
              refId: "A"
            }
          ]
        },
        // Panel: ADR & RevPAR (Financials)
        {
          datasource: { type: "prometheus", uid: "prometheus" },
          fieldConfig: {
            defaults: {
              custom: { drawStyle: "line" },
              unit: "currencyUSD"
            }
          },
          gridPos: { h: 8, w: 8, x: 8, y: 1 },
          id: 3,
          title: "Revenue KPIs (ADR & RevPAR)",
          type: "timeseries",
          targets: [
            {
              expr: "smarthotel_average_daily_rate",
              legendFormat: "ADR ($)",
              refId: "A"
            },
            {
              expr: "smarthotel_revenue_per_available_room",
              legendFormat: "RevPAR ($)",
              refId: "B"
            }
          ]
        },
        // Panel: WebSocket Connections & Drops
        {
          datasource: { type: "prometheus", uid: "prometheus" },
          fieldConfig: {
            defaults: {
              custom: { drawStyle: "line" },
              unit: "none"
            }
          },
          gridPos: { h: 8, w: 8, x: 16, y: 1 },
          id: 4,
          title: "Active WebSocket Connections",
          type: "timeseries",
          targets: [
            {
              expr: "smarthotel_active_sockets",
              legendFormat: "Active Links",
              refId: "A"
            },
            {
              expr: "rate(smarthotel_socket_drops_total[5m])",
              legendFormat: "Drop Rate / sec",
              refId: "B"
            }
          ]
        },
        {
          collapsed: false,
          gridPos: { h: 1, w: 24, x: 0, y: 9 },
          id: 5,
          title: "Database and Queue Latency Indices",
          type: "row"
        },
        // Panel: MongoDB Transaction and Query Latency
        {
          datasource: { type: "prometheus", uid: "prometheus" },
          fieldConfig: {
            defaults: {
              custom: { drawStyle: "line" },
              unit: "ms"
            }
          },
          gridPos: { h: 8, w: 12, x: 0, y: 10 },
          id: 6,
          title: "Database Read/Write Duration (P95)",
          type: "timeseries",
          targets: [
            {
              expr: "histogram_quantile(0.95, sum(rate(smarthotel_db_operation_duration_ms_bucket[5m])) by (le))",
              legendFormat: "P95 DB Latency (ms)",
              refId: "A"
            }
          ]
        },
        // Panel: Outbox / Event Bus Lag
        {
          datasource: { type: "prometheus", uid: "prometheus" },
          fieldConfig: {
            defaults: {
              custom: { drawStyle: "bar" },
              unit: "none"
            }
          },
          gridPos: { h: 8, w: 12, x: 12, y: 10 },
          id: 7,
          title: "Event Bus Storm Queue Offset Lag",
          type: "timeseries",
          targets: [
            {
              expr: "smarthotel_event_bus_offset_lag",
              legendFormat: "Queue Message Lag",
              refId: "A"
            }
          ]
        }
      ],
      schemaVersion: 38,
      style: "dark",
      tags: ["smarthotel", "enterprise", "sre"],
      time: { from: "now-6h", to: "now" },
      timepicker: {},
      timezone: "browser",
      title: "SmartHotel OS Operational Control Center",
      uid: `sh-control-${propertyId}`,
      version: 1
    };

    return JSON.stringify(dashboard, null, 2);
  }
}

export default DashboardGenerator;
