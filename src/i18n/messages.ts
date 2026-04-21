import type { Locale } from "./config";

// One flat dictionary per locale. Keys use dot-delimited paths for grouping.
// Placeholders use {name} syntax and are substituted by the t() helper.

export type Messages = { [K in keyof typeof en]: string };

const en = {
  "meta.title": "What the Index — clean financial charts",
  "meta.description":
    "Clean, fast, ad-free charts for indices, commodities, crypto, FX and rates. Long historical data with optional inflation adjustment.",

  "nav.markets": "Markets",
  "nav.compare": "Compare",
  "nav.ratio": "Ratio",
  "nav.pp": "Power",
  "nav.methodology": "Methodology",
  "nav.toLight": "Switch to light mode",
  "nav.toDark": "Switch to dark mode",

  "footer.data":
    "Data: FRED (St. Louis Fed), Shiller dataset, datahub.io. Not investment advice.",

  "home.title": "Markets without the noise.",
  "home.subtitle":
    "Clean historical charts for indices, commodities, crypto, currencies and rates — with inflation-adjusted views, log scale and decades (or centuries) of history. No pop-ups, no trackers, no cookie wall.",
  "home.compareCta": "Compare markets →",
  "home.searchHint": "Press {kbd} to search",
  "home.pulse": "Pulse",
  "home.asOf": "Data through {date}",
  "home.period": "Period",
  "home.movers.gainers": "Top gainers",
  "home.movers.losers": "Top losers",
  "home.movers.empty": "No movers to show.",
  "home.allMarkets": "All markets",
  "home.browseAll": "Browse all markets →",

  "markets.title": "All markets",
  "markets.subtitle":
    "Browse every market we track. Filter by category, search by name or ticker, and sort by performance over the selected period.",
  "markets.searchPlaceholder": "Search name or ticker…",
  "markets.filterAll": "All",
  "markets.sortLabel": "Sort",
  "markets.sort.nameAsc": "Name A–Z",
  "markets.sort.changeDesc": "Change ↓",
  "markets.sort.changeAsc": "Change ↑",
  "markets.empty": "No markets match your filters.",
  "markets.resultCount": "{count} of {total}",

  "category.index": "Indices",
  "category.commodity": "Commodities",
  "category.crypto": "Crypto",
  "category.fx": "Currencies",
  "category.rates": "Rates & volatility",
  "category.derived": "Insights",

  "back.toMarkets": "← All markets",

  "chart.nominal": "Nominal",
  "chart.real": "Inflation-adjusted (USD today)",
  "chart.realToggle": "Real (CPI-adjusted)",
  "chart.nominalToggle": "Nominal",
  "chart.linear": "Linear",
  "chart.log": "Log",
  "chart.scale": "Scale",
  "chart.timeframe": "Timeframe",
  "chart.realNote": "Nominal values adjusted for US CPI to today's dollars.",
  "chart.keysHint":
    "{k1}–{k2} timeframe · {lk} log · {ik} inflation · {sk} search",
  "chart.export": "Export",
  "chart.exportPng": "Download PNG",
  "chart.exportPdf": "Download PDF",
  "chart.drawdown": "Drawdown",
  "chart.drawdownNote": "Percent below running peak.",
  "chart.events": "Events",
  "chart.eventsNote": "Historical events marked on the timeline.",
  "chart.errorTitle": "Chart couldn't be loaded.",
  "chart.errorBody":
    "Something broke while rendering this chart. Refresh the page — if it keeps happening, the raw data is still available via the JSON source linked below.",
  "chart.returns": "Returns",
  "chart.athShort": "ATH",
  "chart.atlShort": "ATL",
  "chart.belowAth": "{pct} below ATH",
  "chart.atAth": "At all-time high",
  "chart.daysAgo": "{days}d ago",
  "chart.yearsAgo": "{years}y ago",

  "asset.category": "Category",
  "asset.points": "Points",
  "asset.granularity": "Granularity",
  "asset.source": "Source",
  "asset.granularityDaily": "daily",
  "asset.granularityMonthly": "monthly",
  "asset.granularityAnnual": "annual",

  "compare.title": "Compare",
  "compare.description":
    "Overlay any combination of markets, normalized to {one} at the start of the selected range. Toggle assets in the legend. Every selection updates the URL so you can share it.",
  "compare.add": "Add to comparison",
  "compare.baselineNote":
    "Each line starts at 100 on {date}. Values above 100 mean the asset gained relative to that baseline.",

  "ratio.title": "Ratio",
  "ratio.description":
    "Price one market in terms of another. A rising line means the top asset is getting more valuable relative to the bottom one. Great for seeing through dollar-denominated noise — e.g. “S&P 500 in ounces of gold” asks how many ounces of gold one S&P unit is worth.",
  "ratio.numerator": "Numerator",
  "ratio.denominator": "Denominator",
  "ratio.swap": "Swap numerator and denominator",
  "ratio.in": "{num} priced in {den}",
  "ratio.statCurrent": "Current",
  "ratio.statLow": "Period low",
  "ratio.statHigh": "Period high",
  "ratio.statPercentile": "Percentile",
  "ratio.statPercentileHint":
    "Share of observations at or below the current value",
  "ratio.note":
    "Values are end-of-month snapshots. When one side is monthly and the other daily, the daily series is sampled at month end before dividing.",

  "pp.title": "Purchasing power",
  "pp.description":
    "How much is a dollar from the past worth today? Based on US CPI (All Urban Consumers, seasonally adjusted) going back to 1947.",
  "pp.amount": "Amount",
  "pp.year": "Year",
  "pp.in": "in",
  "pp.resultLine": "{amount} in {year} has the same purchasing power as",
  "pp.today": "today.",
  "pp.totalInflation": "Total inflation",
  "pp.cpiMultiplier": "CPI multiplier",
  "pp.cpiMultiplierHint":
    "How many times higher prices are now than in that year.",
  "pp.avgAnnual": "Avg annual inflation",
  "pp.footnote":
    "Uses the annual average of US CPI (CPIAUCSL) for the chosen year and the latest available monthly CPI for “today”. CPI doesn't capture everything — housing, healthcare, and tech track very differently from the basket — so treat this as a baseline, not gospel.",
  "pp.unavailable": "CPI data unavailable.",

  "palette.placeholder": "Search markets…",
  "palette.empty": "No matches.",
  "palette.navigate": "navigate",
  "palette.open": "open",
  "palette.category.index": "Index",
  "palette.category.commodity": "Commodity",
  "palette.category.crypto": "Crypto",
  "palette.category.fx": "Currency",
  "palette.category.rates": "Rate",
  "palette.category.derived": "Insight",
};

