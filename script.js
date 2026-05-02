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
    } else {
        document.getElementById("results-area").innerHTML =
            `<p></p>`;
    }
});

async function sleep(ms) {
    //   return new Promise(resolve => setTimeout(resolve, ms / speedMultiplier));
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

    document.getElementById("results-area").innerHTML = html;
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
