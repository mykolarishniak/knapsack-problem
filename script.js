let currentTab = "brute";
let speedMultiplier = 1;
let isPaused = false;

const tabs = document.querySelectorAll(".tab");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const resumeBtn = document.getElementById("resume-btn");

pauseBtn.addEventListener("click", () => {
    isPaused = true;
});

resumeBtn.addEventListener("click", () => {
    isPaused = false;
});

tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        currentTab = tab.dataset.tab;
    });
});

startBtn.addEventListener("click", async () => {
    const items = parseItems();
    const capacity = parseInt(document.getElementById("capacity").value);

    speedMultiplier = parseInt(document.getElementById("speed").value);

    if (!items.length || isNaN(capacity)) {
        alert("Перевір дані!");
        return;
    }

    if (currentTab === "brute") {
        await visualizeBruteForce(items, capacity);
    } else if (currentTab === "recursive") {
        await visualizeRecursive(items, capacity);
    }
    else if (currentTab === "dp") {
    await visualizeDP(items, capacity);
}
    else {
        document.getElementById("results-area").innerHTML =
            `<p></p>`;
    }
});

async function sleep(ms) {
      while (isPaused) {
        await new Promise(r => setTimeout(r, 100));
    }
    return new Promise(resolve => setTimeout(resolve, ms / speedMultiplier));
}

async function visualizeBruteForce(items, capacity) {
    let n = items.length;
    let maxVal = 0;
    let bestSet = [];

    const output = document.getElementById("results-area");
    output.innerHTML = "";

    let total = 1 << n;

    for (let mask = 0; mask < total; mask++) {
        let weight = 0;
        let value = 0;
        let chosen = [];

        for (let i = 0; i < n; i++) {
            if (mask & (1 << i)) {
                weight += items[i].weight;
                value += items[i].value;
                chosen.push(i);
            }
        }

        output.innerHTML = `
            <div class="result-box fade">
                <p>Перевіряємо комбінацію: ${chosen.map(i => i+1).join(", ") || "—"}</p>
                <p>Вага: ${weight} | Цінність: ${value}</p>
                <p>Поточний максимум: ${maxVal}</p>
            </div>
        `;

        await sleep(300);

        if (weight <= capacity && value > maxVal) {
            maxVal = value;
            bestSet = chosen;

            output.innerHTML += `<p style="color:#10b981">✔ Новий максимум!</p>`;
            await sleep(400);
        }
    }

    renderResult({ maxValue: maxVal, selected: bestSet });
}

async function visualizeRecursive(items, capacity) {
    const output = document.getElementById("results-area");

    async function helper(n, w) {
        output.innerHTML = `
            <div class="result-box fade">
                <p>Рекурсія: n=${n}, w=${w}</p>
            </div>
        `;

        await sleep(300);

        if (n === 0 || w === 0) {
            return { value: 0, items: [] };
        }

        if (items[n - 1].weight > w) {
            return await helper(n - 1, w);
        }

        let exclude = await helper(n - 1, w);
        let include = await helper(n - 1, w - items[n - 1].weight);

        include = {
            value: include.value + items[n - 1].value,
            items: [...include.items, n - 1]
        };

        return include.value > exclude.value ? include : exclude;
    }

    const result = await helper(items.length, capacity);

    renderResult({
        maxValue: result.value,
        selected: result.items
    });
}

function renderResult(result) {
    const items = parseItems();

    let html = `
        <div class="result-box">
            <h3>Результат</h3>
            <p><b>Максимальна цінність:</b> ${result.maxValue}</p>
            <ul>
    `;

    result.selected.forEach(i => {
        html += `<li>Предмет ${i + 1} (w=${items[i].weight}, v=${items[i].value})</li>`;
    });

    html += `</ul></div>`;

    document.getElementById("results-area").innerHTML += html;
}

function parseItems() {
    const text = document.getElementById("items-data").value.trim();
    const lines = text.split("\n");

    let items = [];

    for (let line of lines) {
        let [w, v] = line.split(",").map(Number);
        if (!isNaN(w) && !isNaN(v)) {
            items.push({ weight: w, value: v });
        }
    }

    return items;
}

function clearHighlights() {
    document.querySelectorAll("td").forEach(cell => {
        cell.classList.remove("cell-highlight", "cell-active", "cell-selected");
    });
}

async function visualizeDP(items, capacity) {
    const n = items.length;
    const output = document.getElementById("results-area");

    let dp = Array.from({ length: n + 1 }, () =>
        Array(capacity + 1).fill(0)
    );

    renderDPTable(dp);

    for (let i = 1; i <= n; i++) {
        for (let w = 0; w <= capacity; w++) {

            highlightCell(i, w);

            await sleep(200);

            if (items[i - 1].weight > w) {
                dp[i][w] = dp[i - 1][w];
            } else {
                dp[i][w] = Math.max(
                    dp[i - 1][w],
                    dp[i - 1][w - items[i - 1].weight] + items[i - 1].value
                );
            }

            updateCell(i, w, dp[i][w]);

            await sleep(100);
        }
    }

    //     clearHighlights();
    // let w = capacity;
    // let selected = [];


    // for (let i = n; i > 0; i--) {
    //     if (dp[i][w] !== dp[i - 1][w]) {
    //            highlightSelected(i, w);
    //         selected.push(i - 1);
    //         await sleep(300);
    //         w -= items[i - 1].weight;
    //     }
    // }

    clearHighlights(); // очищаємо старі підсвітки

let w = capacity;
let selected = [];

for (let i = n; i > 0; i--) {

    highlightSelected(i, w);

    await sleep(300);

    if (dp[i][w] !== dp[i - 1][w]) {
        selected.push(i - 1);

        w -= items[i - 1].weight;
    }
}

    renderResult({
        maxValue: dp[n][capacity],
        selected: selected.reverse()
    });
}

function renderDPTable(dp) {
    let html = `<table id="dp-table">`;

    for (let i = 0; i < dp.length; i++) {
        html += `<tr>`;
        for (let j = 0; j < dp[0].length; j++) {
            html += `<td id="cell-${i}-${j}">${dp[i][j]}</td>`;
        }
        html += `</tr>`;
    }

    html += `</table>`;

    document.getElementById("results-area").innerHTML = html;
}

function highlightCell(i, w) {
    const cell = document.getElementById(`cell-${i}-${w}`);
    if (cell) {
        cell.classList.add("cell-active");
    }
}

function updateCell(i, w, value) {
    const cell = document.getElementById(`cell-${i}-${w}`);
    if (cell) {
        cell.textContent = value;
        cell.classList.remove("cell-active");
        cell.classList.add("cell-highlight");
    }
}

function highlightSelected(i, w) {
    const cell = document.getElementById(`cell-${i}-${w}`);
    if (cell) {
         cell.classList.remove("cell-highlight");
        cell.classList.add("cell-selected");
    }
}
