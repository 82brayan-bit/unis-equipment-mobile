import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type ModuleDef = {
  slug: string;
  title: string;
  subtitle: string;
  icon: IoniconName;
  /** Route to push. Live modules have dedicated screens; others use the generic stub. */
  route: string;
  /** Whether a real hub API backs this module today. */
  live: boolean;
};

/**
 * Mirrors the UNIS Equipment Hub web sidebar. `live` modules are wired to real
 * endpoints; the rest render an informative placeholder until the hub exposes
 * an API for them.
 */
export const MODULES: ModuleDef[] = [
  { slug: 'dashboard', title: 'Dashboard', subtitle: 'Fleet health at a glance', icon: 'speedometer-outline', route: '/', live: true },
  { slug: 'fleet-map', title: 'Fleet Map', subtitle: 'Equipment locations', icon: 'map-outline', route: '/module/fleet-map', live: false },
  { slug: 'equipment', title: 'Vehicles', subtitle: 'Equipment register', icon: 'car-outline', route: '/equipment', live: true },
  { slug: 'inspections', title: 'Inspections', subtitle: 'Run checks & upload', icon: 'clipboard-outline', route: '/inspections', live: true },
  { slug: 'issues', title: 'Issues', subtitle: 'Reported problems', icon: 'warning-outline', route: '/module/issues', live: false },
  { slug: 'reminders', title: 'Reminders', subtitle: 'Maintenance plans', icon: 'time-outline', route: '/reminders', live: true },
  { slug: 'service', title: 'Service', subtitle: 'Work orders', icon: 'construct-outline', route: '/work-orders', live: true },
  { slug: 'shop-network', title: 'Shop Network', subtitle: 'Service shops', icon: 'globe-outline', route: '/module/shop-network', live: false },
  { slug: 'contacts', title: 'Contacts', subtitle: 'People', icon: 'people-outline', route: '/module/contacts', live: false },
  { slug: 'vendors', title: 'Vendors', subtitle: 'Suppliers', icon: 'business-outline', route: '/module/vendors', live: false },
  { slug: 'parts', title: 'Parts & Inventory', subtitle: 'Stock & parts', icon: 'layers-outline', route: '/module/parts', live: false },
  { slug: 'fuel', title: 'Fuel & Energy', subtitle: 'Fuel & charging', icon: 'flash-outline', route: '/module/fuel', live: false },
  { slug: 'meter-readings', title: 'Meter Readings', subtitle: 'Hours & odometer', icon: 'stats-chart-outline', route: '/meter-readings', live: true },
  { slug: 'places', title: 'Places', subtitle: 'Locations', icon: 'location-outline', route: '/module/places', live: false },
  { slug: 'motor-pool', title: 'Motor Pool', subtitle: 'Shared equipment', icon: 'people-circle-outline', route: '/module/motor-pool', live: false },
  { slug: 'documents', title: 'Documents', subtitle: 'Files', icon: 'document-text-outline', route: '/module/documents', live: false },
  { slug: 'warranties', title: 'Warranties', subtitle: 'Coverage', icon: 'shield-checkmark-outline', route: '/module/warranties', live: false },
  { slug: 'reports', title: 'Reports', subtitle: 'Costs & analytics', icon: 'bar-chart-outline', route: '/reports', live: true },
];

export const moduleBySlug = (slug: string): ModuleDef | undefined =>
  MODULES.find((m) => m.slug === slug);
