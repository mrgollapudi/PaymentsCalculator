
let rounds = [];
let players = new Set();

function capitalizeName(name) {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

function addPlayerToList() {
    const input = document.getElementById('playerListInput');
    const display = document.getElementById('playerListDisplay');
    if (!display) return;
    const names = input.value.split(',').map(name => capitalizeName(name.trim())).filter(Boolean);
    names.forEach(name => players.add(name));
    input.value = '';
    displayPlayerList();
    refreshAllRoundCheckboxes();
}

function displayPlayerList() {
    const display = document.getElementById('playerListDisplay');
    const list = Array.from(players);
    display.textContent = list.length ? 'Players: ' + list.join(', ') : '';
}

function refreshAllRoundCheckboxes() {
    rounds.forEach((_, roundId) => {
        const roundDiv = document.getElementById(`round-${roundId}`);
        if (!roundDiv) return;
        const checkBoxContainer = roundDiv.querySelector('.player-checks');
        const existingSelected = Array.from(document.querySelectorAll(`#entries-${roundId} tr td:first-child`)).map(td => td.textContent);
        checkBoxContainer.innerHTML = Array.from(players).map(player => {
            const checked = existingSelected.includes(player) ? 'checked' : '';
            return `<label><input type="checkbox" value="${player}" onchange="addCheckedPlayer(${roundId}, this)" ${checked}> ${player}</label>`;
        }).join(' ');
    });
}

function addRound() {
    const roundId = rounds.length;
    rounds.push([]);
    const roundDiv = document.createElement('div');
    roundDiv.className = 'round';
    roundDiv.id = `round-${roundId}`;

    const checkboxes = Array.from(players).map(player => `
    <label><input type="checkbox" value="${player}" onchange="addCheckedPlayer(${roundId}, this)"> ${player}</label>
  `).join(' ');

    roundDiv.innerHTML = `
    <h3>Round ${roundId + 1} <button class="btn btn-sm btn-danger float-end ms-2" onclick="deleteRound(${roundId})">Delete</button><button class="btn btn-sm btn-outline-secondary float-end" onclick="toggleRound(${roundId})">Toggle</button></h3>
    <div class="player-checks mb-2">${checkboxes}</div>
    <table class="table table-bordered">
      <thead class="table-light"><tr><th scope="col">Player</th><th scope="col">Gain/Loss</th></tr></thead>
      <tbody id="entries-${roundId}"></tbody>
    </table>
    <div class="error" id="error-${roundId}"></div>
  `;
    document.getElementById('rounds').appendChild(roundDiv);
}

function deleteRound(roundId) {
    document.getElementById(`round-${roundId}`).remove();
    rounds[roundId] = null;
}

function addCheckedPlayer(roundId, checkbox) {
    const tbody = document.getElementById(`entries-${roundId}`);
    const playerName = checkbox.value;

    if (checkbox.checked) {
        if (!document.getElementById(`row-${roundId}-${playerName}`)) {
            const row = document.createElement('tr');
            row.id = `row-${roundId}-${playerName}`;
            row.innerHTML = `
        <td>${playerName}</td>
        <td><input type="number" class="form-control" placeholder="Gain/Loss" /></td>
      `;
            tbody.appendChild(row);
        }
    } else {
        const row = document.getElementById(`row-${roundId}-${playerName}`);
        if (row) row.remove();
    }
}

function calculateSettlement() {
    document.getElementById('results').innerHTML = '';
    const balances = {};
    let hasError = false;

    rounds.forEach((round, roundId) => {
        if (!round) return;
        const entries = document.querySelectorAll(`#entries-${roundId} tr`);
        let roundTotal = 0;
        entries.forEach(entry => {
            const name = entry.querySelector('td').textContent.trim();
            const amount = parseFloat(entry.querySelector('input').value);
            if (!name || isNaN(amount)) return;
            roundTotal += amount;
            balances[name] = (balances[name] || 0) + amount;
        });
        const errorEl = document.getElementById(`error-${roundId}`);
        if (roundTotal !== 0) {
            errorEl.textContent = `Round ${roundId + 1} is unbalanced (Total: ${roundTotal}).`;
            hasError = true;
        } else {
            errorEl.textContent = '';
        }
    });

    if (hasError) return;

    const debtors = [], creditors = [];
    for (const [name, balance] of Object.entries(balances)) {
        if (balance < 0) debtors.push({ name, amount: -balance });
        if (balance > 0) creditors.push({ name, amount: balance });
    }

    let today = new Date();
    let options = { day: "numeric", month: "long", year: "numeric" };
    let dateStr = today.toLocaleDateString("en-GB", options).replace(/(\d+)(?=\s)/, "$1<sup>th</sup>");
    let today = new Date();
    let options = { day: "numeric", month: "long", year: "numeric" };
    let dateStr = today.toLocaleDateString("en-GB", options);
    let tableHTML = `
    <h4 class="text-primary">Settlement Summary - ${dateStr}</h4>`;
    <table class="table table-bordered table-hover">
        <thead class="table-light">
            <tr><th scope="col">From</th><th scope="col">To</th><th scope="col">Amount ($)</th></tr>
        </thead>
        <tbody>
            `;
            let textResult = '';

            while (debtors.length && creditors.length) {
    const debtor = debtors[0];
            const creditor = creditors[0];
            const settleAmount = Math.min(debtor.amount, creditor.amount);

            tableHTML += `<tr><td>${debtor.name}</td><td>${creditor.name}</td><td>${settleAmount.toFixed(2)}</td></tr>`;
            textResult += `${debtor.name} pays ${creditor.name} $${settleAmount.toFixed(2)}\n`;

            debtor.amount -= settleAmount;
            creditor.amount -= settleAmount;

            if (debtor.amount === 0) debtors.shift();
            if (creditor.amount === 0) creditors.shift();
  }

            tableHTML += '</tbody></table>';
    document.getElementById('results').innerHTML = textResult ? tableHTML : 'No debts to settle!';
    window.lastResult = textResult;
}

function downloadResults() {
    const resultEl = document.getElementById('results');
    if (!resultEl || !resultEl.innerHTML.trim()) {
        alert('Please calculate results first.');
        return;
    }
    html2canvas(resultEl).then(canvas => {
        const link = document.createElement('a');
        link.download = 'settlements.png';
        link.href = canvas.toDataURL();
        link.click();
    });
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(() => console.log('Service Worker Registered'))
        .catch(err => console.error('SW registration failed:', err));
}

window.addEventListener('DOMContentLoaded', () => {
    addRound();
});

function resetApp() {
    if (!confirm('Are you sure you want to reset the app? This will remove all rounds and players.')) return;
    rounds = [];
    players.clear();
    document.getElementById('playerListInput').value = '';
    const display = document.getElementById('playerListDisplay');
    if (display) display.textContent = '';
    document.getElementById('rounds').innerHTML = '';
    document.getElementById('results').innerHTML = '';
    addRound();
}

function toggleRound(roundId) {
    const roundBox = document.getElementById(`round-${roundId}`);
    if (!roundBox) return;
    const table = roundBox.querySelector('table');
    const checkboxes = roundBox.querySelector('.player-checks');
    const errorBox = roundBox.querySelector('.error');
    if (table) table.classList.toggle('d-none');
    if (checkboxes) checkboxes.classList.toggle('d-none');
    if (errorBox) errorBox.classList.toggle('d-none');
}
