// ------------------------------
// 1. 基本设置：API 地址与地区颜色
// ------------------------------
const GDP_API =
  "https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD?format=json&date=2000:2025&per_page=20000";
const COUNTRY_API =
  "https://api.worldbank.org/v2/country?format=json&per_page=400";

// 如果想换颜色，只需要修改这里的十六进制色值。
const REGION_COLORS = {
  "East Asia & Pacific": "#4f87bd",
  "Europe & Central Asia": "#8875b2",
  "Latin America & Caribbean ": "#c66e78",
  "Latin America & Caribbean": "#c66e78",
  "Middle East & North Africa": "#c78b4c",
  "North America": "#4e9d8c",
  "South Asia": "#b99f45",
  "Sub-Saharan Africa ": "#65a064",
  "Sub-Saharan Africa": "#65a064",
  Other: "#7e8a9b",
};

const REGION_ORDER = [
  "East Asia & Pacific",
  "Europe & Central Asia",
  "Latin America & Caribbean",
  "Middle East & North Africa",
  "North America",
  "South Asia",
  "Sub-Saharan Africa",
];

// 若你希望固定默认年份，可把 null 改成数字，例如 2022。
// 保持 null 时，会自动选择“至少有 100 个国家有数据”的最新年份。
const PREFERRED_DEFAULT_YEAR = null;
const MIN_COUNTRIES_FOR_DEFAULT = 100;

// ------------------------------
// 2. 获取页面元素与保存运行状态
// ------------------------------
const elements = {
  yearSelect: document.querySelector("#year-select"),
  currentYear: document.querySelector("#current-year"),
  countryCount: document.querySelector("#country-count"),
  totalGdp: document.querySelector("#total-gdp"),
  dataNote: document.querySelector("#data-note"),
  chartWrap: document.querySelector("#chart-wrap"),
  svg: document.querySelector("#treemap"),
  loading: document.querySelector("#loading-state"),
  error: document.querySelector("#error-state"),
  errorMessage: document.querySelector("#error-message"),
  retryButton: document.querySelector("#retry-button"),
  empty: document.querySelector("#empty-state"),
  tooltip: document.querySelector("#tooltip"),
  legend: document.querySelector("#legend"),
};

const state = {
  dataByYear: new Map(),
  currentYear: null,
  total: 0,
  resizeTimer: null,
  pinnedCode: null,
};

// 世界银行的地区名称偶尔会带有末尾空格，统一清理后再使用。
function normalizeRegion(region) {
  const clean = String(region || "").trim();
  return REGION_ORDER.includes(clean) ? clean : "Other";
}

// ------------------------------
// 3. 数字格式化工具
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
  return `$${scaled.toFixed(digits).replace(/\.0+$|(?<=\.[0-9])0$/, "")}${unit.suffix}`;
}

function formatFullCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ------------------------------
// 4. 从世界银行加载并整理真实数据
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

    // 国家信息接口中，region.id 为 NA / region.value 为 Aggregates 的条目
    // 就是 World、收入组、地区合计等汇总项。这里把它们全部排除。
    const realCountries = new Map();
    countryRows.forEach((country) => {
      const regionId = country.region?.id;
      const regionName = String(country.region?.value || "").trim();
      const isAggregate = regionId === "NA" || regionName === "Aggregates";

      if (!isAggregate && country.id) {
        realCountries.set(country.id, {
          code: country.id,
          name: country.name,
          region: normalizeRegion(regionName),
        });
      }
    });

    const dataByYear = new Map();
    gdpRows.forEach((row) => {
      const country = realCountries.get(row.countryiso3code);
      const year = Number(row.date);
      const value = Number(row.value);

      // 只保留 2000 年之后、真实国家、且 GDP 大于 0 的有效数据。
      if (!country || !Number.isInteger(year) || year < 2000 || !Number.isFinite(value) || value <= 0) {
        return;
      }

      if (!dataByYear.has(year)) dataByYear.set(year, []);
      dataByYear.get(year).push({ ...country, year, value });
    });

    // 每年内部按 GDP 从大到小排列，使图形布局更加稳定、易读。
    dataByYear.forEach((values) => values.sort((a, b) => b.value - a.value));

    if (dataByYear.size === 0) {
      throw new Error("没有找到可用的国家 GDP 数据");
    }

    state.dataByYear = dataByYear;
    setupYearSelector();
    renderLegend();
    hideMessages();
    updateVisualization(state.currentYear, false);
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
  state.currentYear = preferredIsValid ? PREFERRED_DEFAULT_YEAR : automaticYear || years[0];

  elements.yearSelect.replaceChildren();
  years.forEach((year) => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    option.selected = year === state.currentYear;
    elements.yearSelect.append(option);
  });
  elements.yearSelect.disabled = false;
}

