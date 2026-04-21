import type { Locale } from "@/i18n/config";

// Historical events worth marking on a long-history chart. Kept short so
// labels don't crowd the series line. Only macro events that moved many
// markets at once — no asset-specific news (earnings, forks, etc).
//
// Dates are ISO yyyy-mm-dd. For multi-day events the market-impact date
// is used (e.g. COVID = WHO pandemic declaration, not patient zero).

export type MarketEvent = {
  t: string; // ISO date
  label: Record<Locale, string>;
};

export const EVENTS: MarketEvent[] = [
  {
    t: "1929-10-29",
    label: {
      en: "Black Tuesday",
      de: "Schwarzer Dienstag",
      ru: "Чёрный вторник",
    },
  },
  {
    t: "1971-08-15",
    label: {
      en: "End of gold standard",
      de: "Ende des Goldstandards",
      ru: "Конец золотого стандарта",
    },
  },
  {
    t: "1973-10-06",
    label: { en: "Oil embargo", de: "Ölembargo", ru: "Нефтяное эмбарго" },
  },
  {
    t: "1987-10-19",
    label: {
      en: "Black Monday",
      de: "Schwarzer Montag",
      ru: "Чёрный понедельник",
    },
  },
  {
    t: "1997-07-02",
    label: {
      en: "Asian crisis",
      de: "Asienkrise",
      ru: "Азиатский кризис",
    },
  },
  {
    t: "2000-03-10",
    label: { en: "Dot-com peak", de: "Dotcom-Gipfel", ru: "Пик доткомов" },
  },
  {
    t: "2001-09-11",
    label: { en: "9/11 attacks", de: "11. September", ru: "11 сентября" },
  },
  {
    t: "2008-09-15",
    label: {
      en: "Lehman collapses",
      de: "Lehman-Pleite",
      ru: "Крах Lehman",
    },
  },
  {
    t: "2010-05-06",
    label: { en: "Flash crash", de: "Flash Crash", ru: "Флэш-крэш" },
  },
  {
    t: "2011-08-05",
    label: {
      en: "US debt downgrade",
      de: "US-Rating-Herabstufung",
      ru: "Понижение рейтинга США",
    },
  },
  {
    t: "2015-08-24",
    label: {
      en: "China market crash",
      de: "Chinas Börsencrash",
      ru: "Обвал рынка Китая",
    },
  },
  {
    t: "2016-06-23",
    label: {
      en: "Brexit vote",
      de: "Brexit-Votum",
      ru: "Голосование по Brexit",
    },
  },
  {
    t: "2020-03-11",
    label: {
      en: "COVID pandemic",
      de: "COVID-Pandemie",
      ru: "Пандемия COVID",
    },
  },
  {
    t: "2020-03-23",
    label: {
      en: "COVID market low",
      de: "COVID-Tief",
      ru: "Минимум COVID",
    },
  },
  {
    t: "2022-02-24",
    label: {
      en: "Russia invades Ukraine",
      de: "Russlands Ukraine-Einmarsch",
      ru: "Вторжение России в Украину",
    },
  },
  {
    t: "2022-03-16",
    label: {
      en: "Fed lift-off",
      de: "Fed-Zinswende",
      ru: "Разворот ставок ФРС",
    },
  },
  {
    t: "2023-03-10",
    label: {
      en: "SVB collapse",
      de: "SVB-Kollaps",
      ru: "Крах SVB",
    },
  },
  {
    t: "2024-01-10",
    label: {
      en: "Spot Bitcoin ETFs approved",
      de: "Spot-Bitcoin-ETFs zugelassen",
      ru: "Одобрены спотовые Bitcoin-ETF",
    },
  },
];
