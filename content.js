// Constants
const FAVORITES_API_URL =
  "https://www.car.gr/api/classifieds/buckets/favorite/grouped/";
const CAR_GR_BASE_URL = "https://www.car.gr";
const EXPORT_BUTTON_CLASS = ".export-favorites-button";
const FAVORITES_PAGE_SELECTOR = ".parking-title";
const MODAL_CONTAINER_CLASS = "imodal-container";
const MODAL_RIGHT_CONTROLS_SELECTOR = ".right-controls";
const MODAL_HEADER_SELECTOR = ".imodal-header.parking-header";

// Helper to escape CSV string
function csvSafeString(str) {
  if (typeof str === "undefined" || str === null) {
    return '""'; // Return empty string in CSV format
  }
  return `"${str.replace(/"/g, '""')}"`;
}

// Fetch Favorites Data
async function fetchFavoritesData() {
  try {
    const response = await fetch(FAVORITES_API_URL);
    const data = await response.json();
    const hasData = data.data.groups.length > 0;

    setExportButtonsDisabled(!hasData);
    if (hasData) {
      processFavoritesData(data);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    setExportButtonsDisabled(true);
  }
}

// Set Export Buttons Disabled State
function setExportButtonsDisabled(disabled) {
  document.querySelectorAll(EXPORT_BUTTON_CLASS).forEach((button) => {
    button.disabled = disabled;
  });
}

// Process Favorites Data
function processFavoritesData(data) {
  let csvContent = `data:text/csv;charset=utf-8,ID, Title, Price, Mileage, Company, Model, Registration, Engine Size, Engine Power, Fuel Type, Seller Name, Seller Type, Listing URL\n`;

  data.data.groups.forEach((group) => {
    group.classifieds.forEach((item) => {
      const fullUrl = `${CAR_GR_BASE_URL}${item.seo_url}`;
      const row = [
        item.id || "",
        csvSafeString(item.title),
        item.price || "",
        item.mileage || "",
        csvSafeString(item?.title_parts.make),
        csvSafeString(item?.title_parts.model),
        item.registration || "",
        item.engine_size || "",
        item.engine_power || "",
        csvSafeString(item.fuel_type),
        csvSafeString(item.seller?.name),
        item.seller?.type || "",
        fullUrl,
      ].join(", ");

      csvContent += `${row}\n`;
    });
  });

  triggerCSVDownload(csvContent);
}

// Trigger CSV Download
function triggerCSVDownload(csvContent) {
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "car_gr_favorites.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function injectExportButtonToFavoritesPage() {
  // if we are not on the favorites page, do nothing
  if (window.location.href !== "https://www.car.gr/account/parking/favorite") {
    return;
  }

  const rightControls = document.querySelector(FAVORITES_PAGE_SELECTOR);
  if (!rightControls) {
    console.error("We are not on the favorites page.");
    return;
  }

  const exportButton = createExportButton("Εξαγωγή Αγαπημένων σε CSV");
  rightControls.appendChild(exportButton);
}

// Observe Modal for Changes
function observeModal() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (!mutation.addedNodes) return;

      mutation.addedNodes.forEach((node) => {
        if (node.classList && node.classList.contains(MODAL_CONTAINER_CLASS)) {
          injectExportButtonToModal(node);
        }
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Inject Export Button to Modal
function injectExportButtonToModal(modalNode) {
  const container = modalNode.querySelector(MODAL_RIGHT_CONTROLS_SELECTOR);
  if (!container) {
    console.error("Could not find the container inside the modal.");
    return;
  }

  const exportButton = createExportButton("Εξαγωγή Αγαπημένων σε CSV");
  container.insertBefore(exportButton, container.firstChild);

  adjustModalHeader(modalNode);
}

// Adjust Modal Header
function adjustModalHeader(modalNode) {
  const modalHeader = modalNode.querySelector(MODAL_HEADER_SELECTOR);
  if (!modalHeader) {
    console.error("Could not find the 'imodal-header parking-header' element.");
    return;
  }

  modalHeader.style.height = "70px";
}

// Create Export Button
function createExportButton(innerText) {
  const exportButton = document.createElement("button");
  exportButton.className =
    "btn btn-sm btn-dock flex justify-center items-center mx-2 bg-success text-white";

  exportButton.style.opacity = ".8";
  exportButton.style.lineHeight = "16px";
  exportButton.style.fontSize = "13px";
  exportButton.style.borderRadius = "40px";

  exportButton.innerHTML = `<img src="https://static-cz.car.gr/_nuxt/img/dock_right_white.51d7304.png" class="mr-2" style="height: 15px;"> <span>${innerText}</span>`;
  exportButton.onclick = fetchFavoritesData;
  return exportButton;
}

// Main Function
function main() {
  injectExportButtonToFavoritesPage();
  observeModal();

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extractFavorites") {
      fetchFavoritesData();
    }
  });
}

main();