// ------------------------------
// 5. 绘制与更新 Treemap
// ------------------------------
function updateVisualization(year, animate = true) {
  const data = state.dataByYear.get(Number(year)) || [];
  state.currentYear = Number(year);
  state.pinnedCode = null;
  hideTooltip();

  if (data.length === 0) {
    elements.empty.hidden = false;
    d3.select(elements.svg).selectAll("*").remove();
    updateSummary([], state.currentYear);
    return;
  }

  elements.empty.hidden = true;
  updateSummary(data, state.currentYear);
  drawTreemap(data, animate);
}

function drawTreemap(data, animate) {
  const width = Math.max(1, elements.chartWrap.clientWidth);
  const height = Math.max(1, elements.chartWrap.clientHeight);

  const root = d3
    .hierarchy({ children: data })
    .sum((item) => item.value || 0)
    .sort((a, b) => b.value - a.value);

  d3
    .treemap()
    .size([width, height])
    .paddingInner(1)
    .paddingOuter(1)
    .round(true)(root);

  const leaves = root.leaves();
  const svg = d3
    .select(elements.svg)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", width)
    .attr("height", height);

  let defs = svg.select("defs");
  if (defs.empty()) defs = svg.append("defs");

  const clips = defs.selectAll("clipPath").data(leaves, (d) => d.data.code);
  const clipsEnter = clips
    .enter()
    .append("clipPath")
    .attr("id", (d) => `clip-${d.data.code}`)
    .append("rect");

  clips
    .select("rect")
    .merge(clipsEnter)
    // 裁剪框使用每个矩形内部的局部坐标，避免文字跑到相邻矩形。
    .attr("x", 4)
    .attr("y", 4)
    .attr("width", (d) => Math.max(0, d.x1 - d.x0 - 8))
    .attr("height", (d) => Math.max(0, d.y1 - d.y0 - 8));
  clips.exit().remove();

  const cells = svg.selectAll("g.cell").data(leaves, (d) => d.data.code);

  const cellsEnter = cells
    .enter()
    .append("g")
    .attr("class", "cell")
    .attr("tabindex", 0)
    .attr("role", "listitem")
    .style("opacity", animate ? 0 : 1);

  cellsEnter.append("rect").attr("rx", 3).attr("ry", 3);

  const labelsEnter = cellsEnter
    .append("text")
    .attr("clip-path", (d) => `url(#clip-${d.data.code})`)
    .attr("x", 8)
    .attr("y", 8);
  labelsEnter.append("tspan").attr("class", "cell-name");
  labelsEnter.append("tspan").attr("class", "cell-value").attr("x", 8).attr("dy", "1.35em");

  const allCells = cellsEnter
    .merge(cells)
    .attr("aria-label", (d) => `${d.data.name}，GDP ${formatCompactCurrency(d.data.value)}`)
    .on("pointerenter", function (event, d) {
      showTooltip(event, d.data);
      d3.select(this).classed("is-active", true);
    })
    .on("pointermove", function (event, d) {
      if (state.pinnedCode === null) positionTooltip(event);
    })
    .on("pointerleave", function () {
      d3.select(this).classed("is-active", false);
      if (state.pinnedCode === null) hideTooltip();
    })
    .on("focus", function (event, d) {
      showTooltipForElement(this, d.data);
      d3.select(this).classed("is-active", true);
    })
    .on("blur", function () {
      d3.select(this).classed("is-active", false);
      if (state.pinnedCode === null) hideTooltip();
    })
    .on("click", function (event, d) {
      event.stopPropagation();
      state.pinnedCode = state.pinnedCode === d.data.code ? null : d.data.code;
      if (state.pinnedCode === null) {
        hideTooltip();
      } else {
        showTooltipForElement(this, d.data);
      }
    });

  const duration = animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 650 : 0;
  const transition = svg.transition().duration(duration).ease(d3.easeCubicInOut);

  allCells
    .transition(transition)
    .style("opacity", 1)
    .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

  allCells
    .select("rect")
    .transition(transition)
    .attr("width", (d) => Math.max(0, d.x1 - d.x0))
    .attr("height", (d) => Math.max(0, d.y1 - d.y0))
    .attr("fill", (d) => REGION_COLORS[d.data.region] || REGION_COLORS.Other);

  allCells.each(function (d) {
    const tileWidth = d.x1 - d.x0;
    const tileHeight = d.y1 - d.y0;
    const estimatedNameWidth = d.data.name.length * 7 + 16;
    const showText = tileWidth >= Math.max(72, estimatedNameWidth) && tileHeight >= 46;
    const label = d3.select(this).select("text");

    label.style("display", showText ? null : "none");
    label.select(".cell-name").text(d.data.name);
    label.select(".cell-value").text(formatCompactCurrency(d.data.value));
  });

  cells
    .exit()
    .transition(transition)
    .style("opacity", 0)
    .remove();
}

