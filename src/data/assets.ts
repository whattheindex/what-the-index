import type { Locale } from "@/i18n/config";

export type AssetCategory =
  | "index"
  | "commodity"
  | "fx"
  | "crypto"
  | "rates"
  | "derived";

type Localized = Record<Locale, string>;

export type Asset = {
  symbol: string;
  name: string;
  shortName: string;
  category: AssetCategory;
  currency: string;
  unit?: string;
  description: Localized;
  source: string;
};

export const ASSETS: Asset[] = [
  // Indices
  {
    symbol: "sp500",
    name: "S&P 500",
    shortName: "S&P 500",
    category: "index",
    currency: "USD",
    description: {
      en: "Shiller's monthly S&P Composite since 1871, spliced with FRED's daily S&P 500 for the last ~10 years.",
      de: "Shillers monatliche S&P-Composite-Reihe ab 1871, verknüpft mit FREDs täglichem S&P 500 für die letzten ~10 Jahre.",
      ru: "Ежемесячная серия S&P Composite Шиллера с 1871 года, склеенная с ежедневным S&P 500 от FRED за последние ~10 лет.",
    },
    source: "Shiller + FRED / SP500",
  },
  {
    symbol: "nasdaq",
    name: "Nasdaq Composite",
    shortName: "Nasdaq",
    category: "index",
    currency: "USD",
    description: {
      en: "Tech-heavy US index. Daily since 1971.",
      de: "Technologielastiger US-Index. Täglich seit 1971.",
      ru: "Технологический индекс США. Ежедневно с 1971 года.",
    },
    source: "FRED — NASDAQCOM",
  },
  {
    symbol: "djia",
    name: "Dow Jones Industrial Average",
    shortName: "Dow Jones",
    category: "index",
    currency: "USD",
    description: {
      en: "30-stock US blue-chip index. Daily history from FRED.",
      de: "US-Blue-Chip-Index mit 30 Werten. Tägliche Historie von FRED.",
      ru: "Индекс 30 американских голубых фишек. Ежедневная история из FRED.",
    },
    source: "FRED — DJIA",
  },
  {
    symbol: "djca",
    name: "Dow Jones Composite Average",
    shortName: "DJ Composite",
    category: "index",
    currency: "USD",
    description: {
      en: "65 US large-caps spanning industrials, transports and utilities — a broader proxy for old-economy America than the DJIA alone.",
      de: "65 große US-Werte aus Industrie, Transport und Versorgern — eine breitere Old-Economy-Abbildung als der DJIA allein.",
      ru: "65 крупных американских компаний из промышленности, транспорта и коммунальных услуг — более широкий срез «старой экономики», чем только DJIA.",
    },
    source: "FRED — DJCA",
  },
  {
    symbol: "djta",
    name: "Dow Jones Transportation Average",
    shortName: "DJ Transport",
    category: "index",
    currency: "USD",
    description: {
      en: "20 US transportation stocks (rail, air, trucking, shipping). Often read as a leading indicator for the broader economy.",
      de: "20 US-Transportwerte (Eisenbahn, Luftfahrt, Lkw, Schifffahrt). Gilt oft als Frühindikator für die Gesamtwirtschaft.",
      ru: "20 американских транспортных компаний (железные дороги, авиация, грузоперевозки, судоходство). Часто рассматривается как опережающий индикатор экономики.",
    },
    source: "FRED — DJTA",
  },
  {
    symbol: "djua",
    name: "Dow Jones Utility Average",
    shortName: "DJ Utility",
    category: "index",
    currency: "USD",
    description: {
      en: "15 US utility stocks — defensive, yield-sensitive, moves inversely to bond yields more than most sectors.",
      de: "15 US-Versorger-Werte — defensiv, zinsempfindlich, reagiert stärker als die meisten Sektoren invers auf Anleiherenditen.",
      ru: "15 американских коммунальных компаний — защитный сектор, чувствительный к ставкам; обычно движется в противоход доходности облигаций сильнее, чем большинство секторов.",
    },
    source: "FRED — DJUA",
  },
  {
    symbol: "nasdaq100",
    name: "Nasdaq 100",
    shortName: "Nasdaq 100",
    category: "index",
    currency: "USD",
    description: {
      en: "100 largest non-financial Nasdaq-listed firms — tech-dominated, more concentrated than the broader Nasdaq Composite. Daily since 1986.",
      de: "Die 100 größten nicht-finanziellen an der Nasdaq gelisteten Unternehmen — tech-dominiert, konzentrierter als der breitere Nasdaq Composite. Täglich seit 1986.",
      ru: "100 крупнейших нефинансовых компаний Nasdaq — технологический перекос, более концентрированный, чем широкий Nasdaq Composite. Ежедневно с 1986 года.",
    },
    source: "FRED — NASDAQ100",
  },
  {
    symbol: "nikkei",
    name: "Nikkei 225",
    shortName: "Nikkei",
    category: "index",
    currency: "JPY",
    description: {
      en: "Japan's benchmark stock index — 225 large-cap Tokyo-listed firms.",
      de: "Japans Leitindex — 225 große, in Tokio gelistete Unternehmen.",
      ru: "Основной индекс Японии — 225 крупных компаний, торгующихся в Токио.",
    },
    source: "FRED — NIKKEI225",
  },

  // Commodities
  {
    symbol: "gold",
    name: "Gold",
    shortName: "Gold",
    category: "commodity",
    currency: "USD",
    unit: "USD/oz",
    description: {
      en: "Monthly gold price per troy ounce going back to 1833 — nearly 200 years of history.",
      de: "Monatlicher Goldpreis pro Feinunze, zurück bis 1833 — fast 200 Jahre Historie.",
      ru: "Ежемесячная цена золота за тройскую унцию, с 1833 года — почти 200 лет истории.",
    },
    source: "datahub.io/core/gold-prices",
  },
  {
    symbol: "oil",
    name: "Crude Oil (WTI)",
    shortName: "WTI Oil",
    category: "commodity",
    currency: "USD",
    unit: "USD/barrel",
    description: {
      en: "West Texas Intermediate spot price. Daily since 1986.",
      de: "West Texas Intermediate Spotpreis. Täglich seit 1986.",
      ru: "Спотовая цена West Texas Intermediate. Ежедневно с 1986 года.",
    },
    source: "FRED — DCOILWTICO",
  },
  {
    symbol: "brent",
    name: "Crude Oil (Brent)",
    shortName: "Brent Oil",
    category: "commodity",
    currency: "USD",
    unit: "USD/barrel",
    description: {
      en: "Europe Brent spot price. Daily since 1987.",
      de: "Europäischer Brent-Spotpreis. Täglich seit 1987.",
      ru: "Европейская спотовая цена Brent. Ежедневно с 1987 года.",
    },
    source: "FRED — DCOILBRENTEU",
  },
  {
    symbol: "natgas",
    name: "Natural Gas (Henry Hub)",
    shortName: "Natural Gas",
    category: "commodity",
    currency: "USD",
    unit: "USD/MMBtu",
    description: {
      en: "Henry Hub spot price for natural gas. Daily since 1997.",
      de: "Henry-Hub-Spotpreis für Erdgas. Täglich seit 1997.",
      ru: "Спотовая цена природного газа Henry Hub. Ежедневно с 1997 года.",
    },
    source: "FRED — DHHNGSP",
  },
  {
    symbol: "copper",
    name: "Copper",
    shortName: "Copper",
    category: "commodity",
    currency: "USD",
    unit: "USD/MT",
    description: {
      en: "Copper price per metric ton. Monthly since 1992.",
      de: "Kupferpreis pro Tonne. Monatlich seit 1992.",
      ru: "Цена меди за метрическую тонну. Ежемесячно с 1992 года.",
    },
    source: "FRED — PCOPPUSDM",
  },
  {
    symbol: "aluminum",
    name: "Aluminum",
    shortName: "Aluminum",
    category: "commodity",
    currency: "USD",
    unit: "USD/MT",
    description: {
      en: "Aluminum price per metric ton. Monthly since 1992.",
      de: "Aluminiumpreis pro Tonne. Monatlich seit 1992.",
      ru: "Цена алюминия за метрическую тонну. Ежемесячно с 1992 года.",
    },
    source: "FRED — PALUMUSDM",
  },
  {
    symbol: "wheat",
    name: "Wheat",
    shortName: "Wheat",
    category: "commodity",
    currency: "USD",
    unit: "USD/MT",
    description: {
      en: "Wheat price per metric ton (IMF global benchmark). Monthly.",
      de: "Weizenpreis pro Tonne (IMF-Weltbenchmark). Monatlich.",
      ru: "Цена пшеницы за метрическую тонну (глобальный бенчмарк МВФ). Ежемесячно.",
    },
    source: "FRED — PWHEAMTUSDM",
  },

  // Crypto
  {
    symbol: "btc",
    name: "Bitcoin",
    shortName: "Bitcoin",
    category: "crypto",
    currency: "USD",
    description: {
      en: "Bitcoin price via Coinbase, daily since December 2014.",
      de: "Bitcoin-Preis via Coinbase, täglich seit Dezember 2014.",
      ru: "Цена биткоина через Coinbase, ежедневно с декабря 2014 года.",
    },
    source: "FRED — CBBTCUSD",
  },
  {
    symbol: "eth",
    name: "Ethereum",
    shortName: "Ethereum",
    category: "crypto",
    currency: "USD",
    description: {
      en: "Ethereum price via Coinbase, daily since 2016.",
      de: "Ethereum-Preis via Coinbase, täglich seit 2016.",
      ru: "Цена Ethereum через Coinbase, ежедневно с 2016 года.",
    },
    source: "FRED — CBETHUSD",
  },

  // FX
  {
    symbol: "eurusd",
    name: "Euro / US Dollar",
    shortName: "EUR/USD",
    category: "fx",
    currency: "USD",
    description: {
      en: "US Dollars per Euro. Daily since 1999.",
      de: "US-Dollar pro Euro. Täglich seit 1999.",
      ru: "Долларов США за один евро. Ежедневно с 1999 года.",
    },
    source: "FRED — DEXUSEU",
  },
  {
    symbol: "gbpusd",
    name: "British Pound / US Dollar",
    shortName: "GBP/USD",
    category: "fx",
    currency: "USD",
    description: {
      en: "US Dollars per British Pound. Daily since 1971.",
      de: "US-Dollar pro Britisches Pfund. Täglich seit 1971.",
      ru: "Долларов США за один британский фунт. Ежедневно с 1971 года.",
    },
    source: "FRED — DEXUSUK",
  },
  {
    symbol: "usdjpy",
    name: "US Dollar / Japanese Yen",
    shortName: "USD/JPY",
    category: "fx",
    currency: "JPY",
    description: {
      en: "Japanese Yen per US Dollar. Daily since 1971.",
      de: "Japanische Yen pro US-Dollar. Täglich seit 1971.",
      ru: "Японских иен за один доллар США. Ежедневно с 1971 года.",
    },
    source: "FRED — DEXJPUS",
  },
  {
    symbol: "usdchf",
    name: "US Dollar / Swiss Franc",
    shortName: "USD/CHF",
    category: "fx",
    currency: "CHF",
    description: {
      en: "Swiss Francs per US Dollar. Daily since 1971.",
      de: "Schweizer Franken pro US-Dollar. Täglich seit 1971.",
      ru: "Швейцарских франков за один доллар США. Ежедневно с 1971 года.",
    },
    source: "FRED — DEXSZUS",
  },
  {
    symbol: "usdcny",
    name: "US Dollar / Chinese Yuan",
    shortName: "USD/CNY",
    category: "fx",
    currency: "CNY",
    description: {
      en: "Chinese Yuan per US Dollar. Daily since 1981.",
      de: "Chinesische Yuan pro US-Dollar. Täglich seit 1981.",
      ru: "Китайских юаней за один доллар США. Ежедневно с 1981 года.",
    },
    source: "FRED — DEXCHUS",
  },

  // Rates & volatility
  {
    symbol: "vix",
    name: "VIX",
    shortName: "VIX",
    category: "rates",
    currency: "USD",
    unit: "index",
    description: {
      en: "CBOE Volatility Index — market-implied 30-day volatility of the S&P 500. Daily since 1990.",
      de: "CBOE-Volatilitätsindex — marktimplizite 30-Tage-Volatilität des S&P 500. Täglich seit 1990.",
      ru: "Индекс волатильности CBOE — подразумеваемая рынком 30-дневная волатильность S&P 500. Ежедневно с 1990 года.",
    },
    source: "FRED — VIXCLS",
  },
  {
    symbol: "us10y",
    name: "US 10-Year Treasury Yield",
    shortName: "US 10Y",
    category: "rates",
    currency: "USD",
    unit: "%",
    description: {
      en: "Constant-maturity 10-Year US Treasury yield. Daily since 1962.",
      de: "Rendite 10-jähriger US-Staatsanleihen (Constant-Maturity). Täglich seit 1962.",
      ru: "Доходность 10-летних казначейских облигаций США (постоянная срочность). Ежедневно с 1962 года.",
    },
    source: "FRED — DGS10",
  },
  {
    symbol: "us2y",
    name: "US 2-Year Treasury Yield",
    shortName: "US 2Y",
    category: "rates",
    currency: "USD",
    unit: "%",
    description: {
      en: "Constant-maturity 2-Year US Treasury yield. Daily since 1976.",
      de: "Rendite 2-jähriger US-Staatsanleihen (Constant-Maturity). Täglich seit 1976.",
      ru: "Доходность 2-летних казначейских облигаций США (постоянная срочность). Ежедневно с 1976 года.",
    },
    source: "FRED — DGS2",
  },
  {
    symbol: "mortgage30y",
    name: "US 30-Year Mortgage Rate",
    shortName: "30Y Mortgage",
    category: "rates",
    currency: "USD",
    unit: "%",
    description: {
      en: "Average 30-year fixed US mortgage rate. Weekly since 1971.",
      de: "Durchschnittlicher 30-jähriger US-Hypothekenzins. Wöchentlich seit 1971.",
      ru: "Средняя 30-летняя фиксированная ипотечная ставка в США. Еженедельно с 1971 года.",
    },
    source: "FRED — MORTGAGE30US",
  },

  // Derived series — computed on the fly from the primary data above.
  // See src/lib/derived.ts for the actual math. These show up as their
  // own category ("Insights") in the markets grid.
  {
    symbol: "spread-10-2",
    name: "US 10Y–2Y Yield Spread",
    shortName: "10Y–2Y",
    category: "derived",
    currency: "USD",
    unit: "%",
    description: {
      en: "10-year minus 2-year US Treasury yield. Inverts (goes negative) before most US recessions — one of the most-watched yield-curve indicators.",
      de: "Rendite 10-jähriger minus 2-jährige US-Staatsanleihen. Invertiert (wird negativ) vor den meisten US-Rezessionen — einer der meistbeachteten Zinskurven-Indikatoren.",
      ru: "Разница доходностей 10-летних и 2-летних казначейских облигаций США. Инвертируется (становится отрицательной) перед большинством рецессий в США — один из самых отслеживаемых индикаторов кривой доходности.",
    },
    source: "Derived: us10y − us2y",
  },
  {
    symbol: "cpi-yoy",
    name: "US Inflation (CPI YoY)",
    shortName: "CPI YoY",
    category: "derived",
    currency: "USD",
    unit: "%",
    description: {
      en: "US headline consumer-price inflation, year-over-year change. Computed from the monthly CPI index.",
      de: "US-Verbraucherpreisinflation im Vorjahresvergleich. Berechnet aus dem monatlichen CPI-Index.",
      ru: "Годовая инфляция потребительских цен в США. Рассчитано из ежемесячного индекса CPI.",
    },
    source: "Derived: cpi-us YoY change",
  },
  {
    symbol: "real-yield-10y",
    name: "US 10Y Real Yield",
    shortName: "Real 10Y",
    category: "derived",
    currency: "USD",
    unit: "%",
    description: {
      en: "Rough proxy for the real 10-year Treasury yield: nominal 10Y minus current CPI YoY inflation. Goes negative when inflation exceeds nominal rates.",
      de: "Grobe Näherung der realen 10-jährigen Treasury-Rendite: nominale 10Y minus aktuelle CPI-YoY-Inflation. Wird negativ, wenn die Inflation die Nominalrendite übersteigt.",
      ru: "Грубая оценка реальной доходности 10-летних облигаций: номинальная 10Y минус текущая инфляция CPI YoY. Становится отрицательной, когда инфляция превышает номинальную ставку.",
    },
    source: "Derived: us10y − cpi-yoy",
  },
  {
    symbol: "ratio-sp500-gold",
    name: "S&P 500 / Gold",
    shortName: "SPX/Gold",
    category: "derived",
    currency: "",
    description: {
      en: "S&P 500 priced in ounces of gold. Cuts through dollar-denominated noise and reveals long cycles of stocks outperforming (or underperforming) hard assets.",
      de: "S&P 500 ausgedrückt in Unzen Gold. Filtert Dollar-Rauschen heraus und zeigt lange Zyklen, in denen Aktien gegenüber Sachwerten besser (oder schlechter) abschneiden.",
      ru: "S&P 500, выраженный в унциях золота. Убирает долларовый шум и показывает длинные циклы, когда акции опережают (или отстают от) твёрдых активов.",
    },
    source: "Derived: sp500 ÷ gold",
  },
  {
    symbol: "ratio-gold-oil",
    name: "Gold / Oil",
    shortName: "Gold/Oil",
    category: "derived",
    currency: "",
    description: {
      en: "Ounces of gold per barrel of WTI crude. Rising ratio means gold is gaining vs. energy — often a flight-to-safety or oil-weakness signal.",
      de: "Unzen Gold pro Barrel WTI-Öl. Steigendes Verhältnis heißt: Gold gewinnt gegenüber Energie — oft ein Flucht-in-Sicherheit- oder Öl-Schwäche-Signal.",
      ru: "Унций золота за баррель WTI. Растущее соотношение означает, что золото дорожает относительно энергоносителей — часто сигнал бегства в безопасные активы или слабости нефти.",
    },
    source: "Derived: gold ÷ oil (WTI)",
  },
];

export function getAsset(symbol: string): Asset | undefined {
  return ASSETS.find((a) => a.symbol === symbol);
}
