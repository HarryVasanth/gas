const GAS_INFO_URL =
  "https://raw.githubusercontent.com/carlosrsabreu/devo-abastecer/refs/heads/main/gas_info.json";
const GAS_HISTORY_URL =
  "https://raw.githubusercontent.com/carlosrsabreu/devo-abastecer/refs/heads/main/history/gas_info_history.json";

async function fetchData(url) {
  const response = await fetch(url);
  return response.json();
}

function formatPrice(current, previous) {
  const diff = current - previous;
  if (diff > 0) {
    return `${current.toFixed(3)}€   ⬆️   ${previous.toFixed(
      3
    )}€ (+${diff.toFixed(3)}€)`;
  } else if (diff < 0) {
    return `${current.toFixed(3)}€   ⬇️️   ${previous.toFixed(
      3
    )}€ (${diff.toFixed(3)}€)`;
  } else {
    return `${current.toFixed(3)}€   =   ${previous.toFixed(3)}€`;
  }
}

function displayCurrentPrices(data) {
  const currentPricesDiv = document.getElementById("current-prices");
  let html =
    "<table><tr><th>Tipo de Combustível</th><th>Preço Atual vs Anterior</th></tr>";

  for (const [fuelType, price] of Object.entries(data.current.Gas)) {
    const previousPrice = data.previous.Gas[fuelType];
    html += `<tr><td>${fuelType}</td><td>${formatPrice(
      price,
      previousPrice
    )}</td></tr>`;
  }

  html += "</table>";
  currentPricesDiv.innerHTML = html;
}

function displayHistoricalPrices(data) {
  const historicalPricesDiv = document.getElementById("historical-prices");
  let html =
    "<table><tr><th>Data</th><th>Gasolina IO95</th><th>Gasóleo Rodoviário</th><th>Gasóleo Colorido e Marcado</th><th>Gasolina IO98</th></tr>";

  const sortedDates = Object.keys(data).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  for (const date of sortedDates.slice(0, 10)) {
    const priceData = data[date];
    html += `<tr><td>${priceData["Start date"]}</td>`;
    for (const fuelType of [
      "Gasolina IO95",
      "Gasóleo Rodoviário",
      "Gasóleo Colorido e Marcado",
      "Gasolina IO98",
    ]) {
      html += `<td>${priceData.Gas[fuelType].toFixed(3)}€</td>`;
    }
    html += "</tr>";
  }

  html += "</table>";
  historicalPricesDiv.innerHTML = html;
}

// In app.js [3]
async function init() {
  try {
    const currentData = await fetchData(GAS_INFO_URL);
    const historyData = await fetchData(GAS_HISTORY_URL);

    displayCurrentPrices(currentData);
    renderHistoryChart(historyData); // New function call
  } catch (error) {
    // ... existing error handling
  }
}

function renderHistoryChart(historyData) {
  const ctx = document.getElementById("priceHistoryChart").getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: historyData.dates,
      datasets: [
        {
          label: "Preço da Gasolina",
          data: historyData.prices,
          borderColor: "#4CAF50",
          tension: 0.1,
        },
      ],
    },
  });
}

async function loadData() {
  const response = await fetch(
    "https://raw.githubusercontent.com/carlosrsabreu/devo-abastecer/main/history/gas_info_history.json"
  );
  const data = await response.json();

  // Process data
  const dates = Object.keys(data).sort();
  const datasets = [];

  // Create dataset structure
  const fuelTypes = [
    "Gasolina IO95",
    "Gasóleo Rodoviário",
    "Gasóleo Colorido e Marcado",
    "Gasolina IO98",
  ];
  const colors = {
    "Gasolina IO95": "rgb(255, 99, 132)",
    "Gasóleo Rodoviário": "rgb(54, 162, 235)",
    "Gasóleo Colorido e Marcado": "rgb(255, 205, 86)",
    "Gasolina IO98": "rgb(75, 192, 192)",
  };

  fuelTypes.forEach((fuel) => {
    datasets.push({
      label: fuel,
      data: dates.map(
        (date) => data[date].Gas?.[fuel] || data[date].Fuel?.[fuel]
      ),
      borderColor: colors[fuel],
      tension: 0.1,
    });
  });

  // Create chart
  new Chart(document.getElementById("priceHistoryChart"), {
    type: "line",
    data: {
      labels: dates.map((d) => new Date(d).toLocaleDateString()),
      datasets: datasets,
    },
    options: {
      responsive: true,
      interaction: {
        mode: "index",
        intersect: false,
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Date",
          },
        },
        y: {
          title: {
            display: true,
            text: "Price (€/L)",
          },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) =>
              `${context.dataset.label}: €${context.parsed.y.toFixed(3)}`,
          },
        },
      },
    },
  });
}

loadData();

async function init() {
  try {
    const [currentData, historicalData] = await Promise.all([
      fetchData(GAS_INFO_URL),
      fetchData(GAS_HISTORY_URL),
    ]);

    displayCurrentPrices(currentData);
    displayHistoricalPrices(historicalData);
  } catch (error) {
    console.error("🇬🇧 Error loading data:", error);
    document.getElementById("app").innerHTML =
      "<p>🇵🇹 Erro ao carregar dados: Por favor, tente novamente mais tarde. 🇬🇧 Error loading data: Please try again later.</p> ";
  }
}

init();

// Service Worker Registration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => console.log("🇬🇧 Service Worker registered"))
      .catch((err) => console.log("🇬🇧 Error Registering Service Worker", err));
  });
}
