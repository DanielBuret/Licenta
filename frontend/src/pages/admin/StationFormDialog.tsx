import styled from 'styled-components';
import { useEffect, useState } from 'react';
import { Button, Dialog, Input, Field } from '../../components/ui';
import { reverseGeocode, forwardGeocode } from '../../lib/nominatim';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(4)};
`;

const Row = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(3)};
`;

const ErrorBanner = styled.div`
  padding: ${({ theme }) => `${theme.spacing(3)} ${theme.spacing(4)}`};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.dangerSoft};
  color: ${({ theme }) => theme.colors.danger};
  font-size: 0.875rem;
  font-weight: 500;
`;

export interface StationFormValues {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  powerKw: number;
}

interface Props {
  initial: Partial<StationFormValues>;
  title: string;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (values: StationFormValues) => Promise<void>;
}

export function StationFormDialog({ initial, title, submitLabel, onClose, onSubmit }: Props) {
  const [name, setName] = useState(initial.name ?? '');
  const [address, setAddress] = useState(initial.address ?? '');
  const [latitude, setLatitude] = useState(initial.latitude?.toString() ?? '');
  const [longitude, setLongitude] = useState(initial.longitude?.toString() ?? '');
  const [powerKw, setPowerKw] = useState(initial.powerKw?.toString() ?? '50');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (initial.latitude != null && initial.longitude != null && !initial.address) {
      setGeocoding(true);
      reverseGeocode(initial.latitude, initial.longitude).then((display) => {
        if (cancelled) return;
        if (display) setAddress(display);
        setGeocoding(false);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [initial.latitude, initial.longitude, initial.address]);

  async function lookupAddress() {
    if (!address.trim()) return;
    setGeocoding(true);
    const r = await forwardGeocode(address);
    setGeocoding(false);
    if (!r) {
      setError('Nu am găsit această adresă.');
      return;
    }
    setLatitude(r.lat.toString());
    setLongitude(r.lon.toString());
    setAddress(r.displayName);
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const lat = Number(latitude);
    const lon = Number(longitude);
    const pw = Number(powerKw);
    if (!name.trim() || !address.trim()) {
      setError('Numele și adresa sunt obligatorii.');
      return;
    }
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      setError('Latitudine invalidă.');
      return;
    }
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
      setError('Longitudine invalidă.');
      return;
    }
    if (!Number.isFinite(pw) || pw <= 0) {
      setError('Puterea trebuie să fie un număr pozitiv.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        address: address.trim(),
        latitude: lat,
        longitude: lon,
        powerKw: pw,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? 'Eroare la salvare.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog title={title} onClose={onClose}>
      <Form onSubmit={submit}>
        <Field label="Nume stație">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Adresă" hint="Introdu adresa și apasă „Caută” pentru auto-coordonate.">
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={geocoding}
          />
        </Field>
        <Row>
          <Button type="button" $variant="secondary" onClick={lookupAddress} disabled={geocoding}>
            {geocoding ? 'Caut…' : 'Caută adresa'}
          </Button>
        </Row>
        <Row>
          <Field label="Latitudine">
            <Input value={latitude} onChange={(e) => setLatitude(e.target.value)} />
          </Field>
          <Field label="Longitudine">
            <Input value={longitude} onChange={(e) => setLongitude(e.target.value)} />
          </Field>
        </Row>
        <Field label="Putere (kW)">
          <Input
            type="number"
            min={1}
            step="0.1"
            value={powerKw}
            onChange={(e) => setPowerKw(e.target.value)}
          />
        </Field>
        {error && <ErrorBanner>{error}</ErrorBanner>}
        <Row>
          <Button type="button" $variant="secondary" $full onClick={onClose}>
            Renunță
          </Button>
          <Button type="submit" $full disabled={submitting || geocoding}>
            {submitting ? 'Se salvează…' : submitLabel}
          </Button>
        </Row>
      </Form>
    </Dialog>
  );
}
