export interface Station {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  powerKw: number;
  createdBy: string | null;
  createdAt: string;
}

export interface StationWithActivity extends Station {
  activeReservations: number;
  hasCharging: boolean;
  hasReserved: boolean;
}