const de: Messages = {
  "meta.title": "What the Index — klare Finanzcharts",
  "meta.description":
    "Klare, schnelle, werbefreie Charts für Indizes, Rohstoffe, Krypto, Devisen und Zinsen. Lange historische Daten, optional inflationsbereinigt.",

  "nav.markets": "Märkte",
  "nav.compare": "Vergleich",
  "nav.ratio": "Verhältnis",
  "nav.pp": "Kaufkraft",
  "nav.methodology": "Methodik",
  "nav.toLight": "Zu hellem Modus wechseln",
  "nav.toDark": "Zu dunklem Modus wechseln",

  "footer.data":
    "Daten: FRED (St. Louis Fed), Shiller-Datensatz, datahub.io. Keine Anlageberatung.",

  "home.title": "Märkte ohne Rauschen.",
  "home.subtitle":
    "Klare historische Charts für Indizes, Rohstoffe, Krypto, Währungen und Zinsen — mit inflationsbereinigter Ansicht, logarithmischer Skala und jahrzehnte- (oder jahrhundert-)langer Historie. Keine Pop-ups, keine Tracker, keine Cookie-Wand.",
  "home.compareCta": "Märkte vergleichen →",
  "home.searchHint": "{kbd} drücken zum Suchen",
  "home.pulse": "Überblick",
  "home.asOf": "Daten bis {date}",
  "home.period": "Zeitraum",
  "home.movers.gainers": "Top-Gewinner",
  "home.movers.losers": "Top-Verlierer",
  "home.movers.empty": "Keine Bewegungen.",
  "home.allMarkets": "Alle Märkte",
  "home.browseAll": "Alle Märkte ansehen →",

  "markets.title": "Alle Märkte",
  "markets.subtitle":
    "Alle Märkte, die wir tracken. Nach Kategorie filtern, nach Name oder Kürzel suchen und nach Performance im gewählten Zeitraum sortieren.",
  "markets.searchPlaceholder": "Name oder Kürzel suchen…",
  "markets.filterAll": "Alle",
  "markets.sortLabel": "Sortieren",
  "markets.sort.nameAsc": "Name A–Z",
  "markets.sort.changeDesc": "Veränderung ↓",
  "markets.sort.changeAsc": "Veränderung ↑",
  "markets.empty": "Keine Märkte passen zu den Filtern.",
  "markets.resultCount": "{count} von {total}",

  "category.index": "Indizes",
  "category.commodity": "Rohstoffe",
  "category.crypto": "Krypto",
  "category.fx": "Währungen",
  "category.rates": "Zinsen & Volatilität",
  "category.derived": "Insights",

  "back.toMarkets": "← Alle Märkte",

  "chart.nominal": "Nominal",
  "chart.real": "Inflationsbereinigt (USD heute)",
  "chart.realToggle": "Real (CPI-bereinigt)",
  "chart.nominalToggle": "Nominal",
  "chart.linear": "Linear",
  "chart.log": "Log",
  "chart.scale": "Skala",
  "chart.timeframe": "Zeitraum",
  "chart.realNote":
    "Nominalwerte mit US-CPI auf heutige Dollar umgerechnet.",
  "chart.keysHint":
    "{k1}–{k2} Zeitraum · {lk} Log · {ik} Inflation · {sk} Suche",
  "chart.export": "Export",
  "chart.exportPng": "PNG herunterladen",
  "chart.exportPdf": "PDF herunterladen",
  "chart.drawdown": "Drawdown",
  "chart.drawdownNote": "Prozent unter laufendem Hoch.",
  "chart.events": "Ereignisse",
  "chart.eventsNote": "Historische Ereignisse in der Zeitachse markiert.",
  "chart.errorTitle": "Chart konnte nicht geladen werden.",
  "chart.errorBody":
    "Beim Rendern ist etwas schiefgelaufen. Seite neu laden — falls es bestehen bleibt, sind die Rohdaten weiterhin über die unten verlinkte JSON-Quelle verfügbar.",
  "chart.returns": "Rendite",
  "chart.athShort": "ATH",
  "chart.atlShort": "ATL",
  "chart.belowAth": "{pct} unter ATH",
  "chart.atAth": "Auf Allzeithoch",
  "chart.daysAgo": "vor {days}d",
  "chart.yearsAgo": "vor {years}J",

  "asset.category": "Kategorie",
  "asset.points": "Datenpunkte",
  "asset.granularity": "Granularität",
  "asset.source": "Quelle",
  "asset.granularityDaily": "täglich",
  "asset.granularityMonthly": "monatlich",
  "asset.granularityAnnual": "jährlich",

  "compare.title": "Vergleich",
  "compare.description":
    "Lege beliebige Märkte übereinander, normalisiert auf {one} zum Beginn des gewählten Zeitraums. In der Legende an- und abschalten. Jede Auswahl landet in der URL — einfach teilen.",
  "compare.add": "Zum Vergleich hinzufügen",
  "compare.baselineNote":
    "Jede Linie startet am {date} bei 100. Werte über 100 bedeuten Gewinn gegenüber dem Startpunkt.",

  "ratio.title": "Verhältnis",
  "ratio.description":
    "Bewerte einen Markt in einem anderen. Eine steigende Linie heißt: Der obere Wert wird gegenüber dem unteren teurer. Gut, um den Dollar-Nebel zu entfernen — „S&P 500 in Unzen Gold“ fragt, wie viele Unzen Gold eine S&P-Einheit wert ist.",
  "ratio.numerator": "Zähler",
  "ratio.denominator": "Nenner",
  "ratio.swap": "Zähler und Nenner tauschen",
  "ratio.in": "{num} ausgedrückt in {den}",
  "ratio.statCurrent": "Aktuell",
  "ratio.statLow": "Periodentief",
  "ratio.statHigh": "Periodenhoch",
  "ratio.statPercentile": "Perzentil",
  "ratio.statPercentileHint":
    "Anteil der Beobachtungen auf oder unter dem aktuellen Wert",
  "ratio.note":
    "Werte sind Monatsend-Snapshots. Wenn eine Seite monatlich und die andere täglich ist, wird die tägliche Reihe zum Monatsende gesampelt, bevor dividiert wird.",

  "pp.title": "Kaufkraft",
  "pp.description":
    "Wie viel ist ein Dollar aus der Vergangenheit heute wert? Basierend auf dem US-CPI (All Urban Consumers, saisonbereinigt) ab 1947.",
  "pp.amount": "Betrag",
  "pp.year": "Jahr",
  "pp.in": "in",
  "pp.resultLine": "{amount} in {year} entspricht heute",
  "pp.today": ".",
  "pp.totalInflation": "Gesamtinflation",
  "pp.cpiMultiplier": "CPI-Multiplikator",
  "pp.cpiMultiplierHint":
    "Um wie viel Mal höher die Preise heute sind als in jenem Jahr.",
  "pp.avgAnnual": "Ø Jährliche Inflation",
  "pp.footnote":
    "Verwendet den Jahresdurchschnitt des US-CPI (CPIAUCSL) für das gewählte Jahr und den letzten verfügbaren monatlichen CPI als „heute“. Der CPI erfasst nicht alles — Wohnen, Gesundheit, Tech bewegen sich ganz anders als der Warenkorb — also als grobe Orientierung verstehen, nicht als Wahrheit.",
  "pp.unavailable": "CPI-Daten nicht verfügbar.",

  "palette.placeholder": "Märkte suchen…",
  "palette.empty": "Keine Treffer.",
  "palette.navigate": "navigieren",
  "palette.open": "öffnen",
  "palette.category.index": "Index",
  "palette.category.commodity": "Rohstoff",
  "palette.category.crypto": "Krypto",
  "palette.category.fx": "Währung",
  "palette.category.rates": "Zins",
  "palette.category.derived": "Insight",
};

