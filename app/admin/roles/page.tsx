import { redirect } from 'next/navigation';

export default function RolesRedirectPage() {
  redirect('/admin/staff?tab=permissions');
}
