import { redirect } from 'next/navigation';

export default function AppMarketplaceRedirectPage() {
  redirect('/admin/integrations/channel-manager');
}
