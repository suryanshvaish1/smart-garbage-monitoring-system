const MAX_HISTORY_POINTS = 20;
const HISTORY_INTERVAL_MS = 3000;

let chartLabels = [];
let fillHistory = [];
let bins = [];

const chartCanvas = document.getElementById("fillLevelChart");

const fillLevelChart = new Chart(chartCanvas, {
    type: "line",

    data: {
        labels: chartLabels,
        datasets: [{
            label: "Bin 01 Fill Level (%)",
            data: fillHistory,
            borderColor: "#16a34a",
            backgroundColor: "rgba(22, 163, 74, 0.12)",
            fill: true,
            tension: 0.3
        }]
    },

    options: {
        responsive: true,
        maintainAspectRatio: false,

        scales: {
            y: {
                min: 0,
                max: 100,
                title: {
                    display: true,
                    text: "Fill Level (%)"
                }
            }
        }
    }
});


function getStatus(fill) {
    if (fill >= 80) return "Almost Full";
    if (fill >= 50) return "Half Full";
    return "Has Space";
}


function updateBinCard(bin, index) {
    const number = index + 1;

    document.getElementById(`fill${number}`).textContent =
        `${Math.round(bin.fill_level)}%`;

    document.getElementById(`distance${number}`).textContent =
        `${Number(bin.sensor_distance_cm).toFixed(2)} cm`;

    const badge = document.getElementById(`status${number}`);
    const bar = document.getElementById(`bar${number}`);

    const status = getStatus(bin.fill_level);

    badge.textContent = status;
    badge.className = "badge";

    bar.style.width = `${bin.fill_level}%`;
    bar.className = "progress-bar";

    if (bin.fill_level >= 80) {
        badge.classList.add("danger");
        bar.classList.add("danger");
    } else if (bin.fill_level >= 50) {
        badge.classList.add("warning");
        bar.classList.add("warning");
    }
}


function updateAlerts() {
    const alerts = bins
        .filter(bin => bin.fill_level >= 80)
        .map(bin => `
            <div class="alert-item danger">
                <strong>⚠ ${bin.device_id} is almost full.</strong>
                Current fill level: ${bin.fill_level}%.
                Collection may be required.
            </div>
        `);

    bins
        .filter(bin => bin.fill_level >= 50 && bin.fill_level < 80)
        .forEach(bin => {
            alerts.push(`
                <div class="alert-item warning">
                    <strong>⚠ ${bin.device_id} is more than half full.</strong>
                    Current fill level: ${bin.fill_level}%.
                </div>
            `);
        });

    if (alerts.length === 0) {
        alerts.push(`
            <div class="alert-item">
                ✓ No bins currently require attention.
            </div>
        `);
    }

    document.getElementById("alertList").innerHTML =
        alerts.join("");
}


function updateSummary() {
    const attention = bins.filter(
        bin => bin.fill_level >= 80
    ).length;

    const average = bins.length
        ? bins.reduce((sum, bin) => sum + bin.fill_level, 0) / bins.length
        : 0;

    document.getElementById("totalBins").textContent = bins.length;
    document.getElementById("attentionBins").textContent = attention;

    document.getElementById("averageFill").textContent =
        `${Math.round(average)}%`;
}


async function fetchBins() {
    const connection = document.getElementById("connection");

    try {
        const response = await fetch("/api/bins");

        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();

        bins = data.bins;

        bins.forEach((bin, index) => {
            updateBinCard(bin, index);
        });

        updateSummary();
        updateAlerts();

        connection.textContent = "Backend Connected";
        connection.className = "connection";

        // Record the latest backend reading.
        const bin01 = bins.find(bin => bin.device_id === "BIN-01");

        if (bin01) {
            const now = new Date();

            chartLabels.push(now.toLocaleTimeString());
            fillHistory.push(bin01.fill_level);

            if (chartLabels.length > MAX_HISTORY_POINTS) {
                chartLabels.shift();
                fillHistory.shift();
            }

            fillLevelChart.update();
        }

    } catch (error) {
        console.error("Failed to fetch bin readings:", error);

        connection.textContent = "Backend Disconnected";
        connection.className = "connection disconnected";
    }
}


// Update Bin 01 through the Flask API.

async function updateBinOnServer(binId, fillLevel) {
    const response = await fetch(`/api/bins/${binId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            fill_level: Number(fillLevel)
        })
    });

    if (!response.ok) {
        throw new Error(`Failed to update ${binId}`);
    }

    await fetchBins();
}


// Slider control

const slider = document.getElementById("fillSlider");

slider.addEventListener("input", function() {
    document.getElementById("sliderValue").textContent =
        `${slider.value}%`;
});

slider.addEventListener("change", async function() {
    try {
        await updateBinOnServer("BIN-01", slider.value);
    } catch (error) {
        console.error(error);
        alert("Could not update the bin. Check whether Flask is running.");
    }
});


// Reset both bins through the API.

document.getElementById("resetButton").addEventListener(
    "click",
    async function() {
        try {
            await updateBinOnServer("BIN-01", 35);
            await updateBinOnServer("BIN-02", 85);

            slider.value = 35;

            document.getElementById("sliderValue").textContent = "35%";
        } catch (error) {
            console.error(error);
            alert("Could not reset the demo.");
        }
    }
);


// Initial fetch and periodic refresh.

fetchBins();

setInterval(fetchBins, HISTORY_INTERVAL_MS);