import { TabStack } from '@/components/tab-stack';

export const unstable_settings = { anchor: 'servicios' };

export default function Layout() {
  return <TabStack root="servicios" />;
}
