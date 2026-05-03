import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import styled from 'styled-components';
import { useStations } from '../../hooks/useStations';
import { buildStationIcon, statusFromStation } from '../../components/Map/markerIcons';
import { Button } from '../../components/ui';
import { StationFormDialog, type StationFormValues } from './StationFormDialog';
import {
  useCreateStation,
  useUpdateStation,
  useDeleteStation,
} from '../../hooks/useAdminStationMutations';
import '../../components/Map/leaflet-overrides.css';

const ORADEA_CENTER: [number, number] = [47.0722, 21.9211];

const PopupBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
  min-width: 220px;
`;

const Row = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
`;

interface ClickHandlerProps {
  onClick: (lat: number, lon: number) => void;
}

function ClickHandler({ onClick }: ClickHandlerProps) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface DraftStation {
  latitude: number;
  longitude: number;
}

interface EditingStation {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  powerKw: number;
}

export function AdminMap() {
  const { data: stations = [] } = useStations();
  const [draft, setDraft] = useState<DraftStation | null>(null);
  const [editing, setEditing] = useState<EditingStation | null>(null);
  const create = useCreateStation();
  const update = useUpdateStation();
  const remove = useDeleteStation();

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <MapContainer center={ORADEA_CENTER} zoom={13} scrollWheelZoom style={{ height: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onClick={(lat, lon) => setDraft({ latitude: lat, longitude: lon })} />
        {stations.map((s) => (
          <Marker
            key={s.id}
            position={[s.latitude, s.longitude]}
            icon={buildStationIcon(
              statusFromStation(s),
              s.activeReservations > 0 ? s.activeReservations : undefined,
            )}
          >
            <Popup>
              <PopupBody>
                <strong>{s.name}</strong>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{s.address}</span>
                <span style={{ fontSize: '0.875rem' }}>{s.powerKw} kW</span>
                <Row>
                  <Button
                    $variant="secondary"
                    onClick={() =>
                      setEditing({
                        id: s.id,
                        name: s.name,
                        address: s.address,
                        latitude: s.latitude,
                        longitude: s.longitude,
                        powerKw: s.powerKw,
                      })
                    }
                  >
                    Editează
                  </Button>
                  <Button
                    $variant="danger"
                    onClick={async () => {
                      if (!confirm(`Ștergi „${s.name}”?`)) return;
                      try {
                        await remove.mutateAsync(s.id);
                      } catch (err: any) {
                        alert(
                          err?.response?.data?.error?.message ??
                            'Stația nu poate fi ștearsă (poate are rezervări active).',
                        );
                      }
                    }}
                    disabled={remove.isPending}
                  >
                    Șterge
                  </Button>
                </Row>
              </PopupBody>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {draft && (
        <StationFormDialog
          initial={{ latitude: draft.latitude, longitude: draft.longitude }}
          title="Adăugare stație"
          submitLabel="Adaugă stația"
          onClose={() => setDraft(null)}
          onSubmit={async (values: StationFormValues) => {
            await create.mutateAsync(values);
          }}
        />
      )}
      {editing && (
        <StationFormDialog
          initial={editing}
          title={`Editare „${editing.name}”`}
          submitLabel="Salvează"
          onClose={() => setEditing(null)}
          onSubmit={async (values: StationFormValues) => {
            await update.mutateAsync({ id: editing.id, ...values });
          }}
        />
      )}
    </div>
  );
}
