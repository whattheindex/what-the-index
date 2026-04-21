import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, localizedPath, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

// Methodology / about page — long-form prose kept inline rather than in
// messages.ts to stay readable when editing. If we add a fourth locale or
// the content gets longer we can split it out.

type Section = { h: string; p: string[] };

const CONTENT: Record<Locale, { title: string; lead: string; sections: Section[]; updated: string }> = {
  en: {
    title: "Methodology",
    lead: "What you're looking at, where it comes from, and a few things to keep in mind.",
    updated: "Last updated April 2026.",
    sections: [
      {
        h: "Data sources",
        p: [
          "Most daily series come from FRED (the St. Louis Federal Reserve's public data API) — it's free, well-maintained, and covers equities indices, commodities, FX, Treasury yields, and rate benchmarks back to the mid-20th century or earlier.",
          "The long S&P 500 history is Robert Shiller's monthly composite (1871→) via datahub.io, spliced with FRED's daily SP500 feed for the most recent decade.",
          "The long gold history is monthly from datahub.io back to 1833. Bitcoin and Ethereum come from Coinbase via FRED.",
          "Every series on this site is refreshed daily by an automated GitHub Actions workflow. The timestamp next to each chart shows when the data was last fetched.",
        ],
      },
      {
        h: "Inflation adjustment (\u201CReal\u201D mode)",
        p: [
          "Toggling \u201CReal\u201D converts every value to today's US dollars using the monthly US CPI (CPIAUCSL from FRED). Concretely: for a point at date t with nominal value n, the real value is n \u00D7 CPI_latest / CPI_t.",
          "CPI is monthly and published with a ~2-week lag, so the most recent month may fall back to nominal until the next release.",
          "CPI doesn't capture everything. Housing, healthcare and tech deflate very differently from the basket, so treat real values as a macro-level baseline — not gospel for any one asset class.",
        ],
      },
      {
        h: "Derived series (\u201CInsights\u201D)",
        p: [
          "The Insights category contains series computed on the fly from primary data: the 10Y\u20132Y Treasury yield spread, US CPI year-over-year, the 10Y real yield (nominal 10Y minus CPI YoY), the S&P 500 priced in ounces of gold, and gold priced in barrels of WTI.",
          "These are convenience views. If you prefer to build your own, the Compare and Ratio tools accept any combination of the primary series.",
        ],
      },
      {
        h: "Drawdown view",
        p: [
          "The Drawdown toggle rewrites the chart as \u201Cpercent below running peak\u201D over the full history. Useful for reading cycles at a glance \u2014 the 2000 dot-com unwind, 2008 financial crisis, 2020 COVID crash and 2022 bear market all jump out as deep troughs.",
        ],
      },
      {
        h: "What this site is not",
        p: [
          "This is a personal project, not a licensed data vendor. Do not build trading systems on it. Prices may be missing, late, or subtly wrong \u2014 any series that matters for a real decision should be cross-checked against the original source.",
          "Nothing here is investment advice. Markets reward and punish without warning; I'm just drawing pictures.",
        ],
      },
      {
        h: "Open source",
        p: [
          "The full source code, the ingest scripts, and the exact data snapshots are published on GitHub. If you spot a bug or want to add an asset, patches welcome.",
        ],
      },
    ],
  },
  de: {
    title: "Methodik",
    lead: "Was du siehst, woher es kommt und worauf du achten solltest.",
    updated: "Zuletzt aktualisiert: April 2026.",
    sections: [
      {
        h: "Datenquellen",
        p: [
          "Die meisten t\u00E4glichen Zeitreihen kommen von FRED (der \u00F6ffentlichen Daten-API der St. Louis Fed) \u2014 kostenlos, gut gepflegt, und deckt Aktienindizes, Rohstoffe, Devisen, Staatsanleihen-Renditen und Zinsbenchmarks bis weit ins 20. Jahrhundert zur\u00FCck ab.",
          "Die lange S&P-500-Historie stammt von Robert Shillers monatlicher Composite-Reihe (ab 1871) via datahub.io, verkn\u00FCpft mit FREDs t\u00E4glichem SP500-Feed f\u00FCr die letzten zehn Jahre.",
          "Die lange Gold-Historie ist monatlich von datahub.io zur\u00FCck bis 1833. Bitcoin und Ethereum kommen \u00FCber Coinbase via FRED.",
          "Alle Reihen werden t\u00E4glich automatisch per GitHub-Actions-Workflow aktualisiert. Das Datum neben jedem Chart zeigt, wann die Daten zuletzt geladen wurden.",
        ],
      },
      {
        h: "Inflationsbereinigung (\u201EReal\u201C-Modus)",
        p: [
          "Der \u201EReal\u201C-Umschalter rechnet jeden Wert auf heutige US-Dollar um, basierend auf dem monatlichen US-CPI (CPIAUCSL von FRED). Formel: f\u00FCr einen Punkt an Datum t mit Nominalwert n ist der Realwert n \u00D7 CPI_aktuell / CPI_t.",
          "Der CPI ist monatlich und erscheint mit etwa zwei Wochen Versp\u00E4tung \u2014 der aktuellste Monat bleibt in der Zwischenzeit nominal.",
          "Der CPI bildet nicht alles ab. Wohnen, Gesundheit und Tech entwickeln sich ganz anders als der Warenkorb \u2014 verstehe Realwerte als Makro-Orientierung, nicht als pr\u00E4zise Wahrheit f\u00FCr eine einzelne Anlageklasse.",
        ],
      },
      {
        h: "Abgeleitete Reihen (\u201EInsights\u201C)",
        p: [
          "Die Kategorie Insights enth\u00E4lt Reihen, die on-the-fly aus Prim\u00E4rdaten berechnet werden: der 10Y\u20132Y-Zinsspread, US-Inflation YoY, die 10Y-Realrendite (nominal minus Inflation YoY), der S&P 500 in Gold und Gold in WTI-\u00D6l.",
          "Das sind bequeme Kurzwege. Wer eigene Kombinationen bauen will, nutzt die Tools Vergleich und Verh\u00E4ltnis \u2014 beide akzeptieren beliebige Prim\u00E4r-Assets.",
        ],
      },
      {
        h: "Drawdown-Ansicht",
        p: [
          "Der Drawdown-Toggle stellt den Chart auf \u201EProzent unter laufendem Hoch\u201C \u00FCber die gesamte Historie um. N\u00FCtzlich, um Zyklen auf einen Blick zu sehen \u2014 2000 Dotcom, 2008 Finanzkrise, 2020 COVID-Crash und 2022 Baisse springen sofort als tiefe T\u00E4ler heraus.",
        ],
      },
      {
        h: "Was diese Seite nicht ist",
        p: [
          "Das hier ist ein privates Projekt, kein lizenzierter Datenanbieter. Baue keine Handelssysteme darauf auf. Preise k\u00F6nnen fehlen, versp\u00E4tet oder subtil falsch sein \u2014 wenn eine Reihe f\u00FCr eine echte Entscheidung z\u00E4hlt, pr\u00FCfe sie gegen die Originalquelle.",
          "Nichts hier ist Anlageberatung. M\u00E4rkte belohnen und bestrafen ohne Vorwarnung; ich male hier nur Bilder.",
        ],
      },
      {
        h: "Open Source",
        p: [
          "Der gesamte Quellcode, die Ingest-Skripte und die Daten-Snapshots liegen auf GitHub. Fehler gefunden oder eine Serie fehlt? Pull-Requests willkommen.",
        ],
      },
    ],
  },
  ru: {
    title: "Методика",
    lead: "Что вы видите, откуда это берётся и на что обратить внимание.",
    updated: "Последнее обновление: апрель 2026.",
    sections: [
      {
        h: "Источники данных",
        p: [
          "Большинство ежедневных серий поступают из FRED \u2014 публичного API ФРС Сент-Луиса. Бесплатно, надёжно, охватывает фондовые индексы, сырьё, валюты, доходности казначейских облигаций и ключевые ставки с середины XX века.",
          "Длинная история S&P 500 \u2014 ежемесячная серия Composite Роберта Шиллера (с 1871 года) через datahub.io, склеенная с ежедневным фидом FRED SP500 за последние десять лет.",
          "Длинная история золота \u2014 ежемесячная с datahub.io, с 1833 года. Bitcoin и Ethereum \u2014 через Coinbase в FRED.",
          "Каждая серия на сайте обновляется ежедневно автоматическим workflow GitHub Actions. Дата рядом с каждым графиком показывает, когда данные были получены в последний раз.",
        ],
      },
      {
        h: "Поправка на инфляцию (режим \u201CReal\u201D)",
        p: [
          "Переключатель \u201CReal\u201D пересчитывает каждое значение в сегодняшние доллары США на основе ежемесячного CPI США (CPIAUCSL из FRED). Формула: для точки на дату t с номинальным значением n реальная величина равна n \u00D7 CPI_текущий / CPI_t.",
          "CPI публикуется ежемесячно с задержкой около двух недель \u2014 самый свежий месяц временно остаётся в номинальных величинах.",
          "CPI не охватывает всё. Жильё, медицина и технологии ведут себя иначе, чем корзина \u2014 воспринимайте реальные значения как макроориентир, а не как точную истину для конкретного класса активов.",
        ],
      },
      {
        h: "Производные серии (\u201CАналитика\u201D)",
        p: [
          "Категория Аналитика содержит серии, которые рассчитываются на лету из первичных данных: спред 10Y\u20132Y казначейских облигаций, CPI США год к году, реальная 10-летняя доходность (номинальная минус CPI YoY), S&P 500 в унциях золота и золото в баррелях WTI.",
          "Это удобные готовые ракурсы. Если хотите свои комбинации \u2014 инструменты Сравнение и Соотношение принимают любые первичные активы.",
        ],
      },
      {
        h: "Режим просадки",
        p: [
          "Переключатель Drawdown превращает график в \u201Cпроцент ниже текущего максимума\u201D на всей истории. Помогает видеть циклы с первого взгляда \u2014 2000 (доткомы), 2008 (финансовый кризис), 2020 (COVID) и 2022 (медвежий рынок) мгновенно выделяются как глубокие провалы.",
        ],
      },
      {
        h: "Чем сайт не является",
        p: [
          "Это личный проект, не лицензированный поставщик данных. Не стройте на нём торговые системы. Цены могут отсутствовать, запаздывать или быть незаметно неверными \u2014 если серия важна для реального решения, сверьтесь с первоисточником.",
          "Здесь нет инвестиционных советов. Рынки вознаграждают и наказывают без предупреждения; я просто рисую картинки.",
        ],
      },
      {
        h: "Открытый исходный код",
        p: [
          "Весь исходный код, скрипты загрузки данных и снимки данных опубликованы на GitHub. Нашли ошибку или хотите добавить актив \u2014 пул-реквесты приветствуются.",
        ],
      },
    ],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const c = CONTENT[locale as Locale];
  return {
    title: `${c.title} — What the Index`,
    description: c.lead,
  };
}

export default async function MethodologyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const m = getMessages(locale as Locale);
  const c = CONTENT[locale as Locale];

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 sm:py-12 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link
          href={localizedPath(locale, "/markets")}
          className="text-xs text-[var(--foreground-dim)] hover:text-[var(--foreground)] transition w-fit"
        >
          {m["back.toMarkets"]}
        </Link>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-2">
          {c.title}
        </h1>
        <p className="text-[var(--foreground-muted)] leading-relaxed max-w-2xl">
          {c.lead}
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {c.sections.map((s) => (
          <section key={s.h} className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold tracking-tight">{s.h}</h2>
            {s.p.map((para, i) => (
              <p
                key={i}
                className="text-sm text-[var(--foreground-muted)] leading-relaxed"
              >
                {para}
              </p>
            ))}
          </section>
        ))}
      </div>

      <div className="text-xs text-[var(--foreground-dim)] font-mono border-t border-[var(--border)] pt-4">
        {c.updated}
      </div>
    </div>
  );
}
