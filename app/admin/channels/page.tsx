import { redirect } from 'next/navigation';

export default function ChannelsRedirectPage() {
  redirect('/admin/integrations/channel-manager');
}
