const GAS_INFO_URL =
  "https://raw.githubusercontent.com/carlosrsabreu/devo-abastecer/refs/heads/main/gas_info.json";
const GAS_HISTORY_URL =
  "https://raw.githubusercontent.com/carlosrsabreu/devo-abastecer/refs/heads/main/history/gas_info_history.json";

const FUEL_TYPES = [
  "Gasolina IO95",
  "Gasolina IO98",
  "Gasóleo Rodoviário",
  "Gasóleo Colorido",
];

const DATA_KEY_MAPPING = {
  "Gasóleo Colorido": "Gasóleo Colorido e Marcado",
};

const COLORS = {
  "Gasolina IO95": {
    border: "#0071e3",
    bg: "rgba(0, 113, 227, 0.05)",
  },
  "Gasolina IO98": {
    border: "#32d74b",
    bg: "rgba(50, 215, 75, 0.05)",
  },
  "Gasóleo Rodoviário": {
    border: "#ff453a",
    bg: "rgba(255, 69, 58, 0.05)",
  },
  "Gasóleo Colorido": {
    border: "#bf5af2",
    bg: "rgba(191, 90, 242, 0.05)",
  },
};

const DATE_OPTIONS = { day: "2-digit", month: "2-digit", year: "numeric" };

const TRANSLATIONS = {
  en: {
    title: "Should I Refuel - Fuel Prices in Madeira",
    headerTitle: "⛽️ Should I Refuel",
    currentPrices: "Current Prices",
    historyPrices: "Price History",
    date: "Date",
    previous: "Previous",
    next: "Next",
    page: "Page {current} of {total}",
    noChange: "No change",
    shareTitle: "Fuel Prices in Madeira",
    shareText:
      "Check current fuel prices in Madeira and know if you should refuel now!",
    shareError: "Error sharing:",
    copySuccess: "Link copied to clipboard!",
    errorLoading: "Error loading data. Please try again later.",
    fuelTypes: {
      "Gasolina IO95": "Petrol 95",
      "Gasolina IO98": "Petrol 98",
      "Gasóleo Rodoviário": "Diesel",
      "Gasóleo Colorido": "Agricultural Diesel",
    },
    installApp: "Install App",
    changeTheme: "Change theme",
    changeLang: "Change language",
    changeChartStyle: "Change chart style",
    resetZoom: "Reset zoom",
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit fullscreen",
    footerText: "Data updated weekly",
    pastWeek: "Past Week",
    currentWeek: "Current Week",
    chartStyles: {
      line: "Line Chart",
      bar: "Bar Chart",
      step: "Step Chart",
      candlestick: "Candlestick Chart",
    },
  },
  pt: {
    title: "Devo Abastecer - Preços de Combustíveis na Madeira",
    headerTitle: "⛽️ Devo Abastecer",
    currentPrices: "Preços Atuais",
    historyPrices: "Histórico de Preços",
    date: "Data",
    previous: "Anterior",
    next: "Próxima",
    page: "Página {current} de {total}",
    noChange: "Sem alteração",
    shareTitle: "Preços de Combustíveis na Madeira",
    shareText:
      "Consulte os preços atuais dos combustíveis na Madeira e saiba se deve abastecer agora!",
    shareError: "Erro ao partilhar:",
    copySuccess: "Link copiado para a área de transferência!",
    errorLoading:
      "Erro ao carregar dados. Por favor, tente novamente mais tarde.",
    fuelTypes: {
      "Gasolina IO95": "Gasolina IO95",
      "Gasolina IO98": "Gasolina IO98",
      "Gasóleo Rodoviário": "Gasóleo Rodoviário",
      "Gasóleo Colorido": "Gasóleo Colorido",
    },
    installApp: "Instalar App",
    changeTheme: "Mudar tema",
    changeLang: "Mudar idioma",
    changeChartStyle: "Mudar estilo do gráfico",
    resetZoom: "Repor zoom",
    fullscreen: "Ecrã inteiro",
    exitFullscreen: "Sair de ecrã inteiro",
    footerText: "Dados atualizados semanalmente",
    pastWeek: "Semana Anterior",
    currentWeek: "Semana Atual",
    chartStyles: {
      line: "Gráfico de Linha",
      bar: "Gráfico de Barras",
      step: "Gráfico de Escada",
      candlestick: "Gráfico de Velas",
    },
  },
};

