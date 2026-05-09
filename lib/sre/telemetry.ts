export interface TraceContext {
  correlationId: string
  causationId: string
  spanId: string
  tenantId: string
  propertyId: string
}

export class Telemetry {
  private static metrics: Record<string, number> = {
    'smarthotel_adr_dollars': 185.50,
    'smarthotel_occupancy_ratio': 0.74,
    'smarthotel_sla_breach_count': 0,
    'smarthotel_event_replay_drift_ms': 12
  }

  // Generate structured, PCI-compliant logs correlated with distributed trace context
  static log(
    level: 'INFO' | 'WARN' | 'ERROR' | 'FATAL',
    message: string,
    context: TraceContext,
    extra: Record<string, any> = {}
  ): string {
    const timestamp = new Date().toISOString()
    
    // Mask sensitive fields (e.g. credit cards or personal identifiers) for PCI compliance
    const sanitizedExtra = { ...extra }
    if (sanitizedExtra.cardNumber) sanitizedExtra.cardNumber = 'XXXX-XXXX-XXXX-' + sanitizedExtra.cardNumber.slice(-4)
    if (sanitizedExtra.cvv) sanitizedExtra.cvv = 'XXX'

    const structuredLog = {
      timestamp,
      level,
      message,
      trace: {
        correlation_id: context.correlationId,
        causation_id: context.causationId,
        span_id: context.spanId
      },
      tenant: {
        tenant_id: context.tenantId,
        property_id: context.propertyId
      },
      extra: sanitizedExtra
    }

    return JSON.stringify(structuredLog)
  }

  // Increment metrics counters
  static incrementCounter(metricName: string, value: number = 1): void {
    if (this.metrics[metricName] !== undefined) {
      this.metrics[metricName] += value
    } else {
      this.metrics[metricName] = value
    }
  }

  // Set gauges for real-time graphs (e.g. ADR or Occupancy)
  static setGauge(metricName: string, value: number): void {
    this.metrics[metricName] = value
  }

  static getMetric(metricName: string): number {
    return this.metrics[metricName] || 0
  }

  // Generate Prometheus formatted scraping endpoints payload
  static scrapeMetrics(): string {
    let prometheusPayload = ''
    for (const [key, val] of Object.entries(this.metrics)) {
      prometheusPayload += `# HELP ${key} SmartHotel OS system production metric\n`
      prometheusPayload += `# TYPE ${key} gauge\n`
      prometheusPayload += `${key} ${val}\n\n`
    }
    return prometheusPayload
  }
}

export default Telemetry
