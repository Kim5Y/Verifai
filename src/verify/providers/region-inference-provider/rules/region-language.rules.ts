import { Region } from '../region.enums';

export const LANGUAGE_RULES: Record<
  string,
  Region[]
> = {
  french: [
    Region.FRANCE,
    Region.EU,
  ],

  français: [
    Region.FRANCE,
    Region.EU,
  ],

  fr: [
    Region.FRANCE,
    Region.EU,
  ],

  english: [
    Region.UK,
    Region.USA,
  ],

  en: [
    Region.UK,
    Region.USA,
  ],
};