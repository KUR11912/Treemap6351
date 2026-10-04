// ------------------------------
// 1. 基本设置：API、层级、颜色和国家—大洲映射
// ------------------------------
const GDP_API =
  "https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD?format=json&date=2000:2025&per_page=20000";
const COUNTRY_API =
  "https://api.worldbank.org/v2/country?format=json&per_page=400";

const CONTINENTS = [
  "Asia",
  "Europe",
  "Africa",
  "North America",
  "South America",
  "Oceania",
];

// 每个大洲继续使用固定基础色相。浅色端也保持较高饱和度，避免中间色发灰、发脏；
// 同时保留很大的明度跨度，让同一洲内的国家仍然容易区分。
// accent 保留原有大洲标题颜色；light / dark 只控制国家矩形。
const CONTINENT_COLOR_RANGES = {
  Asia: {
    light: "hsl(12, 82%, 91%)",
    dark: "hsl(12, 100%, 20%)",
    accent: "#a83b25",
    border: "hsl(16, 72%, 19%)",
  },
  Europe: {
    light: "hsl(215, 82%, 91%)",
    dark: "hsl(215, 100%, 20%)",
    accent: "#235da2",
    border: "hsl(214, 72%, 19%)",
  },
  Africa: {
    light: "hsl(44, 82%, 91%)",
    dark: "hsl(44, 100%, 22%)",
    accent: "#9a6500",
    border: "hsl(42, 72%, 19%)",
  },
  "North America": {
    light: "hsl(181, 82%, 91%)",
    dark: "hsl(181, 100%, 20%)",
    accent: "#176f73",
    border: "hsl(179, 72%, 18%)",
  },
  "South America": {
    light: "hsl(145, 82%, 91%)",
    dark: "hsl(145, 100%, 20%)",
    accent: "#2f7a4a",
    border: "hsl(139, 72%, 18%)",
  },
  Oceania: {
    light: "hsl(275, 82%, 91%)",
    dark: "hsl(275, 100%, 20%)",
    accent: "#684597",
    border: "hsl(270, 72%, 19%)",
  },
};

// 本地 ISO3—大洲映射。这样不会在每次运行时依赖第三个在线接口。
// 加勒比海与中美洲归入 North America；俄罗斯归入 Europe；
// 土耳其、哈萨克斯坦与高加索国家归入 Asia。
const CONTINENT_COUNTRY_CODES = {
  Asia: [
    "AFG", "ARE", "ARM", "AZE", "BGD", "BHR", "BRN", "BTN", "CHN", "CYP",
    "GEO", "HKG", "IDN", "IND", "IRN", "IRQ", "ISR", "JOR", "JPN", "KAZ",
    "KGZ", "KHM", "KOR", "KWT", "LAO", "LBN", "LKA", "MAC", "MDV", "MMR",
    "MNG", "MYS", "NPL", "OMN", "PAK", "PHL", "PRK", "PSE", "QAT", "SAU",
    "SGP", "SYR", "THA", "TJK", "TKM", "TLS", "TUR", "UZB", "VNM", "YEM",
  ],
  Europe: [
    "ALB", "AND", "AUT", "BEL", "BGR", "BIH", "BLR", "CHE", "CHI", "CZE",
    "DEU", "DNK", "ESP", "EST", "FIN", "FRA", "FRO", "GBR", "GIB", "GRC",
    "HRV", "HUN", "IMN", "IRL", "ISL", "ITA", "LIE", "LTU", "LUX", "LVA",
    "MCO", "MDA", "MKD", "MLT", "MNE", "NLD", "NOR", "POL", "PRT", "ROU",
    "RUS", "SMR", "SRB", "SVK", "SVN", "SWE", "UKR", "XKX",
  ],
  Africa: [
    "AGO", "BDI", "BEN", "BFA", "BWA", "CAF", "CIV", "CMR", "COD", "COG",
    "COM", "CPV", "DJI", "DZA", "EGY", "ERI", "ETH", "GAB", "GHA", "GIN",
    "GMB", "GNB", "GNQ", "KEN", "LBR", "LBY", "LSO", "MAR", "MDG", "MLI",
    "MOZ", "MRT", "MUS", "MWI", "NAM", "NER", "NGA", "RWA", "SDN", "SEN",
    "SLE", "SOM", "SSD", "STP", "SWZ", "SYC", "TCD", "TGO", "TUN", "TZA",
    "UGA", "ZAF", "ZMB", "ZWE",
  ],
  "North America": [
    "ABW", "ATG", "BHS", "BLZ", "BMU", "BRB", "CAN", "CRI", "CUB", "CUW",
    "CYM", "DMA", "DOM", "GRD", "GRL", "GTM", "HND", "HTI", "JAM", "KNA",
    "LCA", "MAF", "MEX", "NIC", "PAN", "PRI", "SLV", "SXM", "TCA", "TTO",
    "USA", "VCT", "VGB", "VIR",
  ],
  "South America": [
    "ARG", "BOL", "BRA", "CHL", "COL", "ECU", "GUY", "PER", "PRY", "SUR",
    "URY", "VEN",
  ],
  Oceania: [
    "ASM", "AUS", "FJI", "FSM", "GUM", "KIR", "MHL", "MNP", "NCL", "NRU",
    "NZL", "PLW", "PNG", "PYF", "SLB", "TON", "TUV", "VUT", "WSM",
  ],
};

