export function getTrafficPrediction(slots = []) {
  const totalSlots = slots.length;
  const availableSlots = slots.filter((slot) => slot.status === 'available').length;
  const availability = totalSlots ? availableSlots / totalSlots : 0;
  const hour = new Date().getHours();

  let label = 'Parking availability';
  let level = 'Normal traffic';
  let recommendation = 'Review availability and choose a slot soon.';
  let accent = '#3A82F7';

  if (hour >= 6 && hour < 12) {
    label = 'Morning rush';
  } else if (hour >= 12 && hour < 18) {
    label = 'Afternoon demand';
  } else {
    label = 'Evening window';
  }

  if (availability <= 0.2) {
    level = 'Very low availability';
    recommendation = 'Reserve a parking slot now to avoid full lots.';
    accent = '#C0392B';
  } else if (availability <= 0.5) {
    level = 'Limited availability';
    recommendation = 'Slots are filling fast — book soon.';
    accent = '#D68910';
  } else {
    level = 'Good availability';
    recommendation = 'Parking is still available across nearby lots.';
    accent = '#27AE60';
  }

  return {
    label,
    level,
    recommendation,
    accent,
  };
}
