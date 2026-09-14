import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: { users: true, permissions: true }
        },
        permissions: {
          include: { permission: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(roles);
  } catch (error) {
    console.error('Failed to fetch roles', error);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, status, permissionIds } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const role = await tx.role.create({
        data: {
          name,
          description,
          status,
          isCustom: true
        }
      });

      if (permissionIds && permissionIds.length > 0) {
        const rolePermissions = permissionIds.map((pid: string) => ({
          roleId: role.id,
          permissionId: pid
        }));
        
        await tx.rolePermission.createMany({
          data: rolePermissions
        });
      }

      return role;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create role', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Role name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}
