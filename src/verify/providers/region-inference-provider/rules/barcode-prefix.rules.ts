import { Region } from '../region.enums';
import { BarcodePrefixRule } from './region-rule.types';

const range2 = (start: number, end: number): string[] => {
  const values: string[] = [];
  for (let i = start; i <= end; i += 1) {
    values.push(i.toString().padStart(2, '0'));
  }
  return values;
};

const range3 = (start: number, end: number): string[] => {
  const values: string[] = [];
  for (let i = start; i <= end; i += 1) {
    values.push(i.toString().padStart(3, '0'));
  }
  return values;
};

export const barcodePrefixRules: BarcodePrefixRule[] = [
  ...range2(0, 13).map((prefix) => ({
    prefix,
    regions: [Region.USA, Region.CANADA],
  })),
  { prefix: '50', regions: [Region.UK] },
  ...range2(30, 37).map((prefix) => ({ prefix, regions: [Region.FRANCE] })),
  ...range3(789, 790).map((prefix) => ({ prefix, regions: [Region.BRAZIL] })),
  { prefix: '890', regions: [Region.INDIA] },
  ...range2(45, 49).map((prefix) => ({ prefix, regions: [Region.JAPAN] })),
  { prefix: '93', regions: [Region.AUSTRALIA] },
  { prefix: '94', regions: [Region.NEW_ZEALAND] },
  { prefix: '615', regions: [Region.NIGERIA] },
];

