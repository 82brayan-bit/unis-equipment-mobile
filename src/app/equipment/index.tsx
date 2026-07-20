import { useRouter } from 'expo-router';

import { ListModule } from '@/components/ListModule';
import { hub } from '@/lib/api';

export default function EquipmentList() {
  const router = useRouter();
  return (
    <ListModule
      fetcher={async () => (await hub.equipment()).equipment}
      emptyIcon="car-outline"
      emptyTitle="No equipment yet"
      emptyMessage="Equipment added in the hub for this facility will appear here."
      intro="Tap an item to view details."
      onPressRow={(row) =>
        row.id ? router.push(`/equipment/${row.id}` as any) : undefined
      }
    />
  );
}
