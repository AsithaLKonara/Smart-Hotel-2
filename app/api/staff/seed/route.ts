import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function POST() {
  try {
    // 1. Define Master Permissions
    const permissions = [
      { action: 'manage:bookings', description: 'Can create and modify bookings' },
      { action: 'manage:folios', description: 'Can post charges and process payments' },
      { action: 'manage:housekeeping', description: 'Can update room statuses' },
      { action: 'manage:channels', description: 'Can configure OTA mappings' },
      { action: 'run:night_audit', description: 'Can execute End of Day processing' },
      { action: 'view:reports', description: 'Can view executive analytics' },
    ]

    for (const p of permissions as any[]) {
      await prisma.permission.upsert({
        where: { action: p.action },
        update: {},
        create: p
      })
    }

    const allPerms = await prisma.permission.findMany()
    const pMap = Object.fromEntries(allPerms.map((p: any) => [p.action, p.id]))

    // 2. Define Master Roles & Map Permissions
    const roleDefinitions = [
      {
        name: 'GENERAL_MANAGER',
        description: 'Full system access',
        perms: Object.values(pMap) // Gets everything
      },
      {
        name: 'FRONT_DESK',
        description: 'Handles guests and billing',
        perms: [pMap['manage:bookings'], pMap['manage:folios']]
      },
      {
        name: 'HOUSEKEEPING_MGR',
        description: 'Manages room inventory state',
        perms: [pMap['manage:housekeeping']]
      },
      {
        name: 'REVENUE_MANAGER',
        description: 'Manages pricing and distribution',
        perms: [pMap['manage:channels'], pMap['view:reports']]
      }
    ]

    for (const rd of roleDefinitions) {
      const role = await prisma.role.upsert({
        where: { name: rd.name },
        update: { description: rd.description },
        create: { name: rd.name, description: rd.description }
      })

      // Wipe and rebuild RolePermission
      await prisma.rolePermission.deleteMany({ where: { roleId: role.id } })
      
      const rolePerms = rd.perms.filter(Boolean).map(permId => ({
        roleId: role.id,
        permissionId: permId
      }))

      if (rolePerms.length > 0) {
        await prisma.rolePermission.createMany({ data: rolePerms })
      }
    }

    return NextResponse.json({ success: true, message: 'RBAC Master Hierarchy Seeded' })
  } catch (error: any) {
    console.error('RBAC Seed Error:', error)
    return NextResponse.json({ error: 'Failed to seed RBAC' }, { status: 500 })
  }
}