const COUNTRY_CONTINENT = new Map();
Object.entries(CONTINENT_COUNTRY_CODES).forEach(([continent, codes]) => {
  codes.forEach((code) => COUNTRY_CONTINENT.set(code, continent));
});
// 若你希望固定默认年份，可把 null 改成数字，例如 2022。
// 保持 null 时，会自动选择“至少有 100 个国家有数据”的最新年份。
const PREFERRED_DEFAULT_YEAR = null;
const MIN_COUNTRIES_FOR_DEFAULT = 100;
const TRANSITION_DURATION = 420;

// ------------------------------
// 2. 页面元素与状态管理
// ------------------------------
const elements = {
  yearSelect: document.querySelector("#year-select"),
  currentYear: document.querySelector("#current-year"),
  entityCountLabel: document.querySelector("#entity-count-label"),
  countryCount: document.querySelector("#country-count"),
  totalGdp: document.querySelector("#total-gdp"),
  dataNote: document.querySelector("#data-note"),
  chartHeading: document.querySelector("#chart-heading"),
  chartCaption: document.querySelector("#chart-caption"),
  worldCrumb: document.querySelector("#world-crumb"),
  breadcrumbSeparator: document.querySelector("#breadcrumb-separator"),
  breadcrumbCurrent: document.querySelector("#breadcrumb-current"),
  backButton: document.querySelector("#back-button"),
  chartWrap: document.querySelector("#chart-wrap"),
  svg: document.querySelector("#treemap"),
  loading: document.querySelector("#loading-state"),
  error: document.querySelector("#error-state"),
  errorMessage: document.querySelector("#error-message"),
  retryButton: document.querySelector("#retry-button"),
  empty: document.querySelector("#empty-state"),
  emptyMessage: document.querySelector("#empty-message"),
  tooltip: document.querySelector("#tooltip"),
};

const state = {
  dataByYear: new Map(),
  currentLevel: "continents",
  selectedContinent: null,
  selectedYear: null,
  currentTotal: 0,
  globalTotal: 0,
  continentTotals: new Map(),
  resizeTimer: null,
  pinnedKey: null,
};

// ------------------------------
// 3. 通用格式化工具
// ------------------------------
function formatCompactCurrency(value) {
  const units = [
    { size: 1e12, suffix: "T" },
    { size: 1e9, suffix: "B" },
    { size: 1e6, suffix: "M" },
    { size: 1e3, suffix: "K" },
  ];

  const unit = units.find((item) => value >= item.size);
  if (!unit) return `$${Math.round(value).toLocaleString("en-US")}`;

  const scaled = value / unit.size;
  const digits = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
  const number = scaled.toFixed(digits).replace(/\.0+$|(\.\d*[1-9])0+$/, "$1");
  return `$${number}${unit.suffix}`;
}

function formatFullCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value, total) {
  const percent = total > 0 ? (value / total) * 100 : 0;
  return percent >= 0.1 ? `${percent.toFixed(2)}%` : `${percent.toFixed(3)}%`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function makeClipId(key) {
  return `clip-${String(key).replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

// GDP 排名最高的少数国家往往都挤在色阶末端，看起来会过于接近。
// 因此把前 25% 的国家分配到 60% 的深色色阶，让美国、加拿大、墨西哥
// 这类排名相邻的大型经济体也能形成明显的颜色差异。
function expandHighRankColorContrast(rank) {
  const topGroupStart = 0.75;

  if (rank <= topGroupStart) {
    return (rank / topGroupStart) * 0.4;
  }

  return 0.4 + ((rank - topGroupStart) / (1 - topGroupStart)) * 0.6;
}

// 同一大洲内按 GDP 从小到大排名，再通过上面的曲线铺满完整色阶。
// 颜色表达相对排名；矩形面积仍然只由真实 GDP 数值决定。
function createContinentColorScales(countries) {
  const groups = groupCountriesByContinent(countries);
  const scales = new Map();

  CONTINENTS.forEach((continent) => {
    const rankedCountries = (groups.get(continent) || [])
      .filter((country) => Number.isFinite(country.value) && country.value > 0)
      .slice()
      .sort((a, b) => a.value - b.value || a.code.localeCompare(b.code));
    const range = CONTINENT_COLOR_RANGES[continent];

    if (rankedCountries.length === 0) return;

    const rankByCode = new Map(
      rankedCountries.map((country, index) => [
        country.code,
        rankedCountries.length === 1 ? 0.5 : index / (rankedCountries.length - 1),
      ]),
    );
    const normalizedRank = (country) => rankByCode.get(country.code) ?? 0.5;
    const colorRank = (country) => expandHighRankColorContrast(normalizedRank(country));
    // 两端使用相同色相，并在 HSL 空间插值，让中间颜色保持鲜艳而不变灰。
    const interpolateColor = d3.interpolateHsl(range.light, range.dark);

    scales.set(continent, {
      tone: colorRank,
      color: (country) => interpolateColor(colorRank(country)),
      border: range.border,
    });
  });

  return scales;
}

function getCountryColor(country, colorScales) {
  return colorScales.get(country.continent)?.color(country) || "#607089";
}

function getCountryTone(country, colorScales) {
  return colorScales.get(country.continent)?.tone(country) ?? 0.5;
}

function getCountryBorder(country, colorScales) {
  return colorScales.get(country.continent)?.border || "#26364b";
}

// 按实际填充色的相对亮度，自动选择深色或白色文字。
function getRelativeLuminance(color) {
  const rgb = d3.rgb(color);
  const toLinear = (channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * toLinear(rgb.r) + 0.7152 * toLinear(rgb.g) + 0.0722 * toLinear(rgb.b);
}

function shouldUseDarkText(country, colorScales) {
  const backgroundLuminance = getRelativeLuminance(getCountryColor(country, colorScales));
  const darkTextLuminance = getRelativeLuminance("#101a25");
  const contrastWithDark =
    (backgroundLuminance + 0.05) / (darkTextLuminance + 0.05);
  const contrastWithWhite = 1.05 / (backgroundLuminance + 0.05);
  return contrastWithDark >= contrastWithWhite;
}

// ------------------------------
// 4. 加载并清洗世界银行真实数据
// ------------------------------
async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`世界银行接口返回了 HTTP ${response.status}`);
  }

  const json = await response.json();
  if (!Array.isArray(json) || !Array.isArray(json[1])) {
    throw new Error("世界银行返回的数据格式不完整");
  }
  return json[1];
}

async function loadData() {
  showLoading();

  if (typeof d3 === "undefined") {
    showError("D3.js 没有成功加载。请检查网络连接后重新加载。");
    return;
  }

  try {
    const [gdpRows, countryRows] = await Promise.all([
      fetchJson(GDP_API),
      fetchJson(COUNTRY_API),
    ]);

    // 世界银行 country 接口把汇总项的 region 标为 NA / Aggregates。
    // 先排除汇总项，再使用本地 ISO3 映射添加大洲。
    const realCountries = new Map();
    countryRows.forEach((country) => {
      const regionId = country.region?.id;
      const regionName = String(country.region?.value || "").trim();
      const isAggregate = regionId === "NA" || regionName === "Aggregates";

      if (isAggregate || !country.id || country.id === "ATA") return;

      const continent = COUNTRY_CONTINENT.get(country.id);
      if (!continent) {
        console.warn(
          `[大洲映射] 未找到 ${country.id}（${country.name}）的大洲，已从图表排除。`,
        );
        return;
      }

      realCountries.set(country.id, {
        code: country.id,
        name: country.name,
        continent,
      });
    });

    const dataByYear = new Map();
    gdpRows.forEach((row) => {
      const country = realCountries.get(row.countryiso3code);
      const year = Number(row.date);
      const value = Number(row.value);

      // 只保留真实国家、2000 年之后且 GDP 大于 0 的有效数据。
      if (
        !country ||
        !Number.isInteger(year) ||
        year < 2000 ||
        !Number.isFinite(value) ||
        value <= 0
      ) {
        return;
      }

      if (!dataByYear.has(year)) dataByYear.set(year, []);
      dataByYear.get(year).push({ ...country, year, value });
    });

    dataByYear.forEach((values) => values.sort((a, b) => b.value - a.value));

    if (dataByYear.size === 0) {
      throw new Error("没有找到可用的国家 GDP 数据");
    }

    state.dataByYear = dataByYear;
    state.currentLevel = "continents";
    state.selectedContinent = null;
    setupYearSelector();
    hideMessages();
    updateVisualization(state.selectedYear, false);
  } catch (error) {
    console.error("加载世界银行数据失败：", error);
    showError(
      "无法读取世界银行数据。请确认网络正常、使用 Live Server 打开页面，然后重试。",
    );
  }
}

function setupYearSelector() {
  const years = [...state.dataByYear.keys()].sort((a, b) => b - a);
  const automaticYear = years.find(
    (year) => state.dataByYear.get(year).length >= MIN_COUNTRIES_FOR_DEFAULT,
  );

  const preferredIsValid =
    Number.isInteger(PREFERRED_DEFAULT_YEAR) && state.dataByYear.has(PREFERRED_DEFAULT_YEAR);
  state.selectedYear = preferredIsValid ? PREFERRED_DEFAULT_YEAR : automaticYear || years[0];

  elements.yearSelect.replaceChildren();
  years.forEach((year) => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    option.selected = year === state.selectedYear;
    elements.yearSelect.append(option);
  });
  elements.yearSelect.disabled = false;
}

// ------------------------------
// 5. 按大洲分组并计算大洲总额
// ------------------------------
function groupCountriesByContinent(countries) {
  const groups = new Map(CONTINENTS.map((continent) => [continent, []]));

  countries.forEach((country) => {
    const group = groups.get(country.continent);
    if (group) group.push(country);
  });

  return groups;
}

function calculateContinentTotals(countries) {
  const groups = groupCountriesByContinent(countries);

  return CONTINENTS.map((continent) => {
    const continentCountries = groups.get(continent) || [];
    return {
      key: `continent-${continent}`,
      kind: "continent",
      name: continent,
      continent,
      value: d3.sum(continentCountries, (country) => country.value),
      countryCount: continentCountries.length,
      countries: continentCountries,
    };
  }).filter((item) => item.value > 0);
}

// ------------------------------
// 6. 层级导航与年份更新
// ------------------------------
function showContinentView(animate = true) {
  state.currentLevel = "continents";
  state.selectedContinent = null;
  state.pinnedKey = null;
  hideTooltip();
  updateNavigation();
  updateVisualization(state.selectedYear, animate);
}

function showCountryView(continent, animate = true) {
  state.currentLevel = "countries";
  state.selectedContinent = continent;
  state.pinnedKey = null;
  hideTooltip();
  updateNavigation();
  updateVisualization(state.selectedYear, animate);
}

function updateNavigation() {
  const isCountryView = state.currentLevel === "countries";

  elements.worldCrumb.disabled = !isCountryView;
  elements.worldCrumb.toggleAttribute("aria-current", !isCountryView);
  elements.breadcrumbSeparator.hidden = !isCountryView;
  elements.breadcrumbCurrent.hidden = !isCountryView;
  elements.breadcrumbCurrent.textContent = isCountryView ? state.selectedContinent : "";
  elements.breadcrumbCurrent.toggleAttribute("aria-current", isCountryView);
  elements.backButton.hidden = !isCountryView;
}

function updateVisualization(year, animate = true) {
  const countries = state.dataByYear.get(Number(year)) || [];
  state.selectedYear = Number(year);
  state.globalTotal = d3.sum(countries, (country) => country.value);
  state.continentTotals = new Map(
    calculateContinentTotals(countries).map((item) => [item.continent, item.value]),
  );
  state.pinnedKey = null;
  hideTooltip();

  if (state.currentLevel === "countries") {
    renderCountryTreemap(countries, animate);
  } else {
    renderContinentTreemap(countries, animate);
  }
}

// ------------------------------
// 7. 第一级：大洲内嵌国家的 Nested Treemap
// ------------------------------
function renderContinentTreemap(countries, animate = true) {
  const continentTotals = calculateContinentTotals(countries);

  elements.chartHeading.textContent = "World GDP by Continent and Country";
  elements.chartCaption.textContent =
    "Rectangle size represents GDP. Within each continent, darker colors indicate higher GDP.";
  elements.svg.setAttribute(
    "aria-label",
    `${state.selectedYear} 年世界六大洲及其国家 GDP 嵌套式 Treemap`,
  );

  if (continentTotals.length === 0) {
    showEmpty(`世界六大洲在 ${state.selectedYear} 年没有有效 GDP 数据，请选择其他年份。`);
    updateSummary({ count: 0, total: 0, level: "continents", countryCount: 0 });
    clearTreemap();
    return;
  }

  elements.empty.hidden = true;
  const total = d3.sum(continentTotals, (item) => item.value);
  updateSummary({
    count: continentTotals.length,
    total,
    level: "continents",
    countryCount: countries.length,
  });
  drawTreemap(countries, { level: "continents", total, animate });
}

// ------------------------------
// 8. 第二级：国家 Treemap
// ------------------------------
function renderCountryTreemap(countries, animate = true) {
  const continentCountries = countries
    .filter((country) => country.continent === state.selectedContinent)
    .map((country) => ({
      ...country,
      key: country.code,
      kind: "country",
    }));

  elements.chartHeading.textContent = `${state.selectedContinent} — GDP by Country`;
  elements.chartCaption.textContent =
    "Rectangle size represents GDP. Within this continent, darker colors indicate higher GDP.";
  elements.svg.setAttribute(
    "aria-label",
    `${state.selectedYear} 年 ${state.selectedContinent} 各国 GDP Treemap`,
  );

  if (continentCountries.length === 0) {
    showEmpty(
      `${state.selectedContinent} 在 ${state.selectedYear} 年没有有效 GDP 数据，请选择其他年份。`,
    );
    updateSummary({ count: 0, total: 0, level: "countries" });
    clearTreemap();
    return;
  }

  elements.empty.hidden = true;
  const total = d3.sum(continentCountries, (country) => country.value);
  updateSummary({ count: continentCountries.length, total, level: "countries" });
  drawTreemap(continentCountries, { level: "countries", total, animate });
}

// ------------------------------
// 9. 共用绘图：总览使用三层树，详情使用两层树
// ------------------------------
function drawTreemap(items, { level, total, animate }) {
  state.currentTotal = total;

  const width = Math.max(1, elements.chartWrap.clientWidth);
  const height = Math.max(1, elements.chartWrap.clientHeight);
  const isOverview = level === "continents";
  const headerHeight = width < 520 ? 30 : 34;
  const colorScales = createContinentColorScales(items);

  // 总览的数据树：World → Continent → Country。
  const hierarchyData = isOverview
    ? {
        name: "World",
        kind: "world",
        children: calculateContinentTotals(items).map((continent) => ({
          key: continent.key,
          kind: "continent",
          name: continent.name,
          continent: continent.continent,
          countryCount: continent.countryCount,
          children: continent.countries.map((country) => ({
            ...country,
            key: country.code,
            kind: "country",
          })),
        })),
      }
    : {
        name: state.selectedContinent,
        kind: "continent",
        children: items,
      };

  const root = d3
    .hierarchy(hierarchyData)
    .sum((item) => (item.kind === "country" ? item.value : 0))
    .sort((a, b) => b.value - a.value);

  d3
    .treemap()
    // Challenge 3：把目标长宽比从 1.15 调大到 3，矩形会更细长。
    // 面积计算仍然使用真实 GDP，数据和交互逻辑都不变。
    .tile(d3.treemapSquarify.ratio(3))
    .size([width, height])
    // 大洲之间留较宽间距，国家之间只留细缝。
    .paddingInner((node) => (isOverview && node.depth === 0 ? 6 : 1.5))
    .paddingOuter(isOverview ? 2 : 1)
    // 大洲顶部专门留给标题，标题不会盖住国家矩形。
    .paddingTop((node) => (isOverview && node.depth === 1 ? headerHeight : 0))
    .round(true)(root);

  const leaves = root.leaves();
  const continentNodes = isOverview ? root.children || [] : [];
  const svg = d3
    .select(elements.svg)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", width)
    .attr("height", height);

  let defs = svg.select("defs");
  if (defs.empty()) defs = svg.insert("defs", ":first-child");

  let continentLayer = svg.select("g.continent-layer");
  if (continentLayer.empty()) {
    continentLayer = svg.append("g").attr("class", "continent-layer");
  }
  let countryLayer = svg.select("g.country-layer");
  if (countryLayer.empty()) {
    countryLayer = svg.append("g").attr("class", "country-layer");
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const duration = animate && !reducedMotion ? TRANSITION_DURATION : 0;
  const transition = svg.transition("treemap-update").duration(duration).ease(d3.easeCubicInOut);

  // 先画大洲外框与标题，再在上层画各国矩形。
  const continentClips = defs
    .selectAll("clipPath.continent-clip")
    .data(continentNodes, (d) => d.data.key);
  const continentClipsEnter = continentClips
    .enter()
    .append("clipPath")
    .attr("class", "continent-clip");
  continentClipsEnter.append("rect");
  continentClips
    .merge(continentClipsEnter)
    .attr("id", (d) => `${makeClipId(d.data.key)}-header`)
    .select("rect")
    .attr("x", 5)
    .attr("y", 2)
    .attr("width", (d) => Math.max(0, d.x1 - d.x0 - 10))
    .attr("height", (d) => Math.max(0, Math.min(headerHeight, d.y1 - d.y0) - 4));
  continentClips.exit().remove();

  const continentGroups = continentLayer
    .selectAll("g.continent-group")
    .data(continentNodes, (d) => d.data.key);
  const continentEnter = continentGroups
    .enter()
    .append("g")
    .attr("class", "continent-group")
    .attr("transform", `translate(${width / 2},${height / 2})`)
    .style("opacity", animate ? 0 : 1);
  continentEnter.append("rect").attr("class", "continent-boundary").attr("rx", 7);
  continentEnter.append("rect").attr("class", "continent-header").attr("rx", 5);
  const continentTextEnter = continentEnter
    .append("text")
    .attr("x", 8)
    .attr("y", 6)
    .attr("dominant-baseline", "hanging");
  continentTextEnter.append("tspan").attr("class", "continent-header-name").attr("x", 8);
  continentTextEnter.append("tspan").attr("class", "continent-header-meta").attr("x", 8);

  const allContinentGroups = continentEnter
    .merge(continentGroups)
    .attr("tabindex", 0)
    .attr("role", "button")
    .attr("aria-label", (d) => getAriaLabel(getContinentItem(d)))
    .on("pointerenter", function (event, d) {
      showTooltip(event, getContinentItem(d));
      d3.select(this).classed("is-active", true);
    })
    .on("pointermove", function (event) {
      if (state.pinnedKey === null) positionTooltip(event);
    })
    .on("pointerleave", function () {
      d3.select(this).classed("is-active", false);
      if (state.pinnedKey === null) hideTooltip();
    })
    .on("focus", function (event, d) {
      showTooltipForElement(this, getContinentItem(d));
      d3.select(this).classed("is-active", true);
    })
    .on("blur", function () {
      d3.select(this).classed("is-active", false);
      if (state.pinnedKey === null) hideTooltip();
    })
    .on("keydown", function (event, d) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        showCountryView(d.data.continent, true);
      }
    })
    .on("click", function (event, d) {
      event.stopPropagation();
      showCountryView(d.data.continent, true);
    });

  allContinentGroups
    .select(".continent-header-name")
    .attr("dy", 0)
    .text((d) => d.data.name);
  allContinentGroups
    .select(".continent-header-meta")
    .attr("dy", "1.25em")
    .text((d) => `${formatCompactCurrency(d.value)} · ${d.leaves().length} countries`);
  allContinentGroups
    .select("text")
    .attr("clip-path", (d) => `url(#${makeClipId(d.data.key)}-header)`);

  allContinentGroups
    .transition(transition)
    .style("opacity", 1)
    .attr("transform", (d) => `translate(${d.x0},${d.y0})`);
  allContinentGroups
    .select(".continent-boundary")
    .transition(transition)
    .attr("width", (d) => Math.max(0, d.x1 - d.x0))
    .attr("height", (d) => Math.max(0, d.y1 - d.y0))
    .attr("fill", "#101826")
    .attr("stroke", (d) => CONTINENT_COLOR_RANGES[d.data.continent].accent);
  allContinentGroups
    .select(".continent-header")
    .transition(transition)
    .attr("width", (d) => Math.max(0, d.x1 - d.x0))
    .attr("height", (d) => Math.max(0, Math.min(headerHeight, d.y1 - d.y0)))
    .attr("fill", (d) => CONTINENT_COLOR_RANGES[d.data.continent].accent);
  continentGroups.exit().transition(transition).style("opacity", 0).remove();

  const clips = defs.selectAll("clipPath.tile-clip").data(leaves, (d) => d.data.key);
  const clipsEnter = clips.enter().append("clipPath").attr("class", "tile-clip");
  clipsEnter.append("rect");
  clips
    .merge(clipsEnter)
    .attr("id", (d) => makeClipId(d.data.key))
    .select("rect")
    .attr("x", 4)
    .attr("y", 4)
    .attr("width", (d) => Math.max(0, d.x1 - d.x0 - 8))
    .attr("height", (d) => Math.max(0, d.y1 - d.y0 - 8));
  clips.exit().remove();

  const cells = countryLayer.selectAll("g.cell").data(leaves, (d) => d.data.key);
  const cellsEnter = cells
    .enter()
    .append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`)
    .style("opacity", animate ? 0 : 1);
  cellsEnter.append("rect").attr("rx", 3).attr("ry", 3);

  const labelsEnter = cellsEnter
    .append("text")
    .attr("x", 8)
    .attr("y", 8)
    .attr("dominant-baseline", "hanging");
  labelsEnter.append("tspan").attr("class", "label-line-1").attr("x", 8);
  labelsEnter.append("tspan").attr("class", "label-line-2").attr("x", 8);
  labelsEnter.append("tspan").attr("class", "label-line-3").attr("x", 8);
  labelsEnter.append("tspan").attr("class", "label-line-4").attr("x", 8);

  const allCells = cellsEnter
    .merge(cells)
    .attr(
      "class",
      (d) =>
        `cell country-cell${isOverview ? " is-overview" : ""}${
          shouldUseDarkText(d.data, colorScales) ? " is-light-tile" : ""
        }`,
    )
    .attr("data-color-rank", (d) => getCountryTone(d.data, colorScales).toFixed(4))
    .attr("tabindex", 0)
    .attr("role", isOverview ? "button" : "listitem")
    .attr("aria-label", (d) => getAriaLabel(d.data))
    .on("pointerenter", function (event, d) {
      showTooltip(event, d.data);
      d3.select(this).classed("is-active", true);
    })
    .on("pointermove", function (event) {
      if (state.pinnedKey === null) positionTooltip(event);
    })
    .on("pointerleave", function () {
      d3.select(this).classed("is-active", false);
      if (state.pinnedKey === null) hideTooltip();
    })
    .on("focus", function (event, d) {
      showTooltipForElement(this, d.data);
      d3.select(this).classed("is-active", true);
    })
    .on("blur", function () {
      d3.select(this).classed("is-active", false);
      if (state.pinnedKey === null) hideTooltip();
    })
    .on("keydown", function (event, d) {
      if (isOverview && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        showCountryView(d.data.continent, true);
      }
    })
    .on("click", function (event, d) {
      event.stopPropagation();
      if (isOverview) {
        showCountryView(d.data.continent, true);
        return;
      }

      state.pinnedKey = state.pinnedKey === d.data.key ? null : d.data.key;
      if (state.pinnedKey === null) hideTooltip();
      else showTooltipForElement(this, d.data);
    });

  allCells
    .transition(transition)
    .style("opacity", 1)
    .attr("transform", (d) => `translate(${d.x0},${d.y0})`);
  allCells
    .select("rect")
    .transition(transition)
    .attr("width", (d) => Math.max(0, d.x1 - d.x0))
    .attr("height", (d) => Math.max(0, d.y1 - d.y0))
    .attr("fill", (d) => getCountryColor(d.data, colorScales))
    .attr("fill-opacity", 1)
    .attr("opacity", 1)
    .attr("stroke", (d) => getCountryBorder(d.data, colorScales));

  allCells.each(function (d) {
    updateTileLabel(d3.select(this), d);
  });

  cells.exit().transition(transition).style("opacity", 0).remove();
}

function getContinentItem(node) {
  return {
    key: node.data.key,
    kind: "continent",
    name: node.data.name,
    continent: node.data.continent,
    value: node.value,
    countryCount: node.leaves().length,
  };
}

function updateTileLabel(cell, node) {
  const item = node.data;
  const tileWidth = node.x1 - node.x0;
  const tileHeight = node.y1 - node.y0;
  const label = cell.select("text").attr("clip-path", `url(#${makeClipId(item.key)})`);
  const line1 = label.select(".label-line-1");
  const line2 = label.select(".label-line-2");
  const line3 = label.select(".label-line-3");
  const line4 = label.select(".label-line-4");

  const estimatedNameWidth = item.name.length * 7 + 16;
  const showFullLabel = tileWidth >= Math.max(74, estimatedNameWidth) && tileHeight >= 44;
  const showCodeOnly = !showFullLabel && tileWidth >= 34 && tileHeight >= 22;

  label.style("display", showFullLabel || showCodeOnly ? null : "none").attr("y", 7);
  line1
    .attr("class", `label-line-1 ${showFullLabel ? "cell-name" : "cell-code"}`)
    .attr("dy", 0)
    .text(showFullLabel ? item.name : item.code);
  line2
    .attr("class", "label-line-2 cell-value")
    .attr("dy", "1.35em")
    .text(showFullLabel ? formatCompactCurrency(item.value) : "");
  line3.text("");
  line4.text("");
}

function getAriaLabel(item) {
  if (item.kind === "continent") {
    return `${item.name}，GDP ${formatCompactCurrency(item.value)}，${item.countryCount} 个有效国家，占全球显示 GDP ${formatPercent(item.value, state.globalTotal)}。点击查看国家详情。`;
  }
  const continentTotal = state.continentTotals.get(item.continent) || 0;
  return `${item.name}，${item.continent}，GDP ${formatCompactCurrency(item.value)}，占该洲 ${formatPercent(item.value, continentTotal)}，占全球显示 GDP ${formatPercent(item.value, state.globalTotal)}`;
}

// ------------------------------
// 10. 摘要、Tooltip 与页面状态
// ------------------------------
function updateSummary({ count, total, level, countryCount = 0 }) {
  state.currentTotal = total;
  const isCountryView = level === "countries";

  elements.currentYear.textContent = state.selectedYear || "—";
  elements.entityCountLabel.textContent = isCountryView ? "有效国家" : "大洲数量";
  elements.countryCount.textContent = `${count} 个`;
  elements.totalGdp.textContent = total > 0 ? formatCompactCurrency(total) : "—";
  elements.dataNote.textContent = isCountryView
    ? `${state.selectedYear} 年 · ${state.selectedContinent} · ${count} 个国家/经济体`
    : `${state.selectedYear} 年 · ${count} 个大洲 · ${countryCount} 个国家/经济体`;
}

function tooltipMarkup(item) {
  if (item.kind === "continent") {
    return `
      <div class="tooltip-title">${escapeHtml(item.name)}</div>
      <dl class="tooltip-grid">
        <dt>年份</dt><dd>${state.selectedYear}</dd>
        <dt>有效国家</dt><dd>${item.countryCount}</dd>
        <dt>GDP 完整数值</dt><dd>${escapeHtml(formatFullCurrency(item.value))}</dd>
        <dt>GDP 简写</dt><dd>${escapeHtml(formatCompactCurrency(item.value))}</dd>
        <dt>全球显示 GDP 占比</dt><dd>${formatPercent(item.value, state.globalTotal)}</dd>
      </dl>`;
  }

  const continentTotal = state.continentTotals.get(item.continent) || 0;

  return `
    <div class="tooltip-title">${escapeHtml(item.name)}</div>
    <dl class="tooltip-grid">
      <dt>国家代码</dt><dd>${escapeHtml(item.code)}</dd>
      <dt>所属大洲</dt><dd>${escapeHtml(item.continent)}</dd>
      <dt>年份</dt><dd>${item.year}</dd>
      <dt>GDP 完整数值</dt><dd>${escapeHtml(formatFullCurrency(item.value))}</dd>
      <dt>GDP 简写</dt><dd>${escapeHtml(formatCompactCurrency(item.value))}</dd>
      <dt>所属大洲 GDP 占比</dt><dd>${formatPercent(item.value, continentTotal)}</dd>
      <dt>全球显示 GDP 占比</dt><dd>${formatPercent(item.value, state.globalTotal)}</dd>
    </dl>`;
}

function showTooltip(event, item) {
  elements.tooltip.innerHTML = tooltipMarkup(item);
  elements.tooltip.hidden = false;
  positionTooltip(event);
}

function showTooltipForElement(node, item) {
  elements.tooltip.innerHTML = tooltipMarkup(item);
  elements.tooltip.hidden = false;

  const rect = node.getBoundingClientRect();
  positionTooltip({
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2,
  });
}

function positionTooltip(event) {
  const margin = 12;
  const offset = 14;
  const tooltipRect = elements.tooltip.getBoundingClientRect();

  let left = event.clientX + offset;
  let top = event.clientY + offset;

  if (left + tooltipRect.width > window.innerWidth - margin) {
    left = event.clientX - tooltipRect.width - offset;
  }
  if (top + tooltipRect.height > window.innerHeight - margin) {
    top = event.clientY - tooltipRect.height - offset;
  }

  elements.tooltip.style.left = `${Math.max(margin, left)}px`;
  elements.tooltip.style.top = `${Math.max(margin, top)}px`;
}

function hideTooltip() {
  elements.tooltip.hidden = true;
  state.pinnedKey = null;
}

function clearTreemap() {
  state.currentTotal = 0;
  d3.select(elements.svg).selectAll("*").remove();
}

function showEmpty(message) {
  elements.emptyMessage.textContent = message;
  elements.empty.hidden = false;
}

function showLoading() {
  elements.loading.hidden = false;
  elements.error.hidden = true;
  elements.empty.hidden = true;
  elements.yearSelect.disabled = true;
}

function hideMessages() {
  elements.loading.hidden = true;
  elements.error.hidden = true;
  elements.empty.hidden = true;
}

function showError(message) {
  elements.loading.hidden = true;
  elements.empty.hidden = true;
  elements.error.hidden = false;
  elements.errorMessage.textContent = message;
  elements.yearSelect.disabled = true;
}

// ------------------------------
// 11. 页面事件：年份、下钻、返回、重试和响应式更新
// ------------------------------
elements.yearSelect.addEventListener("change", (event) => {
  // 切换年份时保留当前层级与选中的大洲。
  updateVisualization(Number(event.target.value), true);
});

elements.worldCrumb.addEventListener("click", () => showContinentView(true));
elements.backButton.addEventListener("click", () => showContinentView(true));
elements.retryButton.addEventListener("click", loadData);

document.addEventListener("click", (event) => {
  if (!event.target.closest(".cell, .continent-group")) hideTooltip();
});

const resizeObserver = new ResizeObserver(() => {
  window.clearTimeout(state.resizeTimer);
  state.resizeTimer = window.setTimeout(() => {
    if (state.selectedYear && state.dataByYear.size > 0) {
      updateVisualization(state.selectedYear, false);
    }
  }, 120);
});
resizeObserver.observe(elements.chartWrap);

updateNavigation();
loadData();
