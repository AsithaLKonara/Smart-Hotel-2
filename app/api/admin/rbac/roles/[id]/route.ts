import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const roleId = params.id;
    const { name, description, status, permissionIds } = await req.json();

    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Update basic info
      const updatedRole = await tx.role.update({
        where: { id: roleId },
        data: { name, description, status }
      });

      // 2. Overwrite permissions (delete all, insert new)
      if (permissionIds !== undefined) {
        await tx.rolePermission.deleteMany({
          where: { roleId }
        });

        if (permissionIds.length > 0) {
          const rolePermissions = permissionIds.map((pid: string) => ({
            roleId,
            permissionId: pid
          }));
          await tx.rolePermission.createMany({
            data: rolePermissions
          });
        }
      }

      return updatedRole;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Failed to update role', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Role name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const roleId = params.id;
    
    const role = await prisma.role.findUnique({ 
      where: { id: roleId },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (!role.isCustom) {
      return NextResponse.json({ error: 'Cannot delete system roles' }, { status: 400 });
    }

    if (role._count.users > 0) {
      return NextResponse.json({ error: 'Cannot delete role with assigned users' }, { status: 400 });
    }

    await prisma.role.delete({
      where: { id: roleId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete role', error);
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
}
