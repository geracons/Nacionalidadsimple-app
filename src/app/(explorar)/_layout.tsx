import { TabStack } from '@/components/tab-stack';

export const unstable_settings = { anchor: 'explorar' };

export default function Layout() {
  return <TabStack root="explorar" />;
}
