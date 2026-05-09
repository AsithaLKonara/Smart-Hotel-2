import { eventBus } from '../event-bus';

export interface TenantRouteProfile {
  tenantId: string;
  regionCode: 'APAC' | 'EMEA' | 'AMER';
  assignedZone: string; // AWS/GCP availability region
  databasePartitionKey: string;
  computeCapLimitMips: number; // Max allowed MIPS (compute capacity)
  noisyNeighborMitigationLevel: 'STANDARD' | 'ISOLATED' | 'DEDICATED';
}

export class TenantPartitioner {
  /**
   * Resolves geo-routing paths and compute isolation profiles for a specific tenant account ID
   */
  static resolveTenantClusterRoute(tenantId: string): TenantRouteProfile {
    const timestamp = new Date().toISOString();
    
    // Resolve regional mappings based on ID patterns
    let regionCode: 'APAC' | 'EMEA' | 'AMER' = 'AMER';
    let assignedZone = 'us-east-1';
    let databasePartitionKey = `db_partition_amer_${tenantId.toLowerCase()}`;
    let computeCapLimitMips = 1500; // Baseline standard limit
    let noisyNeighborMitigationLevel: 'STANDARD' | 'ISOLATED' | 'DEDICATED' = 'STANDARD';

    if (tenantId.startsWith('t-apac')) {
      regionCode = 'APAC';
      assignedZone = 'ap-southeast-1'; // Singapore AWS/GCP
      databasePartitionKey = `db_partition_apac_${tenantId.toLowerCase()}`;
      computeCapLimitMips = 3500; // High tier
      noisyNeighborMitigationLevel = 'DEDICATED';
    } else if (tenantId.startsWith('t-emea')) {
      regionCode = 'EMEA';
      assignedZone = 'eu-west-2'; // London AWS/GCP
      databasePartitionKey = `db_partition_emea_${tenantId.toLowerCase()}`;
      computeCapLimitMips = 2000;
      noisyNeighborMitigationLevel = 'ISOLATED';
    }

    const routeProfile: TenantRouteProfile = {
      tenantId,
      regionCode,
      assignedZone,
      databasePartitionKey,
      computeCapLimitMips,
      noisyNeighborMitigationLevel
    };

    // Emit partition resolved event to SRE channel
    eventBus.emit({
      id: `partition-res-${tenantId.slice(-4)}`,
      type: 'cluster.tenant_routed',
      severity: 'INFO',
      title: 'Tenant Cluster Route Resolved',
      message: `Tenant [${tenantId}] successfully routed to geo-partition [${assignedZone}] with ${noisyNeighborMitigationLevel} isolation limits.`,
      metadata: { ...routeProfile, timestamp },
      timestamp
    });

    return routeProfile;
  }
}

export default TenantPartitioner;
