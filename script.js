// UNIT 4: JavaScript fundamentals - variables, data types, arrays, objects and DOM manipulation
"use strict";

// Constants and variables
const STORAGE_KEY = "transitvoice_unit_project";
let selectedRating = 0;
let reports = loadReports();

// OBJECT: one report contains related information in key/value pairs.
function createReport(formData) {
  return {
    id: generateReportId(),
    passengerName: formData.passengerName || "Anonymous",
    email: formData.email,
    route: formData.route,
    stop: formData.stop,
    category: formData.category,
    travelDate: formData.travelDate,
    description: formData.description,
    rating: Number(formData.rating),
    attachment: formData.attachment,
    status: "Submitted",
    createdAt: new Date().toISOString()
  };
}

// STRING METHODS, NUMBER CONVERSION and RANDOM NUMBER OPERATOR
function generateReportId() {
  const randomNumber = Math.floor(Math.random() * 900000) + 100000;
  return "TV-" + String(randomNumber).padStart(6, "0");
}

// ARRAY: read and parse saved report objects from Local Storage.
function loadReports() {
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (savedData === null) {
    return [];
  }
  try {
    const parsedData = JSON.parse(savedData);
    return Array.isArray(parsedData) ? parsedData : [];
  } catch (error) {
    console.error("Could not read saved reports:", error);
    return [];
  }
}

function saveReports() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

// FUNCTIONS and SCOPE: each function has its own local variables.
function showMessage(message, isError = false) {
  const messageElement = document.getElementById("formMessage");
  messageElement.textContent = message;
  messageElement.style.color = isError ? "#c64f55" : "#159b75";
}

function escapeHTML(value) {
  // Prevent user-entered text from being interpreted as HTML.
  return String(value).replace(/[&<>"']/g, function (character) {
    const entities = {
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    };
    return entities[character];
  });
}

// CONDITIONAL STATEMENTS and BOOLEAN VALUES
function getStatusClass(status) {
  if (status === "Resolved") {
    return "status-resolved";
  } else if (status === "Under Review") {
    return "status-review";
  } else {
    return "status-submitted";
  }
}

function updateRating(value) {
  selectedRating = Number(value);
  const starButtons = document.querySelectorAll("#starPicker button");

  // ARRAY OPERATION: forEach loops through the NodeList.
  starButtons.forEach(function (button) {
    const starNumber = Number(button.dataset.rating);
    button.classList.toggle("active", starNumber <= selectedRating);
    button.setAttribute("aria-pressed", starNumber === selectedRating ? "true" : "false");
  });

  document.getElementById("ratingText").textContent =
    selectedRating + " out of 5 stars";
}

function updateStatistics() {
  // ARRAY METHODS: filter, reduce and length.
  const resolvedReports = reports.filter(function (report) {
    return report.status === "Resolved";
  });

  const totalRating = reports.reduce(function (sum, report) {
    return sum + report.rating;
  }, 0);

  const average = reports.length > 0
    ? (totalRating / reports.length).toFixed(1) + "/5"
    : "—";

  document.getElementById("totalCount").textContent = reports.length;
  document.getElementById("resolvedCount").textContent = resolvedReports.length;
  document.getElementById("averageRating").textContent = average;
}

function renderReports() {
  const tableBody = document.getElementById("reportTable");
  const filterValue = document.getElementById("statusFilter").value;
  const searchValue = document.getElementById("searchReports").value.trim().toLowerCase();

  // ARRAY OPERATIONS: filter() and includes() search the report objects.
  const visibleReports = reports.filter(function (report) {
    const matchesStatus = filterValue === "All" || report.status === filterValue;
    const searchableText = (
      report.id + " " + report.route + " " + report.stop + " " + report.category
    ).toLowerCase();
    const matchesSearch = searchableText.includes(searchValue);
    return matchesStatus && matchesSearch;
  });

  if (visibleReports.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="6" class="empty-cell">No reports match your search or filter.</td></tr>';
    return;
  }

  // TEMPLATE STRINGS build the table rows from report objects.
  tableBody.innerHTML = visibleReports.map(function (report) {
    const stars = "★".repeat(report.rating) + "☆".repeat(5 - report.rating);
    return `
      <tr>
        <td><strong>${escapeHTML(report.id)}</strong></td>
        <td>${escapeHTML(report.route)}<br><small>${escapeHTML(report.stop)}</small></td>
        <td>${escapeHTML(report.category)}</td>
        <td>${stars}</td>
        <td><span class="status ${getStatusClass(report.status)}">${escapeHTML(report.status)}</span></td>
        <td>
          <select class="status-select" data-report-id="${escapeHTML(report.id)}" aria-label="Update status for ${escapeHTML(report.id)}">
            <option ${report.status === "Submitted" ? "selected" : ""}>Submitted</option>
            <option ${report.status === "Under Review" ? "selected" : ""}>Under Review</option>
            <option ${report.status === "Resolved" ? "selected" : ""}>Resolved</option>
          </select>
        </td>
      </tr>`;
  }).join("");
}

