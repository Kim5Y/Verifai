import { Region } from "../region.enums";


export const COUNTRY_RULES: Record<
  Region,
  string[]
> = {
  [Region.UK]: [
    'uk',
    'united kingdom',
    'angleterre',
    'england',
  ],

  [Region.FRANCE]: [
    'france',
    'français',
    'french',
  ],

  [Region.NIGERIA]: [
    'nigeria',
    'naija',
  ],

  [Region.USA]: [
    'usa',
    'america',
    'united states',
  ],

  [Region.EU]: [
    'european union',
    'eu',
  ],
};