import { Bike, Car, CarFront, Zap } from 'lucide-react';

const ICONS = { BIKE: Bike, CAR: Car, SUV: CarFront, ELECTRIC: Zap };
export default function VehicleIcon({ type, size = 20 }) {
  const Icon = ICONS[type] || Car;
  return <Icon size={size} aria-hidden="true" />;
}
