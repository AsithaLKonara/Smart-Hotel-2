export interface ChannelConnector {
  /**
   * Identifies the channel provider (e.g., 'BOOKING_COM', 'AIRBNB')
   */
  readonly providerCode: string;

  /**
   * Connect and authenticate the property. Returns true if successful.
   */
  connect(connectionId: string): Promise<boolean>;

  /**
   * Disconnect the property.
   */
  disconnect(connectionId: string): Promise<boolean>;

  /**
   * Pull reservations from the channel.
   * Returns a raw array of external reservation objects.
   */
  pullReservations(connectionId: string): Promise<any[]>;

  /**
   * Acknowledge that a reservation was successfully processed by the PMS.
   */
  acknowledgeReservation(connectionId: string, externalReservationId: string): Promise<boolean>;

  /**
   * Push an availability update (daily inventory) to the channel.
   * timeline is a record of { date: availableCount }
   */
  pushAvailability(connectionId: string, externalRoomId: string, timeline: Record<string, number>): Promise<boolean>;

  /**
   * Push rates for a specific rate plan.
   */
  pushRates(connectionId: string, externalRateId: string, timeline: Record<string, number>): Promise<boolean>;

  /**
   * Validate if the connection is currently healthy (e.g. by pinging or fetching basic info).
   */
  healthCheck(connectionId: string): Promise<{ isHealthy: boolean; message?: string }>;
}
