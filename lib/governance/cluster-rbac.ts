import { prisma } from '@/lib/db'

export type ClusterRoleType =
  | 'REGIONAL_DIRECTOR'
  | 'CLUSTER_REVENUE_MANAGER'
  | 'CLUSTER_GENERAL_MANAGER'

export interface CreateClusterInput {
  name: string
  code: string
  region: string
  propertyIds: string[]
  description?: string
  actorUserId?: string
}

export interface AssignUserClusterInput {
  userId: string
  clusterId: string
  clusterRole: ClusterRoleType
  actorUserId?: string
}

export interface PropertyCluster {
  id: string
  name: string
  code: string
  region: string
  description?: string
  propertyIds: string[]
  properties?: Array<{ id: string; name: string; code: string }>
  createdAt: string
  updatedAt: string
}

export interface UserClusterScope {
  userId: string
  userName: string
  role: string
  isGlobal: boolean
  clusterRole?: ClusterRoleType
  clusterId?: string
  clusterName?: string
  authorizedPropertyIds: string[]
}

/**
 * Creates a geographic or operational property cluster
 */
export async function createPropertyCluster(input: CreateClusterInput) {
  const { name, code, region, propertyIds, description, actorUserId } = input

  if (!name || !code || !propertyIds || propertyIds.length === 0) {
    throw new Error('name, code, and at least one propertyId are required')
  }

  // Verify all properties exist
  const properties = await prisma.property.findMany({
    where: { id: { in: propertyIds } },
    select: { id: true, name: true, code: true }
  })

  if (properties.length !== propertyIds.length) {
    throw new Error('One or more property IDs are invalid')
  }

  const clusterId = `cluster-${code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`

  const clusterData = {
    clusterId,
    name,
    code: code.toUpperCase().trim(),
    region,
    description,
    propertyIds,
    properties,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  const audit = await prisma.auditLog.create({
    data: {
      userId: actorUserId || null,
      actor: actorUserId ? `User:${actorUserId}` : 'GOVERNANCE_SYSTEM',
      action: 'CLUSTER_CREATED',
      resource: 'PropertyCluster',
      resourceId: clusterId,
      details: clusterData
    }
  })

  return {
    id: audit.id,
    ...clusterData
  }
}

/**
 * Assigns a user to a regional or cluster role with scoped property authority
 */
export async function assignUserToCluster(input: AssignUserClusterInput) {
  const { userId, clusterId, clusterRole, actorUserId } = input

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true, property: true }
  })

  if (!user) {
    throw new Error(`User with ID ${userId} not found`)
  }

  // Find cluster record in AuditLog
  const clusterLog = await prisma.auditLog.findFirst({
    where: {
      resource: 'PropertyCluster',
      resourceId: clusterId
    }
  })

  if (!clusterLog) {
    throw new Error(`Cluster with ID [${clusterId}] not found`)
  }

  const clusterDetails = clusterLog.details as any

  const assignmentData = {
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    clusterId: clusterDetails.clusterId,
    clusterName: clusterDetails.name,
    clusterCode: clusterDetails.code,
    clusterRole,
    authorizedPropertyIds: clusterDetails.propertyIds,
    assignedAt: new Date().toISOString(),
    assignedBy: actorUserId || 'SYSTEM'
  }

  const audit = await prisma.auditLog.create({
    data: {
      userId: actorUserId || user.id,
      actor: actorUserId ? `User:${actorUserId}` : 'GOVERNANCE_SYSTEM',
      action: 'USER_CLUSTER_ASSIGNED',
      resource: 'UserClusterAssignment',
      resourceId: user.id,
      details: assignmentData
    }
  })

  return {
    id: audit.id,
    ...assignmentData
  }
}

/**
 * Resolves a user's cluster authority scope
 */
export async function getUserClusterScope(userId: string): Promise<UserClusterScope> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true, property: true }
  })

  if (!user) {
    throw new Error(`User with ID ${userId} not found`)
  }

  const roleName = user.role?.name || (user as any).role || 'STAFF'

  // Super Admin has global access to all properties
  if (roleName === 'SUPER_ADMIN') {
    const allProps = await prisma.property.findMany({ select: { id: true } })
    return {
      userId: user.id,
      userName: user.name,
      role: 'SUPER_ADMIN',
      isGlobal: true,
      authorizedPropertyIds: allProps.map((p) => p.id)
    }
  }

  // Check if user has an active cluster assignment
  const clusterAssignment = await prisma.auditLog.findFirst({
    where: {
      resource: 'UserClusterAssignment',
      resourceId: user.id
    },
    orderBy: { createdAt: 'desc' }
  })

  if (clusterAssignment) {
    const details = clusterAssignment.details as any
    return {
      userId: user.id,
      userName: user.name,
      role: details.clusterRole,
      isGlobal: false,
      clusterRole: details.clusterRole,
      clusterId: details.clusterId,
      clusterName: details.clusterName,
      authorizedPropertyIds: details.authorizedPropertyIds || []
    }
  }

  // Property-bound single property access
  return {
    userId: user.id,
    userName: user.name,
    role: roleName,
    isGlobal: false,
    authorizedPropertyIds: user.propertyId ? [user.propertyId] : []
  }
}

/**
 * Validates whether a user has permission to manage or view a target property
 */
export async function validateClusterAccess(userId: string, targetPropertyId: string): Promise<boolean> {
  const scope = await getUserClusterScope(userId)

  if (scope.isGlobal) {
    return true
  }

  if (scope.authorizedPropertyIds.includes(targetPropertyId)) {
    return true
  }

  throw new Error(
    `Access Forbidden: User [${scope.userName}] with scope [${scope.clusterName || scope.role}] is not authorized to access Property ID [${targetPropertyId}]`
  )
}

/**
 * Lists all defined property clusters
 */
export async function listPropertyClusters(): Promise<PropertyCluster[]> {
  const logs = await prisma.auditLog.findMany({
    where: { resource: 'PropertyCluster' },
    orderBy: { createdAt: 'desc' }
  })

  return logs.map((log) => ({
    id: log.id,
    ...(log.details as any)
  }))
}
