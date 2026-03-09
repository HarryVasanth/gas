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

const COLORS = {
  "Gasolina IO95": {
    border: "#0075eb",
    bg: "rgba(0, 117, 235, 0.05)",
  },
  "Gasolina IO98": {
    border: "#00b894",
    bg: "rgba(0, 184, 148, 0.05)",
  },
  "Gasóleo Rodoviário": {
    border: "#ff5252",
    bg: "rgba(255, 82, 82, 0.05)",
  },
  "Gasóleo Colorido": {
    border: "#6c5ce7",
    bg: "rgba(108, 92, 231, 0.05)",
  },
};

let chart = null;
let currentTheme = 'system';
let chartData = null;
let currentPage = 1;
const ITEMS_PER_PAGE = 10;

// --- Theme Management ---
function updateThemeIcon() {
  const icon = document.getElementById("theme-icon");
  const isDark = document.documentElement.getAttribute("data-theme") === "dark" ||
    (currentTheme === 'system' && window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (isDark) {
    icon.innerHTML = '<path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-11.314l.707.707m11.314 11.314l.707.707M12 5a7 7 0 0 0 0 14 7 7 0 0 0 0-14z"></path>';
  } else {
    icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
  }

  // Update meta theme-color
  const metaThemeColor = document.getElementById('theme-color-meta');
  if (metaThemeColor) {
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg-color').trim();
    metaThemeColor.setAttribute('content', bg);
  }
}

function setTheme(theme) {
  currentTheme = theme;
  if (theme === 'system') {
    document.documentElement.removeAttribute("data-theme");
    localStorage.removeItem("theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }
  updateThemeIcon();
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark" ||
    (currentTheme === 'system' && window.matchMedia("(prefers-color-scheme: dark)").matches);

  setTheme(isDark ? 'light' : 'dark');
  if (chartData) renderChart(chartData);
}

// --- Share Management ---
async function shareApp() {
  const shareData = {
    title: 'Preços de Combustíveis na Madeira',
    text: 'Consulte os preços atuais dos combustíveis na Madeira e saiba se deve abastecer agora!',
    url: window.location.href
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  } catch (err) {
    console.error('Error sharing:', err);
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
  const diffText =
    diff !== 0 ? `${diff > 0 ? "+" : ""}${diff.toFixed(3)}€` : "Sem alteração";

  return {
    current: `${current.toFixed(3)}€`,
    previous: `${previous.toFixed(3)}€`,
    icon,
    diffText,
    colorClass,
  };
}

function displayCurrentPrices(data) {
  const container = document.getElementById("current-prices");
  const currentGas = data.current.Gas;
  const previousGas = data.previous.Gas;
  const startDate = new Date(data.current["Start date"]).toLocaleDateString(
    "pt-PT", { day: '2-digit', month: '2-digit', year: 'numeric' }
  );
  const endDate = new Date(data.current["End date"]).toLocaleDateString(
    "pt-PT", { day: '2-digit', month: '2-digit', year: 'numeric' }
  );

  document.getElementById(
    "current-prices-heading"
  ).textContent = `Preços Atuais • ${startDate} — ${endDate}`;

  let html = '<div class="price-cards">';

  const sortedEntries = Object.entries(currentGas).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  for (const [fuelType, price] of sortedEntries) {
    const shortenedFuelType = fuelType === "Gasóleo Colorido e Marcado" ? "Gasóleo Colorido" : fuelType;
    const previousPrice = previousGas[fuelType];
    const { current, icon, diffText, colorClass } = formatPriceDiff(
      price,
      previousPrice
    );

    html += `
      <div class="price-card">
        <div class="fuel-type">${shortenedFuelType}</div>
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

function displayHistoricalTable(data, page = 1) {
  const container = document.getElementById("historical-prices");
  const sortedDates = Object.keys(data).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  const totalPages = Math.ceil(sortedDates.length / ITEMS_PER_PAGE);
  const startIdx = (page - 1) * ITEMS_PER_PAGE;
  const pageDates = sortedDates.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  let html = `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Data</th>
            ${FUEL_TYPES.map((f) => `<th>${f}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
  `;

  for (const date of pageDates) {
    const priceData = data[date];
    html += `<tr><td>${new Date(priceData["Start date"]).toLocaleDateString(
      "pt-PT", { day: '2-digit', month: '2-digit', year: 'numeric' }
    )}</td>`;
    for (const fuelType of FUEL_TYPES) {
      // Handle shortened name vs original name in data
      const dataFuelType = fuelType === "Gasóleo Colorido" ? "Gasóleo Colorido e Marcado" : fuelType;
      const price = priceData.Gas?.[dataFuelType] || priceData.Fuel?.[dataFuelType];
      html += `<td>${price ? price.toFixed(3) + "€" : "-"}</td>`;
    }
    html += "</tr>";
  }

  html += "</tbody></table></div>";

  // Pagination UI
  if (totalPages > 1) {
    html += `
      <div class="pagination">
        <button id="prev-page" class="btn" ${page === 1 ? 'disabled' : ''}>Anterior</button>
        <span class="page-info">Página ${page} de ${totalPages}</span>
        <button id="next-page" class="btn" ${page === totalPages ? 'disabled' : ''}>Próxima</button>
      </div>
    `;
  }

  container.innerHTML = html;

  // Add event listeners for pagination
  if (totalPages > 1) {
    document.getElementById("prev-page").addEventListener("click", () => {
      currentPage--;
      displayHistoricalTable(data, currentPage);
      document.getElementById("history-section").scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    document.getElementById("next-page").addEventListener("click", () => {
      currentPage++;
      displayHistoricalTable(data, currentPage);
      document.getElementById("history-section").scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}

function renderChart(data) {
  const ctx = document.getElementById("priceHistoryChart").getContext("2d");
  const dates = Object.keys(data).sort((a, b) => new Date(a) - new Date(b));

  const isDark = document.documentElement.getAttribute("data-theme") === "dark" ||
    (currentTheme === 'system' && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const textColor = isDark ? "#9299a1" : "#636e72";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)";

  const datasets = FUEL_TYPES.map((fuel) => {
    const color = COLORS[fuel].border;
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, isDark ? `${color}33` : `${color}1A`);
    gradient.addColorStop(1, 'transparent');

    const dataFuelType = fuel === "Gasóleo Colorido" ? "Gasóleo Colorido e Marcado" : fuel;

    return {
      label: fuel,
      data: dates.map(
        (date) => data[date].Gas?.[dataFuelType] || data[date].Fuel?.[dataFuelType]
      ),
      borderColor: color,
      backgroundColor: gradient,
      tension: 0.4,
      fill: true,
      pointRadius: 0,
      pointHoverRadius: 6,
      borderWidth: 2,
    };
  });

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: dates.map((d) => new Date(d).toLocaleDateString("pt-PT", { day: '2-digit', month: '2-digit', year: 'numeric' })),
      datasets: datasets,
    },
    options: {
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      },
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: textColor,
            maxTicksLimit: 6,
            maxRotation: 0,
            font: { size: 10 }
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
            font: { size: 11 }
          },
        },
      },
      plugins: {
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
              weight: '600'
            },
            padding: 15
          },
        },
        tooltip: {
          backgroundColor: isDark ? "#111" : "#fff",
          titleColor: isDark ? "#fff" : "#191c1f",
          bodyColor: isDark ? "#9299a1" : "#636e72",
          borderColor: gridColor,
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          usePointStyle: true,
          callbacks: {
            label: (context) =>
              ` ${context.dataset.label}: ${context.parsed.y.toFixed(3)}€`,
          },
        },
      },
    },
  });
}

async function init() {
  // Load saved theme
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    setTheme(savedTheme);
  } else {
    updateThemeIcon();
  }

  // Setup listeners
  document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
  document.getElementById("share-btn").addEventListener("click", shareApp);

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (currentTheme === 'system') {
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
    displayHistoricalTable(historicalData, currentPage);
    renderChart(historicalData);
  } catch (error) {
    console.error("Error loading data:", error);
    document.getElementById("app").innerHTML = `
      <div class="error-message">
        <p>Erro ao carregar dados. Por favor, tente novamente mais tarde.</p>
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
      .catch((err) => console.log("Service Worker registration failed:", err));
  });
}

init();
