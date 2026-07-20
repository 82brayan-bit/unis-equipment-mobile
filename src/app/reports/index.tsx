import { ListModule } from '@/components/ListModule';
import { hub } from '@/lib/api';

export default function Reports() {
  return (
    <ListModule
      fetcher={async () => (await hub.costs()).costs}
      emptyIcon="bar-chart-outline"
      emptyTitle="No cost records"
      emptyMessage="Maintenance cost records for this facility will appear here."
      intro="Maintenance costs for this facility."
    />
  );
}