// ------------------------------
// 6. 摘要、图例、Tooltip 和错误状态
// ------------------------------
function updateSummary(data, year) {
  state.total = d3.sum(data, (item) => item.value);
  elements.currentYear.textContent = year || "—";
  elements.countryCount.textContent = data.length ? `${data.length} 个` : "0 个";
  elements.totalGdp.textContent = data.length ? formatCompactCurrency(state.total) : "—";
  elements.dataNote.textContent = data.length
    ? `${year} 年 · ${data.length} 个国家/经济体`
    : `${year} 年没有有效数据`;
}

function renderLegend() {
  elements.legend.replaceChildren();
  REGION_ORDER.forEach((region) => {
    const item = document.createElement("div");
    item.className = "legend-item";

    const swatch = document.createElement("span");
    swatch.className = "legend-swatch";
    swatch.style.backgroundColor = REGION_COLORS[region];

    const label = document.createElement("span");
    label.textContent = region;

    item.append(swatch, label);
    elements.legend.append(item);
  });
}

function tooltipMarkup(item) {
  const share = state.total > 0 ? (item.value / state.total) * 100 : 0;
  const shareText = share >= 0.1 ? `${share.toFixed(2)}%` : `${share.toFixed(3)}%`;

  return `
    <div class="tooltip-title">${escapeHtml(item.name)}</div>
    <dl class="tooltip-grid">
      <dt>国家代码</dt><dd>${escapeHtml(item.code)}</dd>
      <dt>所属地区</dt><dd>${escapeHtml(item.region)}</dd>
      <dt>年份</dt><dd>${item.year}</dd>
      <dt>GDP 完整数值</dt><dd>${escapeHtml(formatFullCurrency(item.value))}</dd>
      <dt>GDP 简写</dt><dd>${escapeHtml(formatCompactCurrency(item.value))}</dd>
      <dt>图中占比</dt><dd>${shareText}</dd>
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
  const fakeEvent = { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 };
  positionTooltip(fakeEvent);
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
  state.pinnedCode = null;
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
// 7. 页面事件：切换年份、重试、响应窗口变化
// ------------------------------
elements.yearSelect.addEventListener("change", (event) => {
  updateVisualization(Number(event.target.value), true);
});

elements.retryButton.addEventListener("click", loadData);

document.addEventListener("click", (event) => {
  if (!event.target.closest(".cell")) hideTooltip();
});

const resizeObserver = new ResizeObserver(() => {
  window.clearTimeout(state.resizeTimer);
  state.resizeTimer = window.setTimeout(() => {
    if (state.currentYear && state.dataByYear.size > 0) {
      updateVisualization(state.currentYear, false);
    }
  }, 120);
});
resizeObserver.observe(elements.chartWrap);

loadData();
