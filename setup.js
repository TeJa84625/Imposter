document.addEventListener('DOMContentLoaded', () => {

    let gameData = {};

    let state = {
        players: [],
        imposterCount: 1,
        selectedCategories: [],
        showHint: false,
    };

    const playerNameInput = document.getElementById('player-name-input');
    const addPlayerBtn = document.getElementById('add-player-btn');
    const playerList = document.getElementById('player-list');
    const imposterDecrementBtn = document.getElementById('imposter-decrement');
    const imposterIncrementBtn = document.getElementById('imposter-increment');
    const imposterCountLabel = document.getElementById('imposter-count-label');
    const categoryList = document.getElementById('category-list');
    const showHintCheckbox = document.getElementById('show-hint-checkbox');
    const startGameBtn = document.getElementById('start-game-btn');

    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    function showModal(title, body) {
        modalTitle.textContent = title;
        modalBody.textContent = body;
        modal.classList.add('show');
    }

    modalCloseBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });

    function renderPlayerList() {
        playerList.innerHTML = '';
        state.players.forEach((name, index) => {
            const li = document.createElement('li');
            li.className = 'flex items-center justify-between bg-gray-700/80 p-2 rounded-lg border border-gray-600';
            li.innerHTML = `
                <span class="text-lg">${name}</span>
                <div class="flex space-x-1">
                    <button data-index="${index}" class="up-btn ${index === 0 ? 'opacity-20' : 'hover:bg-gray-600'} w-7 h-7 rounded-full flex items-center justify-center transition-all">▲</button>
                    <button data-index="${index}" class="down-btn ${index === state.players.length - 1 ? 'opacity-20' : 'hover:bg-gray-600'} w-7 h-7 rounded-full flex items-center justify-center transition-all">▼</button>
                    <button data-index="${index}" class="delete-btn hover:bg-red-600 w-7 h-7 rounded-full flex items-center justify-center transition-all">✖</button>
                </div>
            `;
            playerList.appendChild(li);
        });
    }

    addPlayerBtn.addEventListener('click', () => {
        const name = playerNameInput.value.trim();
        if (name) {
            if (state.players.includes(name)) {
                showModal('Error', 'Player name already exists.');
            } else {
                state.players.push(name);
                renderPlayerList();
                playerNameInput.value = '';
            }
        }
    });

    playerList.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const index = parseInt(btn.dataset.index);

        if (btn.classList.contains('delete-btn')) {
            state.players.splice(index, 1);
        }
        if (btn.classList.contains('up-btn') && index > 0) {
            [state.players[index], state.players[index - 1]] = [state.players[index - 1], state.players[index]];
        }
        if (btn.classList.contains('down-btn') && index < state.players.length - 1) {
            [state.players[index], state.players[index + 1]] = [state.players[index + 1], state.players[index]];
        }
        renderPlayerList();
    });

    imposterDecrementBtn.addEventListener('click', () => {
        if (state.imposterCount > 1) {
            state.imposterCount--;
            imposterCountLabel.textContent = state.imposterCount;
        }
    });

    imposterIncrementBtn.addEventListener('click', () => {
        if (state.imposterCount < Math.max(1, state.players.length - 1)) {
            state.imposterCount++;
            imposterCountLabel.textContent = state.imposterCount;
        } else if (state.players.length < 2) {
            showModal('Error', 'Add more players to add imposters.');
        } else {
            showModal('Error', 'Cannot have that many imposters.');
        }
    });

    function populateCategories() {
        categoryList.innerHTML = '';
        let firstCategory = true;
        for (const category in gameData) {
            const div = document.createElement('div');
            div.className = 'flex items-center space-x-2 bg-gray-700/80 p-2 rounded-lg border border-gray-600';
            div.innerHTML = `
                <input type="checkbox" id="cat-${category}" name="category" value="${category}" class="h-4 w-4 bg-gray-800 border-gray-600 rounded text-blue-500 focus:ring-blue-500 focus:ring-2" ${firstCategory ? 'checked' : ''}>
                <label for="cat-${category}" class="flex-grow">${category}</label>
            `;
            firstCategory = false;
            categoryList.appendChild(div);
        }
    }

    startGameBtn.addEventListener('click', () => {
        if (state.players.length < 3) {
            showModal('Error', 'You need at least 3 players to start.');
            return;
        }
        if (state.imposterCount >= state.players.length) {
            showModal('Error', 'Imposter count must be less than the total number of players.');
            return;
        }
        const checkedCategories = categoryList.querySelectorAll('input[name="category"]:checked');
        if (checkedCategories.length === 0) {
            showModal('Error', 'Please select at least one category.');
            return;
        }

        state.selectedCategories = Array.from(checkedCategories).map(cb => cb.value);
        state.showHint = showHintCheckbox.checked;

        const gameSettings = {
            players: state.players,
            imposterCount: state.imposterCount,
            selectedCategories: state.selectedCategories,
            showHint: state.showHint
        };

        localStorage.setItem('gameSettings', JSON.stringify(gameSettings));

        window.open('game.html', '_blank');
    });

    async function loadGameData() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            gameData = await response.json();
            populateCategories();
        } catch (error) {
            console.error('Failed to load game data:', error);
            startGameBtn.disabled = true;
            startGameBtn.textContent = 'Error: Could not load data';
            startGameBtn.classList.add('opacity-50', 'cursor-not-allowed', 'bg-red-700', 'hover:bg-red-700');
            showModal('Fatal Error', 'Could not load data.json. Please ensure the file exists. The game cannot start.');
        }
    }

    loadGameData();
});