import { Telemetry, TraceContext } from '../../../lib/sre/telemetry'

describe('OpenTelemetry Tracing & Observability Suite', () => {
  let context: TraceContext

  beforeEach(() => {
    context = {
      correlationId: 'corr-bruce-wayne-09',
      causationId: 'caus-checkout-saga-r201',
      spanId: 'span-post-finance-step',
      tenantId: 'tenant-jetwing',
      propertyId: 'prop-colombo-1'
    }
  })

  test('should generate structured JSON logs containing trace correlation boundaries', () => {
    const rawLog = Telemetry.log('INFO', 'Close Folio settlement posting matched.', context, { sagaId: 'saga-201' })
    const parsed = JSON.parse(rawLog)

    expect(parsed.level).toBe('INFO')
    expect(parsed.message).toBe('Close Folio settlement posting matched.')
    expect(parsed.trace.correlation_id).toBe('corr-bruce-wayne-09')
    expect(parsed.trace.causation_id).toBe('caus-checkout-saga-r201')
    expect(parsed.trace.span_id).toBe('span-post-finance-step')
    expect(parsed.tenant.tenant_id).toBe('tenant-jetwing')
    expect(parsed.tenant.property_id).toBe('prop-colombo-1')
    expect(parsed.extra.sagaId).toBe('saga-201')
    expect(parsed.timestamp).toBeDefined()
  })

  test('should mask credit cards and CVV codes to comply with strict PCI DSS standards', () => {
    const sensitiveData = {
      cardNumber: '4111111111111234',
      cvv: '123',
      amount: 450.00
    }

    const rawLog = Telemetry.log('WARN', 'Authorization hold request.', context, sensitiveData)
    const parsed = JSON.parse(rawLog)

    expect(parsed.extra.cardNumber).toBe('XXXX-XXXX-XXXX-1234')
    expect(parsed.extra.cvv).toBe('XXX')
    expect(parsed.extra.amount).toBe(450.00)
  })

  test('should increment and update Prometheus metric counters', () => {
    Telemetry.setGauge('smarthotel_occupancy_ratio', 0.85)
    Telemetry.incrementCounter('smarthotel_sla_breach_count', 2)

    expect(Telemetry.getMetric('smarthotel_occupancy_ratio')).toBe(0.85)
    expect(Telemetry.getMetric('smarthotel_sla_breach_count')).toBe(2)
  })

  test('should return properly formatted Prometheus scraping payload', () => {
    Telemetry.setGauge('smarthotel_event_replay_drift_ms', 15)
    const payload = Telemetry.scrapeMetrics()

    expect(payload).toContain('# HELP smarthotel_event_replay_drift_ms')
    expect(payload).toContain('# TYPE smarthotel_event_replay_drift_ms gauge')
    expect(payload).toContain('smarthotel_event_replay_drift_ms 15')
  })
})
