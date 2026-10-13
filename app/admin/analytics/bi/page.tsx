import { redirect } from 'next/navigation';

export default function BiRedirectPage() {
  redirect('/admin/dashboard');
}