let chart = null;
let currentPage = 1;
const itemsPerPage = 10;
let currentTheme = "system";
let currentLang = "pt";
let chartStyle = "line";
let cachedCurrentData = null;

// --- Language Management ---
function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("lang", lang);
  document.documentElement.lang = lang;

  // Update static text
  document.title = TRANSLATIONS[lang].title;
  document.querySelector(".app-header h1").textContent =
    TRANSLATIONS[lang].headerTitle;
  document.getElementById("current-prices-heading").textContent =
    TRANSLATIONS[lang].currentPrices;
  document.getElementById("history-heading").textContent =
    TRANSLATIONS[lang].historyPrices;

  // Update aria-labels
  document
    .getElementById("share-btn")
    .setAttribute("aria-label", TRANSLATIONS[lang].shareTitle);
  document
    .getElementById("theme-toggle")
    .setAttribute("aria-label", TRANSLATIONS[lang].changeTheme);
  document
    .getElementById("lang-toggle")
    .setAttribute("aria-label", TRANSLATIONS[lang].changeLang);
  document
    .getElementById("chart-reset-zoom")
    .setAttribute("aria-label", TRANSLATIONS[lang].resetZoom);
  document
    .getElementById("chart-fullscreen")
    .setAttribute(
      "aria-label",
      document
        .getElementById("history-chart-container")
        .classList.contains("fullscreen")
        ? TRANSLATIONS[lang].exitFullscreen
        : TRANSLATIONS[lang].fullscreen,
    );
  document
    .getElementById("install-btn")
    .setAttribute("aria-label", TRANSLATIONS[lang].installApp);

  const footerText = document.getElementById("footer-update-text");
  if (footerText) {
    footerText.textContent = TRANSLATIONS[lang].footerText + " • ";
  }

  document.getElementById("lang-icon").textContent =
    lang === "pt" ? "EN" : "PT";
  document.getElementById("live-badge").textContent =
    lang === "pt" ? "DIRETO" : "LIVE";

  // Refresh dynamic content
  if (cachedCurrentData) displayCurrentPrices(cachedCurrentData);
  if (chartData) {
    displayHistoricalTable(chartData);
    renderChart(chartData);
  }
}

function toggleLanguage() {
  setLanguage(currentLang === "pt" ? "en" : "pt");
}

// --- Chart Style Management ---
function updateChartStyleIcon() {
  const icon = document.getElementById("chart-style-icon");
  const lang = currentLang;

  const styles = {
    line: '<path d="M3 3v18h18"></path><path d="m19 9-5 5-4-4-3 3"></path>',
    bar: '<path d="M3 3v18h18"></path><rect width="4" height="7" x="7" y="10" rx="1"></rect><rect width="4" height="12" x="15" y="5" rx="1"></rect>',
    step: '<path d="M3 3v18h18"></path><path d="M7 15h4V10h4V5h4"></path>',
    candlestick:
      '<path d="M3 3v18h18"></path><rect width="4" height="8" x="7" y="9" rx="1"></rect><path d="M9 17v2"></path><path d="M9 7v2"></path><rect width="4" height="12" x="15" y="5" rx="1"></rect><path d="M17 17v2"></path><path d="M17 3v2"></path>',
  };

  icon.innerHTML = styles[chartStyle] || styles.line;
  document
    .getElementById("chart-style-toggle")
    .setAttribute("aria-label", TRANSLATIONS[lang].chartStyles[chartStyle]);
}

function toggleChartStyle() {
  const styles = ["line", "bar", "step", "candlestick"];
  const currentIndex = styles.indexOf(chartStyle);
  chartStyle = styles[(currentIndex + 1) % styles.length];

  localStorage.setItem("chartStyle", chartStyle);
  updateChartStyleIcon();
  if (chartData) renderChart(chartData);
}

function resetChartZoom() {
  if (chart) chart.resetZoom();
}

