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
