import { redirect } from 'next/navigation';

export default function OtaRedirectPage() {
  redirect('/admin/integrations/channel-manager');
}