const ru: Messages = {
  "meta.title": "What the Index — понятные финансовые графики",
  "meta.description":
    "Понятные, быстрые, без рекламы графики — индексы, сырьё, крипто, валюты, ставки. Длинная история с поправкой на инфляцию.",

  "nav.markets": "Рынки",
  "nav.compare": "Сравнить",
  "nav.ratio": "Соотношение",
  "nav.pp": "Инфляция",
  "nav.methodology": "Методика",
  "nav.toLight": "Переключить на светлый режим",
  "nav.toDark": "Переключить на тёмный режим",

  "footer.data":
    "Данные: FRED (ФРС Сент-Луиса), датасет Шиллера, datahub.io. Не является инвестиционной рекомендацией.",

  "home.title": "Рынки без шума.",
  "home.subtitle":
    "Понятные исторические графики для индексов, сырья, крипто, валют и ставок — с поправкой на инфляцию, логарифмической шкалой и историей в десятилетиях (или столетиях). Никаких всплывающих окон, трекеров, куки-баннеров.",
  "home.compareCta": "Сравнить рынки →",
  "home.searchHint": "Нажмите {kbd} для поиска",
  "home.pulse": "Пульс рынков",
  "home.asOf": "Данные по {date}",
  "home.period": "Период",
  "home.movers.gainers": "Лидеры роста",
  "home.movers.losers": "Лидеры падения",
  "home.movers.empty": "Нет данных.",
  "home.allMarkets": "Все рынки",
  "home.browseAll": "Смотреть все рынки →",

  "markets.title": "Все рынки",
  "markets.subtitle":
    "Все рынки, которые мы отслеживаем. Фильтруйте по категории, ищите по названию или тикеру, сортируйте по динамике за выбранный период.",
  "markets.searchPlaceholder": "Поиск по названию или тикеру…",
  "markets.filterAll": "Все",
  "markets.sortLabel": "Сортировка",
  "markets.sort.nameAsc": "Имя A–Я",
  "markets.sort.changeDesc": "Изменение ↓",
  "markets.sort.changeAsc": "Изменение ↑",
  "markets.empty": "Ничего не найдено.",
  "markets.resultCount": "{count} из {total}",

  "category.index": "Индексы",
  "category.commodity": "Сырьё",
  "category.crypto": "Криптовалюта",
  "category.fx": "Валюты",
  "category.rates": "Ставки и волатильность",
  "category.derived": "Аналитика",

  "back.toMarkets": "← Все рынки",

  "chart.nominal": "Номинал",
  "chart.real": "С поправкой на инфляцию (USD сегодня)",
  "chart.realToggle": "Реально (CPI)",
  "chart.nominalToggle": "Номинал",
  "chart.linear": "Линейная",
  "chart.log": "Лог",
  "chart.scale": "Шкала",
  "chart.timeframe": "Период",
  "chart.realNote":
    "Номинальные значения приведены к сегодняшним долларам по CPI США.",
  "chart.keysHint":
    "{k1}–{k2} период · {lk} лог · {ik} инфляция · {sk} поиск",
  "chart.export": "Экспорт",
  "chart.exportPng": "Скачать PNG",
  "chart.exportPdf": "Скачать PDF",
  "chart.drawdown": "Просадка",
  "chart.drawdownNote": "Процент ниже текущего максимума.",
  "chart.events": "События",
  "chart.eventsNote": "Исторические события на временной шкале.",
  "chart.errorTitle": "Не удалось загрузить график.",
  "chart.errorBody":
    "Что-то сломалось при отрисовке. Обновите страницу — если не помогает, исходные данные доступны по JSON-ссылке ниже.",
  "chart.returns": "Доходность",
  "chart.athShort": "ATH",
  "chart.atlShort": "ATL",
  "chart.belowAth": "{pct} ниже ATH",
  "chart.atAth": "На историческом максимуме",
  "chart.daysAgo": "{days}д назад",
  "chart.yearsAgo": "{years}г назад",

  "asset.category": "Категория",
  "asset.points": "Точки",
  "asset.granularity": "Детализация",
  "asset.source": "Источник",
  "asset.granularityDaily": "ежедневно",
  "asset.granularityMonthly": "ежемесячно",
  "asset.granularityAnnual": "ежегодно",

  "compare.title": "Сравнение",
  "compare.description":
    "Наложите любые рынки друг на друга, нормализованные к {one} в начале выбранного периода. Переключайте активы в легенде. Каждый выбор сохраняется в URL — удобно делиться.",
  "compare.add": "Добавить к сравнению",
  "compare.baselineNote":
    "Каждая линия начинается со 100 на {date}. Значения выше 100 означают рост относительно базы.",

  "ratio.title": "Соотношение",
  "ratio.description":
    "Оцените один рынок в другом. Растущая линия значит, что верхний актив дорожает относительно нижнего. Хорошо убирает долларовый шум — „S&P 500 в унциях золота“ спрашивает, сколько унций золота стоит одна единица S&P.",
  "ratio.numerator": "Числитель",
  "ratio.denominator": "Знаменатель",
  "ratio.swap": "Поменять числитель и знаменатель",
  "ratio.in": "{num} в единицах {den}",
  "ratio.statCurrent": "Сейчас",
  "ratio.statLow": "Минимум за период",
  "ratio.statHigh": "Максимум за период",
  "ratio.statPercentile": "Перцентиль",
  "ratio.statPercentileHint":
    "Доля наблюдений на уровне или ниже текущего значения",
  "ratio.note":
    "Значения — снимки на конец месяца. Если одна сторона месячная, а другая дневная, дневная серия сэмплируется на конец месяца перед делением.",

  "pp.title": "Покупательная способность",
  "pp.description":
    "Сколько стоит доллар прошлого сегодня? На основе CPI США (All Urban Consumers, с сезонной коррекцией) с 1947 года.",
  "pp.amount": "Сумма",
  "pp.year": "Год",
  "pp.in": "в",
  "pp.resultLine":
    "{amount} в {year} году соответствуют покупательной способности",
  "pp.today": "сегодня.",
  "pp.totalInflation": "Общая инфляция",
  "pp.cpiMultiplier": "Множитель CPI",
  "pp.cpiMultiplierHint":
    "Во сколько раз сейчас цены выше, чем в том году.",
  "pp.avgAnnual": "Средняя годовая инфляция",
  "pp.footnote":
    "Использует среднегодовой CPI США (CPIAUCSL) для выбранного года и последний доступный месячный CPI как „сегодня“. CPI не учитывает всё — жильё, медицина, техника ведут себя иначе, чем корзина — так что это ориентир, а не истина.",
  "pp.unavailable": "Данные CPI недоступны.",

  "palette.placeholder": "Поиск рынков…",
  "palette.empty": "Нет совпадений.",
  "palette.navigate": "навигация",
  "palette.open": "открыть",
  "palette.category.index": "Индекс",
  "palette.category.commodity": "Сырьё",
  "palette.category.crypto": "Крипто",
  "palette.category.fx": "Валюта",
  "palette.category.rates": "Ставка",
  "palette.category.derived": "Аналитика",
};

export const ALL: Record<Locale, Messages> = { en, de, ru };

export function getMessages(locale: Locale): Messages {
  return ALL[locale];
}

export type MessageKey = keyof Messages;

// Substitute {name} placeholders from values.
export function format(template: string, values?: Record<string, string>): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => {
    const v = values[k];
    return v === undefined ? `{${k}}` : v;
  });
}
