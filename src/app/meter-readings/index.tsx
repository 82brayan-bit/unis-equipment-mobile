import { ListModule } from '@/components/ListModule';
import { hub } from '@/lib/api';

export default function MeterReadings() {
  return (
    <ListModule
      fetcher={async () => (await hub.meterReadings()).readings}
      emptyIcon="stats-chart-outline"
      emptyTitle="No meter readings"
      emptyMessage="Hours and odometer readings for this facility will appear here."
    />
  );
}