function findReport(reportId) {
  // ARRAY METHOD: find() returns the matching report object.
  return reports.find(function (report) {
    return report.id.toUpperCase() === reportId.toUpperCase();
  });
}

function showReportStatus(report) {
  const result = document.getElementById("trackResult");
  if (!report) {
    result.textContent = "No report found. Please check the ID and try again.";
    return;
  }

  result.innerHTML = `
    <div class="result-card">
      <div><strong>${escapeHTML(report.id)}</strong><p>${escapeHTML(report.category)} · ${escapeHTML(report.route)}</p></div>
      <div><span class="status ${getStatusClass(report.status)}">${escapeHTML(report.status)}</span><p>Submitted ${new Date(report.createdAt).toLocaleDateString()}</p></div>
    </div>`;
}

// EVENT LISTENERS: respond to user actions.
document.querySelectorAll("#starPicker button").forEach(function (button) {
  button.addEventListener("click", function () {
    updateRating(button.dataset.rating);
  });
});

document.getElementById("feedbackForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const form = event.currentTarget;

  // HTML validation is checked before JavaScript continues.
  if (!form.reportValidity()) {
    return;
  }
  if (selectedRating === 0) {
    showMessage("Please select a journey rating.", true);
    return;
  }

  // FormData reads the form controls.
  const formData = new FormData(form);
  const report = createReport({
    passengerName: String(formData.get("passengerName")).trim(),
    email: String(formData.get("email")).trim(),
    route: String(formData.get("route")),
    stop: String(formData.get("stop")).trim(),
    category: String(formData.get("category")),
    travelDate: String(formData.get("travelDate")),
    description: String(formData.get("description")).trim(),
    rating: selectedRating,
    attachment: formData.get("attachment")?.name || ""
  });

  // ARRAY METHOD: unshift() adds the newest report at the beginning.
  reports.unshift(report);
  saveReports();
  renderReports();
  updateStatistics();
  document.getElementById("trackId").value = report.id;
  showReportStatus(report);
  showMessage("Feedback submitted successfully. Your report ID is " + report.id);
  form.reset();
  updateRating(0);
});

document.getElementById("trackForm").addEventListener("submit", function (event) {
  event.preventDefault();
  const reportId = document.getElementById("trackId").value.trim().toUpperCase();
  const report = findReport(reportId);
  showReportStatus(report);
});

document.getElementById("reportTable").addEventListener("change", function (event) {
  // EVENT DELEGATION: handle changes from status dropdowns in the table.
  if (event.target.matches(".status-select")) {
    const report = findReport(event.target.dataset.reportId);
    if (report) {
      report.status = event.target.value;
      saveReports();
      renderReports();
      updateStatistics();
    }
  }
});

document.getElementById("statusFilter").addEventListener("change", renderReports);
document.getElementById("searchReports").addEventListener("input", renderReports);

document.getElementById("clearReports").addEventListener("click", function () {
  if (reports.length === 0) {
    showMessage("There are no reports to clear.", true);
    return;
  }
  // BOOLEAN condition and confirmation dialog.
  const shouldClear = window.confirm("Delete all reports saved in this browser?");
  if (shouldClear) {
    reports = [];
    saveReports();
    renderReports();
    updateStatistics();
    document.getElementById("trackResult").textContent = "";
    showMessage("Demo reports have been cleared.");
  }
});

// Mobile navigation: classList and DOM manipulation.
document.getElementById("menuButton").addEventListener("click", function () {
  const navigation = document.querySelector(".main-nav");
  const isOpen = navigation.classList.toggle("open");
  this.setAttribute("aria-expanded", String(isOpen));
});

// Close mobile navigation after a link is selected.
document.querySelectorAll(".main-nav a").forEach(function (link) {
  link.addEventListener("click", function () {
    document.querySelector(".main-nav").classList.remove("open");
    document.getElementById("menuButton").setAttribute("aria-expanded", "false");
  });
});

// Initial page rendering.
renderReports();
updateStatistics();
