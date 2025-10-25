document.addEventListener('DOMContentLoaded', () => {

    let gameData = {};
    let previousWord = null;

    let state = {
        // --- From localStorage ---
        players: [],
        imposterCount: 1,
        selectedCategories: [],
        showHint: false,
        currentScreen: 'start-fullscreen',
        // --- Game-specific state ---
        imposters: [],
        crewmates: [],
        selectedWord: "",
        selectedHint: "",
        currentPlayerIndex: 0,
        currentVoterIndex: 0,
        votes: {},
        currentScreen: 'round',
        discussionStarter: "",
        votedPlayersCount: 0,
    };

    // --- Screen Selectors ---
    const screens = {
        'start-fullscreen': document.getElementById('start-fullscreen-screen'),
        round: document.getElementById('round-screen'),
        discussion: document.getElementById('discussion-screen'),
        voting: document.getElementById('voting-screen'),
        reveal: document.getElementById('reveal-screen'),
    };

    // --- Round Screen ---
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const currentPlayerLabel = document.getElementById('current-player-label');
    const gameCard = document.getElementById('game-card');
    const playerRole = document.getElementById('player-role');
    const playerWord = document.getElementById('player-word');
    const playerHint = document.getElementById('player-hint');
    const nextPlayerBtn = document.getElementById('next-player-btn');

    // --- Discussion Screen ---
    const startingPlayerLabel = document.getElementById('starting-player-label');
    const showVoteBtn = document.getElementById('show-vote-btn');
    const revealBtn = document.getElementById('reveal-btn');

    // --- Voting Screen ---
    const currentVoterLabel = document.getElementById('current-voter-label');
    const voteOptionsList = document.getElementById('vote-options-list');
    const nextVoterBtn = document.getElementById('next-voter-btn');
    const voteError = document.getElementById('vote-error');

    // --- Reveal Screen ---
    const revealTitle = document.getElementById('reveal-title');
    const imposterRevealList = document.getElementById('imposter-reveal-list');
    const wordRevealList = document.getElementById('word-reveal-list');
    const revealContinueControls = document.getElementById('reveal-continue-controls');
    const revealContinueBtn = document.getElementById('reveal-continue-btn');
    const revealEndGameBtn = document.getElementById('reveal-end-game-btn');
    
    // --- Modals ---
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    // --- Core Functions ---
    function showScreen(screenId) {
        Object.values(screens).forEach(screen => screen.classList.remove('active'));
        if (screens[screenId]) {
            screens[screenId].classList.add('active');
            state.currentScreen = screenId;
        }
    }

    function showModal(title, body) {
        modalTitle.textContent = title;
        modalBody.textContent = body;
        modal.classList.add('show');
    }

    // Continue modal function removed

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // --- Game Logic ---
    function initializeGame() {
        state.imposters = [];
        state.crewmates = [];
        state.selectedWord = "";
        state.selectedHint = "";
        state.currentPlayerIndex = 0;
        state.currentVoterIndex = 0;
        state.votes = {};
        state.discussionStarter = "";
        state.votedPlayersCount = 0;

        // Select category
        const chosenCategoryName = state.selectedCategories[Math.floor(Math.random() * state.selectedCategories.length)];
        const words = Object.keys(gameData[chosenCategoryName]);

        // Randomly select a word but ensure it’s not the same as the previous one
        let word = words[Math.floor(Math.random() * words.length)];
        while (word === previousWord) {
            word = words[Math.floor(Math.random() * words.length)];
        }

        // Get hint array for the chosen word
        const hints = gameData[chosenCategoryName][word];

        // Pick a random hint from the array
        const randomHint = hints[Math.floor(Math.random() * hints.length)];

        // Save word and hint in state
        state.selectedWord = word;
        state.selectedHint = randomHint;

        // Update previous word for next round
        previousWord = word;

        // Assign roles
        let playersCopy = [...state.players];
        shuffleArray(playersCopy);

        for (let i = 0; i < state.imposterCount; i++) {
            state.imposters.push(playersCopy.pop());
        }
        state.crewmates = playersCopy;
    }

    function displayCurrentPlayerCard() {
        nextPlayerBtn.classList.add('hidden');
        const player = state.players[state.currentPlayerIndex];
        currentPlayerLabel.textContent = `It's ${player}'s turn`;

        gameCard.classList.remove('flipped');

        if (state.imposters.includes(player)) {
            playerRole.textContent = "You are the Imposter!";
            playerRole.className = "text-4xl font-bold text-red-500";
            playerWord.textContent = "";
            playerHint.textContent = state.showHint ? `Hint: ${state.selectedHint}` : " "; //No hint this round!
        } else {
            playerRole.textContent = "You are a Crewmate";
            playerRole.className = "text-4xl font-bold text-green-400";
            playerWord.textContent = `The word is: ${state.selectedWord}`;
            playerHint.textContent = "";
        }

        if (state.currentPlayerIndex === state.players.length - 1) {
            nextPlayerBtn.textContent = "Start Discussion";
        } else {
            nextPlayerBtn.textContent = "Next Player";
        }
    }

    function renderVoteList() {
        const voterName = state.players[state.currentVoterIndex];
        currentVoterLabel.textContent = voterName;
        voteOptionsList.innerHTML = '';
        voteError.textContent = '';

        const isMultiVote = state.imposterCount > 1;
        const inputType = isMultiVote ? 'checkbox' : 'radio';

        if (isMultiVote) {
            const info = document.createElement('p');
            info.className = 'text-center text-sm text-gray-400 pb-2';
            info.textContent = `Select up to ${state.imposterCount} players.`;
            voteOptionsList.appendChild(info);
        }

        state.players.forEach(name => {
            if (name === voterName) return;

            const div = document.createElement('div');
            div.className = 'flex items-center space-x-3 bg-gray-700/80 p-3 rounded-lg border border-gray-600';
            div.innerHTML = `
                <input type="${inputType}" id="vote-${name}" name="vote-option" value="${name}" class="h-5 w-5 bg-gray-800 border-gray-600 rounded${isMultiVote ? '' : '-full'} text-blue-500 focus:ring-blue-500 focus:ring-2">
                <label for="vote-${name}" class="flex-grow text-lg">${name}</label>
            `;
            voteOptionsList.appendChild(div);
        });

        if (state.votedPlayersCount === state.players.length - 1) {
            nextVoterBtn.textContent = "Tally Votes";
        } else {
            nextVoterBtn.textContent = "Next Voter";
        }
    }

    function tallyVotes() {
        const voteCounts = {};
        let maxVotes = 0;
        let votedOutPlayers = [];

        for (const voter in state.votes) {
            const vote = state.votes[voter];
            if (Array.isArray(vote)) {
                for (const votedPlayer of vote) {
                    voteCounts[votedPlayer] = (voteCounts[votedPlayer] || 0) + 1;
                }
            } else {
                voteCounts[vote] = (voteCounts[vote] || 0) + 1;
            }
        }

        for (const player in voteCounts) {
            if (voteCounts[player] > maxVotes) {
                maxVotes = voteCounts[player];
            }
        }

        if (maxVotes > 0) {
            for (const player in voteCounts) {
                if (voteCounts[player] === maxVotes) {
                    votedOutPlayers.push(player);
                }
            }
        }

        let title;
        
        if (votedOutPlayers.length === 0) {
            title = "Imposters Win! (No Votes)";
        } else if (votedOutPlayers.length > 1) {
            title = "Imposters Win! (Vote Tied)";
        } else {
            const votedOutPlayer = votedOutPlayers[0];
            const wasImposter = state.imposters.includes(votedOutPlayer);

            if (wasImposter) {
                const remainingImposters = state.imposters.filter(imp => imp !== votedOutPlayer);
                if (remainingImposters.length === 0) {
                    title = "Crewmates Win!";
                } else {
                    title = "Imposters Win! (Imposter Found)";
                }
            } else {
                title = "Imposters Win! (Crewmate Ejected)";
            }
        }

        // Call revealGame instead of the modal
        revealGame(title);
    }

    function revealGame(title) {
        revealTitle.textContent = title;
        imposterRevealList.textContent = state.imposters.length > 0 ? state.imposters.join(', ') : "N/A";
        wordRevealList.textContent = state.selectedWord ? state.selectedWord : "N/A";

        // Always show the continue/end buttons
        revealContinueControls.classList.remove('hidden');
        
        showScreen('reveal');
    }

    // --- Event Listeners ---
    fullscreenBtn.addEventListener('click', () => {
        let element = document.documentElement;
        if (element.requestFullscreen) element.requestFullscreen();
        else if (element.mozRequestFullScreen) element.mozRequestFullScreen();
        else if (element.webkitRequestFullscreen) element.webkitRequestFullscreen();
        else if (element.msRequestFullscreen) element.msRequestFullscreen();
        
        // Now show the first round screen
        showScreen('round');
    });

    // Modals
    modalCloseBtn.addEventListener('click', () => modal.classList.remove('show'));
    
    // Continue/End modal listeners removed

    // Round Screen
    let pressTimer;
    gameCard.addEventListener('mousedown', () => {
        pressTimer = setTimeout(() => {
            gameCard.classList.add('flipped');
            nextPlayerBtn.classList.remove('hidden');
        }, 150);
    });
    gameCard.addEventListener('mouseup', () => {
        clearTimeout(pressTimer);
        gameCard.classList.remove('flipped');
    });
    gameCard.addEventListener('mouseleave', () => {
        clearTimeout(pressTimer);
        gameCard.classList.remove('flipped');
    });

    gameCard.addEventListener('touchstart', (e) => {
        e.preventDefault();
        pressTimer = setTimeout(() => {
            gameCard.classList.add('flipped');
            nextPlayerBtn.classList.remove('hidden');
        }, 150);
    }, { passive: false });
    gameCard.addEventListener('touchend', () => {
        clearTimeout(pressTimer);
        gameCard.classList.remove('flipped');
    });

    nextPlayerBtn.addEventListener('click', () => {
        if (state.currentPlayerIndex < state.players.length - 1) {
            state.currentPlayerIndex++;
            displayCurrentPlayerCard();
        } else {
            const randomPlayer = state.players[Math.floor(Math.random() * state.players.length)];
            state.discussionStarter = randomPlayer;
            startingPlayerLabel.textContent = randomPlayer;
            showScreen('discussion');
        }
    });

    // Discussion Screen
    showVoteBtn.addEventListener('click', () => {
        state.votedPlayersCount = 0;
        const startIndex = state.players.indexOf(state.discussionStarter);
        state.currentVoterIndex = (startIndex >= 0) ? startIndex : 0;
        renderVoteList();
        showScreen('voting');
    });

    revealBtn.addEventListener('click', () => {
        revealGame("Imposter(s) Revealed!");
    });

    // Voting Screen
    nextVoterBtn.addEventListener('click', () => {
        const selectedOptions = voteOptionsList.querySelectorAll('input[name="vote-option"]:checked');
        voteError.textContent = '';

        if (selectedOptions.length === 0) {
            voteError.textContent = 'Please select at least one player.';
            return;
        }

        const voterName = state.players[state.currentVoterIndex];

        if (state.imposterCount > 1) {
            if (selectedOptions.length > state.imposterCount) {
                voteError.textContent = `You can only select up to ${state.imposterCount} players.`;
                return;
            }
            state.votes[voterName] = Array.from(selectedOptions).map(cb => cb.value);
        } else {
            state.votes[voterName] = selectedOptions[0].value;
        }

        state.votedPlayersCount++;

        if (state.votedPlayersCount < state.players.length) {
            state.currentVoterIndex = (state.currentVoterIndex + 1) % state.players.length;
            renderVoteList();
        } else {
            tallyVotes();
        }
    });

    // Reveal Screen
    // Standalone endGameBtn listener removed

    revealContinueBtn.addEventListener('click', () => {
        // Start a new round
        initializeGame();
        displayCurrentPlayerCard();
        showScreen('round');
    });

    revealEndGameBtn.addEventListener('click', () => {
        window.close();
        // Ask user for confirmation to close the tab
        // const confirmation = confirm("Are you sure you want to close this tab?");
    
        // if (confirmation) {
        //     // Try to close the current tab (only works if the tab was opened using window.open())
        //     window.close();
        // }
    });


    // --- Initialization ---
    async function loadGameData() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            gameData = await response.json();

            // Now that data is loaded, get settings and start game
            const settingsString = localStorage.getItem('gameSettings');
            if (!settingsString) {
                // No settings, go back to setup
                window.location.href = 'setup.html';
                return;
            }

            const settings = JSON.parse(settingsString);
            state.players = settings.players;
            state.imposterCount = settings.imposterCount;
            state.selectedCategories = settings.selectedCategories;
            state.showHint = settings.showHint;
            
            // Start the first round
            initializeGame();
            displayCurrentPlayerCard();
            showScreen('start-fullscreen');

        } catch (error) {
            console.error('Failed to load game data:', error);
            showModal('Fatal Error', 'Could not load game data.json. Redirecting to setup.');
            setTimeout(() => {
                window.location.href = 'setup.html';
            }, 3000);
        }
    }

    loadGameData();
});