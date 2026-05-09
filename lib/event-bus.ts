export interface EnterpriseEvent {
  id: string
  type: string // e.g. 'booking.created', 'room.cleaned', 'sla.breach', 'incident.opened', 'housekeeping.alert'
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EMERGENCY'
  title: string
  message: string
  metadata?: any
  timestamp: string
}

type EventCallback = (event: EnterpriseEvent) => void;

class EnterpriseEventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private globalListeners: Set<EventCallback> = new Set();
  
  // Sliding-window buffer cache to protect against event storms (SRE Gate)
  private stormBuffer: EnterpriseEvent[] = [];
  private windowTimer: NodeJS.Timeout | null = null;
  private readonly WINDOW_MS = 2500; // 2.5 second aggregation window

  // Subscribe to specific event types
  subscribe(type: string, callback: EventCallback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);
    return () => this.unsubscribe(type, callback);
  }

  // Subscribe to all events globally
  subscribeAll(callback: EventCallback) {
    this.globalListeners.add(callback);
    return () => this.globalListeners.delete(callback);
  }

  private unsubscribe(type: string, callback: EventCallback) {
    if (this.listeners.has(type)) {
      this.listeners.get(type)!.delete(callback);
    }
  }

  // Emit an event into the bus with active Event Storm Protection
  emit(event: EnterpriseEvent) {
    // If severity is CRITICAL or EMERGENCY, bypass the throttling window and dispatch immediately!
    if (event.severity === 'CRITICAL' || event.severity === 'EMERGENCY') {
      this.dispatchEventDirect(event);
      return;
    }

    // Otherwise, buffer event for storm collapsing
    this.stormBuffer.push(event);

    if (!this.windowTimer) {
      this.windowTimer = setTimeout(() => {
        this.processStormBuffer();
      }, this.WINDOW_MS);
    }
  }

  // Collapses and aggregates buffered events
  private processStormBuffer() {
    this.windowTimer = null;
    const currentBuffer = [...this.stormBuffer];
    this.stormBuffer = [];

    // Group similar events of the same type and metadata criteria
    const grouped = new Map<string, EnterpriseEvent[]>();
    currentBuffer.forEach(evt => {
      const key = `${evt.type}-${evt.severity}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(evt);
    });

    // Dispatch collapsed events
    grouped.forEach((eventsGroup, key) => {
      if (eventsGroup.length === 1) {
        this.dispatchEventDirect(eventsGroup[0]);
      } else {
        // Event Storm Collapsed! Create a synthetic consolidated event summary
        const exemplar = eventsGroup[0];
        const collapsedEvent: EnterpriseEvent = {
          id: `collapsed-${exemplar.type}-${Date.now()}`,
          type: exemplar.type,
          severity: exemplar.severity,
          title: `[COLLAPSED] ${eventsGroup.length} ${exemplar.type} operations pending`,
          message: `Aggregated event stream collapsed ${eventsGroup.length} similar reports: ${exemplar.message}`,
          metadata: {
            isCollapsed: true,
            originalEventsCount: eventsGroup.length,
            collapsedIds: eventsGroup.map(e => e.id)
          },
          timestamp: new Date().toISOString()
        };
        this.dispatchEventDirect(collapsedEvent);
      }
    });
  }

  private dispatchEventDirect(event: EnterpriseEvent) {
    // Dispatch to global listeners
    this.globalListeners.forEach(cb => {
      try { cb(event); } catch (e) { console.error('Error dispatching global event callback:', e); }
    });

    // Dispatch to type listeners
    if (this.listeners.has(event.type)) {
      this.listeners.get(event.type)!.forEach(cb => {
        try { cb(event); } catch (e) { console.error(`Error dispatching callback for type [${event.type}]:`, e); }
      });
    }
  }
}

// Global shared singleton event bus instance
export const eventBus = new EnterpriseEventBus();
export default eventBus;
