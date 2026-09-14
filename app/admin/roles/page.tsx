import React from 'react';
import ClientRolesManagement from './ClientRolesManagement';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function RolesManagementPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/signin');
  }
  // Pre-fetch initial data to render faster
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

  const permissions = await prisma.permission.findMany({
    orderBy: [
      { module: 'asc' },
      { displayName: 'asc' }
    ]
  });

  const groupedPermissions = permissions.reduce((acc: any, perm: any) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {});

  const staff = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      roleId: true,
      role: {
        select: { name: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  return (
    <ClientRolesManagement 
      initialRoles={roles} 
      groupedPermissions={groupedPermissions} 
      initialStaff={staff} 
    />
  );
}
