const GAS_INFO_URL =
  "https://raw.githubusercontent.com/carlosrsabreu/devo-abastecer/refs/heads/main/gas_info.json";
const GAS_HISTORY_URL =
  "https://raw.githubusercontent.com/carlosrsabreu/devo-abastecer/refs/heads/main/history/gas_info_history.json";

const FUEL_TYPES = [
  "Gasolina IO95",
  "Gasolina IO98",
  "Gasóleo Rodoviário",
  "Gasóleo Colorido e Marcado",
];

const COLORS = {
  "Gasolina IO95": {
    border: "rgb(255, 99, 132)",
    bg: "rgba(255, 99, 132, 0.1)",
  },
  "Gasolina IO98": {
    border: "rgb(75, 192, 192)",
    bg: "rgba(75, 192, 192, 0.1)",
  },
  "Gasóleo Rodoviário": {
    border: "rgb(54, 162, 235)",
    bg: "rgba(54, 162, 235, 0.1)",
  },
  "Gasóleo Colorido e Marcado": {
    border: "rgb(255, 205, 86)",
    bg: "rgba(255, 205, 86, 0.1)",
  },
};

let chart = null;

async function fetchData(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
}

function formatPriceDiff(current, previous) {
  const diff = current - previous;
  const icon = diff > 0 ? "⬆️" : diff < 0 ? "⬇️" : "=";
  const colorClass =
    diff > 0 ? "price-up" : diff < 0 ? "price-down" : "price-equal";
  const diffText =
    diff !== 0 ? ` (${diff > 0 ? "+" : ""}${diff.toFixed(3)}€)` : "";

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
    "pt-PT"
  );
  const endDate = new Date(data.current["End date"]).toLocaleDateString("pt-PT");

  document.getElementById(
    "current-prices-heading"
  ).textContent = `Preços Atuais (${startDate} - ${endDate})`;

  let html = '<div class="price-cards">';

  const sortedEntries = Object.entries(currentGas).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  for (const [fuelType, price] of sortedEntries) {
    const previousPrice = previousGas[fuelType];
    const { current, icon, diffText, colorClass } = formatPriceDiff(
      price,
      previousPrice
    );

    html += `
      <div class="price-card">
        <div class="fuel-type">${fuelType}</div>
        <div class="price-value ${colorClass}">
          <span class="main-price">${current}</span>
          <span class="price-icon">${icon}</span>
        </div>
        <div class="price-diff">${diffText}</div>
      </div>
    `;
  }
  html += "</div>";
  container.innerHTML = html;
}

function displayHistoricalTable(data) {
  const container = document.getElementById("historical-prices");
  const sortedDates = Object.keys(data).sort(
    (a, b) => new Date(b) - new Date(a)
  );

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

  for (const date of sortedDates.slice(0, 10)) {
    const priceData = data[date];
    html += `<tr><td>${new Date(priceData["Start date"]).toLocaleDateString(
      "pt-PT"
    )}</td>`;
    for (const fuelType of FUEL_TYPES) {
      const price = priceData.Gas?.[fuelType] || priceData.Fuel?.[fuelType];
      html += `<td>${price ? price.toFixed(3) + "€" : "-"}</td>`;
    }
    html += "</tr>";
  }

  html += "</tbody></table></div>";
  container.innerHTML = html;
}

function renderChart(data) {
  const ctx = document.getElementById("priceHistoryChart").getContext("2d");
  const dates = Object.keys(data).sort((a, b) => new Date(a) - new Date(b));

  const datasets = FUEL_TYPES.map((fuel) => ({
    label: fuel,
    data: dates.map(
      (date) => data[date].Gas?.[fuel] || data[date].Fuel?.[fuel]
    ),
    borderColor: COLORS[fuel].border,
    backgroundColor: COLORS[fuel].bg,
    tension: 0.3,
    fill: true,
    pointRadius: 0,
    pointHoverRadius: 6,
    borderWidth: 2,
  }));

  if (chart) chart.destroy();

  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const textColor = isDark ? "#e0e0e0" : "#333";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)";

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: dates.map((d) => new Date(d).toLocaleDateString("pt-PT")),
      datasets: datasets,
    },
    options: {
      animation: false,
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
            maxTicksLimit: 8,
            maxRotation: 0,
          },
        },
        y: {
          title: {
            display: true,
            text: "Preço (€/L)",
            color: textColor,
            font: {
              weight: "bold",
            },
          },
          grid: {
            color: gridColor,
            drawBorder: false,
          },
          ticks: {
            color: textColor,
            callback: (value) => value.toFixed(2) + "€",
          },
        },
      },
      plugins: {
        legend: {
          position: "top",
          align: "end",
          labels: {
            color: textColor,
            boxWidth: 12,
            usePointStyle: true,
            pointStyle: "circle",
            font: {
              size: 11,
            },
          },
        },
        tooltip: {
          backgroundColor: isDark ? "#2d2d2d" : "#fff",
          titleColor: isDark ? "#fff" : "#2d3436",
          bodyColor: isDark ? "#e0e0e0" : "#2d3436",
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
  try {
    const [currentData, historicalData] = await Promise.all([
      fetchData(GAS_INFO_URL),
      fetchData(GAS_HISTORY_URL),
    ]);

    displayCurrentPrices(currentData);
    displayHistoricalTable(historicalData);
    renderChart(historicalData);

    // Listen for color scheme changes to update chart
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => {
        renderChart(historicalData);
      });
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
