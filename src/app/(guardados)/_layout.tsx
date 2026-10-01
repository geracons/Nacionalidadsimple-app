import { TabStack } from '@/components/tab-stack';

export const unstable_settings = { anchor: 'guardados' };

export default function Layout() {
  return <TabStack root="guardados" />;
}
