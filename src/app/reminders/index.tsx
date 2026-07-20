import { ListModule } from '@/components/ListModule';
import { hub } from '@/lib/api';

export default function Reminders() {
  return (
    <ListModule
      fetcher={async () => (await hub.plans()).plans}
      emptyIcon="time-outline"
      emptyTitle="No maintenance plans"
      emptyMessage="Scheduled maintenance plans and reminders will appear here."
    />
  );
}
