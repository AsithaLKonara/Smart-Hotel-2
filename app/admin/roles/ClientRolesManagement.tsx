'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientRolesManagement() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/staff?tab=permissions');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh] text-zinc-500 font-mono text-xs">
      Redirecting to Staff Permissions Matrix...
    </div>
  );
}
