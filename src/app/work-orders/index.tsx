import { ListModule } from '@/components/ListModule';
import { hub } from '@/lib/api';

export default function WorkOrders() {
  return (
    <ListModule
      fetcher={async () => (await hub.workOrders()).work_orders}
      emptyIcon="construct-outline"
      emptyTitle="No work orders"
      emptyMessage="Service work orders for this facility will appear here."
    />
  );
}
