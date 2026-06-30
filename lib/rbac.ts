import prisma from '@/lib/db'

export * from './rbac-utils'

/**
 * Enterprise RBAC Authorization Engine
 * Checks if a specific User ID holds a specific Permission action string.
 */
export async function hasPermission(userId: string, action: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    })

    if (!user || !user.role) return false

    // General Manager override - has implicit root access
    if (user.role.name === 'GENERAL_MANAGER') return true

    // Check specific permission
    const hasPerm = user.role.permissions.some((rp: any) => rp.permission.action === action)
    return hasPerm

  } catch (error) {
    console.error('RBAC check failed:', error)
    return false
  }
}
