import { redirect } from 'next/navigation';

export default function GlobalCommandCenterRedirectPage() {
  redirect('/admin/dashboard');
}
