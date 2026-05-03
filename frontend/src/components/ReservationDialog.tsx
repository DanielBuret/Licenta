export function ReservationDialog({ onClose }: { stationId: number; onClose: () => void }) {
  return (
    <div role="dialog" style={{ position: 'fixed', inset: 0 }}>
      <button onClick={onClose}>Closed</button>
    </div>
  );
}