function toggleChartFullscreen() {
  const container = document.getElementById("history-chart-container");
  const section = document.getElementById("history-section");
  const icon = document.getElementById("fullscreen-icon");
  const isFullscreen = container.classList.toggle("fullscreen");
  section.classList.toggle("is-fullscreen", isFullscreen);

  if (isFullscreen) {
    icon.innerHTML =
      '<path d="M4 14h6m0 0v6m0-6L3 21m17-7h-6m0 0v6m0-6l7 7M3 3l7 7m0 0V4m0 6H4m17-7l-7 7m0 0V4m0 6h6"></path>';
  } else {
    icon.innerHTML =
      '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>';
  }

  document
    .getElementById("chart-fullscreen")
    .setAttribute(
      "aria-label",
      isFullscreen
        ? TRANSLATIONS[currentLang].exitFullscreen
        : TRANSLATIONS[currentLang].fullscreen,
    );

  if (chart) {
    chart.resize();
  }
}

// --- Theme Management ---
function updateThemeIcon() {
  const icon = document.getElementById("theme-icon");
  const isDark =
    document.documentElement.getAttribute("data-theme") === "dark" ||
    (currentTheme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (isDark) {
    // Sun icon
    icon.innerHTML =
      '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
  } else {
    // Moon icon
    icon.innerHTML =
      '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
  }

  // Update meta theme-color
  const metaThemeColor = document.getElementById("theme-color-meta");
  if (metaThemeColor) {
    const bg = getComputedStyle(document.documentElement)
      .getPropertyValue("--bg-color")
      .trim();
    metaThemeColor.setAttribute("content", bg);
  }
}

function setTheme(theme) {
  currentTheme = theme;
  if (theme === "system") {
    document.documentElement.removeAttribute("data-theme");
    localStorage.removeItem("theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }
  updateThemeIcon();
}

function toggleTheme() {
  const isDark =
    document.documentElement.getAttribute("data-theme") === "dark" ||
    (currentTheme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  setTheme(isDark ? "light" : "dark");
  if (chartData) renderChart(chartData);
}

// --- Share Management ---
async function shareApp() {
  const lang = currentLang;
  const shareData = {
    title: TRANSLATIONS[lang].shareTitle,
    text: TRANSLATIONS[lang].shareText,
    url: window.location.href,
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      alert(TRANSLATIONS[lang].copySuccess);
    }
  } catch (err) {
    console.error(TRANSLATIONS[lang].shareError, err);
  }
}

// --- Data Fetching & Display ---
async function fetchData(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
}

function formatPriceDiff(current, previous) {
  const diff = current - previous;
  const icon = diff > 0 ? "↗" : diff < 0 ? "↘" : "—";
  const colorClass =
    diff > 0 ? "price-up" : diff < 0 ? "price-down" : "price-equal";

  let diffText;
  if (diff !== 0) {
    const percentage = ((diff / previous) * 100).toFixed(2);
    diffText = `${diff > 0 ? "+" : ""}${diff.toFixed(3)}€ (${diff > 0 ? "+" : ""}${percentage}%)`;
  } else {
    diffText = TRANSLATIONS[currentLang].noChange;
  }

  return {
    current: `${current.toFixed(3)}€`,
    previous: `${previous.toFixed(3)}€`,
    icon,
    diffText,
    colorClass,
  };
}

function displayCurrentPrices(data) {
  cachedCurrentData = data;
  const container = document.getElementById("current-prices");
  const currentGas = data.current.Gas;
  const previousGas = data.previous.Gas;
  const locale = currentLang === "pt" ? "pt-PT" : "en-GB";
  const startDate = new Date(data.current["Start date"]).toLocaleDateString(
    locale,
    DATE_OPTIONS,
  );
  const endDate = new Date(data.current["End date"]).toLocaleDateString(
    locale,
    DATE_OPTIONS,
  );

  document.getElementById("current-prices-heading").textContent =
    `${TRANSLATIONS[currentLang].currentPrices} • ${startDate} — ${endDate}`;

  let html = '<div class="price-cards">';

  for (const fuelType of FUEL_TYPES) {
    const dataKey = DATA_KEY_MAPPING[fuelType] || fuelType;
    const price = currentGas[dataKey];
    const previousPrice = previousGas[dataKey];
    const { current, icon, diffText, colorClass } = formatPriceDiff(
      price,
      previousPrice,
    );

    html += `
      <div class="price-card">
        <div class="fuel-type">${TRANSLATIONS[currentLang].fuelTypes[fuelType]}</div>
        <div class="price-value">
          <span class="main-price">${current}</span>
          <span class="price-icon ${colorClass}">${icon}</span>
        </div>
        <div class="price-diff ${colorClass}">${diffText}</div>
      </div>
    `;
  }
  html += "</div>";
  container.innerHTML = html;
}

function displayHistoricalTable(data) {
  const container = document.getElementById("historical-prices");
  const sortedDates = Object.keys(data).sort(
    (a, b) => new Date(b) - new Date(a),
  );

  const totalPages = Math.ceil(sortedDates.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pagedDates = sortedDates.slice(start, end);
  const locale = currentLang === "pt" ? "pt-PT" : "en-GB";

  let html = `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>${TRANSLATIONS[currentLang].date}</th>
            ${FUEL_TYPES.map((f) => `<th>${TRANSLATIONS[currentLang].fuelTypes[f]}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
  `;

  for (const date of pagedDates) {
    const priceData = data[date];
    html += `<tr><td>${new Date(priceData["Start date"]).toLocaleDateString(
      locale,
      DATE_OPTIONS,
    )}</td>`;
    for (const fuelType of FUEL_TYPES) {
      const dataKey = DATA_KEY_MAPPING[fuelType] || fuelType;
      const price = priceData.Gas?.[dataKey] || priceData.Fuel?.[dataKey];
      html += `<td>${price ? price.toFixed(3) + "€" : "-"}</td>`;
    }
    html += "</tr>";
  }

  html += "</tbody></table></div>";

  // Pagination controls
  const pageInfo = TRANSLATIONS[currentLang].page
    .replace("{current}", currentPage)
    .replace("{total}", totalPages);

  html += `
    <div class="pagination">
      <button class="pagination-btn" id="prev-page" ${currentPage === 1 ? "disabled" : ""}>${TRANSLATIONS[currentLang].previous}</button>
      <span class="page-info">${pageInfo}</span>
      <button class="pagination-btn" id="next-page" ${currentPage === totalPages ? "disabled" : ""}>${TRANSLATIONS[currentLang].next}</button>
    </div>
  `;

  container.innerHTML = html;

  document.getElementById("prev-page").onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      displayHistoricalTable(data);
    }
  };

  document.getElementById("next-page").onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      displayHistoricalTable(data);
    }
  };
}

function renderChart(data) {
  const ctx = document.getElementById("priceHistoryChart").getContext("2d");
  const dates = Object.keys(data).sort((a, b) => new Date(a) - new Date(b));

  const isDark =
    document.documentElement.getAttribute("data-theme") === "dark" ||
    (currentTheme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const textColor = isDark ? "#9299a1" : "#636e72";
  const gridColor = isDark
    ? "rgba(255, 255, 255, 0.05)"
    : "rgba(0, 0, 0, 0.05)";
  const locale = currentLang === "pt" ? "pt-PT" : "en-GB";

  let datasets;
  let chartType = "line";

  if (chartStyle === "candlestick") {
    chartType = "candlestick";
    datasets = FUEL_TYPES.map((fuel) => {
      const color = COLORS[fuel].border;
      const dataKey = DATA_KEY_MAPPING[fuel] || fuel;

      return {
        label: TRANSLATIONS[currentLang].fuelTypes[fuel],
        data: dates.map((date, index) => {
          const current =
            data[date].Gas?.[dataKey] || data[date].Fuel?.[dataKey];
          const previous =
            index > 0
              ? data[dates[index - 1]].Gas?.[dataKey] ||
                data[dates[index - 1]].Fuel?.[dataKey]
              : current;

          return {
            x: new Date(date).getTime(),
            o: previous,
            h: Math.max(current, previous),
            l: Math.min(current, previous),
            c: current,
          };
        }),
        color: {
          up: "#ff453a",
          down: "#32d74b",
          unchanged: "#86868b",
        },
        borderColor: color,
      };
    });
  } else {
    chartType = chartStyle === "bar" ? "bar" : "line";
    datasets = FUEL_TYPES.map((fuel) => {
      const color = COLORS[fuel].border;
      const dataKey = DATA_KEY_MAPPING[fuel] || fuel;
      const fuelData = dates.map(
        (date) => data[date].Gas?.[dataKey] || data[date].Fuel?.[dataKey],
      );

      const config = {
        label: TRANSLATIONS[currentLang].fuelTypes[fuel],
        data: fuelData,
        borderColor: color,
        backgroundColor: chartStyle === "bar" ? `${color}80` : "transparent",
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 6,
      };

      if (chartStyle === "line" || chartStyle === "step") {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, isDark ? `${color}33` : `${color}1A`);
        gradient.addColorStop(1, "transparent");
        config.backgroundColor = gradient;
        config.fill = true;
        config.tension = chartStyle === "step" ? 0 : 0.4;
        config.stepped = chartStyle === "step";
      }

      return config;
    });
  }

  if (chart) chart.destroy();

  const chartConfig = {
    type: chartType,
    data: {
      labels:
        chartType === "line" || chartType === "bar" || chartType === "step"
          ? dates.map((d) =>
              new Date(d).toLocaleDateString(locale, DATE_OPTIONS),
            )
          : [],
      datasets: datasets,
    },
    options: {
      animation: {
        duration: 1000,
        easing: "easeOutQuart",
      },
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: chartStyle === "candlestick" ? "nearest" : "index",
        intersect: false,
      },
      scales: {
        x: {
          type: chartStyle === "candlestick" ? "time" : "category",
          grid: {
            display: false,
          },
          ticks: {
            color: textColor,
            maxTicksLimit: 6,
            maxRotation: 0,
            font: { size: 11 },
          },
          time: {
            unit: "month",
          },
        },
        y: {
          grid: {
            color: gridColor,
            drawBorder: false,
          },
          ticks: {
            color: textColor,
            callback: (value) => value.toFixed(2) + "€",
            font: { size: 11 },
          },
        },
      },
      plugins: {
        zoom: {
          pan: {
            enabled: true,
            mode: "x",
          },
          zoom: {
            wheel: {
              enabled: true,
            },
            pinch: {
              enabled: true,
            },
            mode: "x",
          },
        },
        legend: {
          position: "top",
          align: "start",
          labels: {
            color: textColor,
            boxWidth: 8,
            usePointStyle: true,
            pointStyle: "circle",
            font: {
              size: 11,
              weight: "600",
            },
            padding: 15,
          },
        },
        tooltip: {
          enabled: false,
          external: function (context) {
            // Tooltip Element
            let tooltipEl = document.getElementById("chartjs-tooltip");

            // Create element on first render
            if (!tooltipEl) {
              tooltipEl = document.createElement("div");
              tooltipEl.id = "chartjs-tooltip";
              tooltipEl.classList.add("glass-tooltip");
              document.body.appendChild(tooltipEl);
            }

            // Hide if no tooltip
            const tooltipModel = context.tooltip;
            if (tooltipModel.opacity === 0) {
              tooltipEl.style.opacity = 0;
              return;
            }

            // Set caret Position
            tooltipEl.classList.remove("above", "below", "no-transform");
            if (tooltipModel.yAlign) {
              tooltipEl.classList.add(tooltipModel.yAlign);
            } else {
              tooltipEl.classList.add("no-transform");
            }

            function getBody(bodyItem) {
              return bodyItem.lines;
            }

            // Set Text
            if (tooltipModel.body) {
              const titleLines = tooltipModel.title || [];
              const bodyLines = tooltipModel.body.map(getBody);

              let innerHtml = "<thead>";

              titleLines.forEach(function (title) {
                innerHtml += "<tr><th>" + title + "</th></tr>";
              });
              innerHtml += "</thead><tbody>";

              bodyLines.forEach(function (body, i) {
                const colors = tooltipModel.labelColors[i];
                const style = "background:" + colors.borderColor;
                const span =
                  '<span class="tooltip-key" style="' + style + '"></span>';
                body.forEach((line) => {
                  innerHtml += "<tr><td>" + span + line + "</td></tr>";
                });
              });
              innerHtml += "</tbody>";

              let tableRoot = tooltipEl.querySelector("table");
              if (!tableRoot) {
                tableRoot = document.createElement("table");
                tooltipEl.appendChild(tableRoot);
              }
              tableRoot.innerHTML = innerHtml;
            }

            const position = context.chart.canvas.getBoundingClientRect();
            const bodyFont = Chart.helpers.toFont(tooltipModel.options.bodyFont);

            // Display, position, and set styles for font
            tooltipEl.style.opacity = 1;
            tooltipEl.style.position = "absolute";
            tooltipEl.style.left =
              position.left + window.scrollX + tooltipModel.caretX + "px";
            tooltipEl.style.top =
              position.top + window.scrollY + tooltipModel.caretY + "px";
            tooltipEl.style.font = bodyFont.string;
            tooltipEl.style.padding =
              tooltipModel.padding + "px " + tooltipModel.padding + "px";
            tooltipEl.style.pointerEvents = "none";
            tooltipEl.style.transform =
              "translate(-50%, -100%) translateY(-10px)";
            tooltipEl.style.transition = "all 0.1s ease";
          },
          callbacks: {
            label: function (context) {
              if (chartStyle === "candlestick") {
                const p = context.raw;
                return [
                  `${TRANSLATIONS[currentLang].pastWeek}: ${p.o.toFixed(3)}€`,
                  `${TRANSLATIONS[currentLang].currentWeek}: ${p.c.toFixed(3)}€`,
                ];
              }
              return (
                context.dataset.label + ": " + context.parsed.y.toFixed(3) + "€"
              );
            },
          },
        },
      },
    },
  };

  chart = new Chart(ctx, chartConfig);
}

let chartData = null;

async function init() {
  // Load saved theme or default to system
  const savedTheme = localStorage.getItem("theme") || "system";
  setTheme(savedTheme);

  // Load saved language or default to pt
  const savedLang = localStorage.getItem("lang") || "pt";
  setLanguage(savedLang);

  // Load saved chart style
  const savedChartStyle = localStorage.getItem("chartStyle");
  if (savedChartStyle) {
    chartStyle = savedChartStyle;
    updateChartStyleIcon();
  }

  // Setup listeners
  document
    .getElementById("theme-toggle")
    .addEventListener("click", toggleTheme);
  document.getElementById("share-btn").addEventListener("click", shareApp);
  document
    .getElementById("lang-toggle")
    .addEventListener("click", toggleLanguage);
  document
    .getElementById("chart-style-toggle")
    .addEventListener("click", toggleChartStyle);
  document
    .getElementById("chart-reset-zoom")
    .addEventListener("click", resetChartZoom);
  document
    .getElementById("chart-fullscreen")
    .addEventListener("click", toggleChartFullscreen);

  // Scroll handler for navbar transparency
  window.addEventListener("scroll", () => {
    const header = document.querySelector(".app-header");
    if (window.scrollY > 10) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if (currentTheme === "system") {
        updateThemeIcon();
        if (chartData) renderChart(chartData);
      }
    });

  try {
    const [currentData, historicalData] = await Promise.all([
      fetchData(GAS_INFO_URL),
      fetchData(GAS_HISTORY_URL),
    ]);

    chartData = historicalData;
    displayCurrentPrices(currentData);
    displayHistoricalTable(historicalData);
    renderChart(historicalData);
  } catch (error) {
    console.error("Error loading data:", error);
    const lang = currentLang;
    document.getElementById("app").innerHTML = `
      <div class="error-message">
        <p>${TRANSLATIONS[lang].errorLoading}</p>
        <p><small>${error.message}</small></p>
      </div>
    `;
  }
}

// Service Worker Registration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New content is available, show a subtle hint or auto-reload
              // For a "functional" feel, we can reload to ensure the latest version
              window.location.reload();
            }
          });
        });
      })
      .catch((err) => console.log("Service Worker registration failed:", err));
  });
}

// PWA Install Handling
let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const installBtn = document.getElementById("install-btn");
  if (installBtn) {
    installBtn.style.display = "flex";
    // Add a subtle pulse animation if it's mobile
    if (window.innerWidth <= 600) {
      installBtn.style.animation = "pulse 2s infinite";
    }
  }
});

document.getElementById("install-btn").addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === "accepted") {
    document.getElementById("install-btn").style.display = "none";
  }
  deferredPrompt = null;
});

window.addEventListener("appinstalled", () => {
  document.getElementById("install-btn").style.display = "none";
  deferredPrompt = null;
});

// Mouse Glow Tracking
document.addEventListener("mousemove", (e) => {
  const glow = document.getElementById("mouse-glow");
  if (glow) {
    glow.style.left = `${e.clientX}px`;
    glow.style.top = `${e.clientY}px`;
    if (glow.style.opacity !== "1") glow.style.opacity = "1";
  }
});

document.addEventListener("mouseleave", () => {
  const glow = document.getElementById("mouse-glow");
  if (glow) glow.style.opacity = "0";
});

init();
