let rounds = [];  // array of objects: { name, type, amount }
let players = new Set();

function capitalizeName(name) {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

function saveToLocalStorage() {
  localStorage.setItem('players', JSON.stringify(Array.from(players)));
  const roundData = Array.from(document.querySelectorAll('.round')).map(roundDiv => {
    const roundId = parseInt(roundDiv.id.split('-')[1]);
    const entries = Array.from(document.querySelectorAll(`#entries-${roundId} tr`)).map(tr => {
      const name = tr.querySelector('td').textContent;
      const inputs = tr.querySelectorAll('input');
      return {
        name,
        type: inputs[0].checked ? 'gain' : 'loss',
        amount: inputs[2].value
      };
    });
    return entries;
  });
  localStorage.setItem('rounds', JSON.stringify(roundData));
}

function loadFromLocalStorage() {
  const storedPlayers = JSON.parse(localStorage.getItem('players')) || [];
  storedPlayers.forEach(name => players.add(name));
  displayPlayerList();

  const storedRounds = JSON.parse(localStorage.getItem('rounds')) || [];
  storedRounds.forEach((entries, roundId) => {
    addRound();
    entries.forEach(({ name, type, amount }) => {
      const checkbox = document.querySelector(`#round-${roundId} input[value='${name}']`);
      if (checkbox) {
        checkbox.checked = true;
        addCheckedPlayer(roundId, checkbox);
        const row = document.getElementById(`row-${roundId}-${name}`);
        if (row) {
          const inputs = row.querySelectorAll('input');
          if (type === 'gain') inputs[0].checked = true;
          else inputs[1].checked = true;
          inputs[2].value = amount;
        }
      }
    });
  });
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
        <td>
          <div class="input-group">
            <div class="input-group-text">
              <input type="radio" name="type-${roundId}-${playerName}" value="gain" checked> +
            </div>
            <div class="input-group-text">
              <input type="radio" name="type-${roundId}-${playerName}" value="loss"> -
            </div>
            <input type="number" class="form-control" inputmode="numeric" pattern="[0-9]*" placeholder="Amount">
          </div>
        </td>
      `;
      tbody.appendChild(row);
    }
  } else {
    const row = document.getElementById(`row-${roundId}-${playerName}`);
    if (row) row.remove();
  }
}

// Save data on every change
window.addEventListener('beforeunload', saveToLocalStorage);

// Restore on load
window.addEventListener('DOMContentLoaded', () => {
  loadFromLocalStorage();
  if (rounds.length === 0) addRound();
});
