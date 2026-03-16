export type Staff = { employeeId: string; displayName: string; email: string };

export type Equipment = {
  id: string | null;
  assetTag: string;
  serial?: string;
  model?: string;
  assignedToEmployeeId: string;
  source: string;
};

export type Me = { employeeId: string; displayName: string; email: string; isManager: boolean };

export type DashboardData = {
  me: Me;
  staff: Staff[];
  equipment: Equipment[];
  equipmentByEmployee: Record<string, Equipment[]>;
};
