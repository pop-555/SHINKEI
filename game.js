(() => {
  const startButton = document.getElementById('start-button');
  const restartButton = document.getElementById('restart-button');
  const board = document.getElementById('card-board');
  const statusPanel = document.querySelector('.status-panel');
  const messageEl = document.getElementById('message');
  const currentPlayerEl = document.getElementById('current-player');
  const player1ScoreEl = document.getElementById('player1-score');
  const player2ScoreEl = document.getElementById('player2-score');
  const remainingPairsEl = document.getElementById('remaining-pairs');

  const suits = ['spades', 'hearts', 'diamonds', 'clubs'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const suitSymbols = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' };
  const suitLabels = { spades: 'スペード', hearts: 'ハート', diamonds: 'ダイヤ', clubs: 'クラブ' };
  const totalPairs = 26;

  const state = {
    deck: [],
    flippedCards: [],
    lockBoard: false,
    scores: { 1: 0, 2: 0 },
    currentPlayer: 1,
    matchedPairs: 0,
    gameActive: false,
  };

  startButton?.addEventListener('click', startGame);
  restartButton?.addEventListener('click', startGame);

  function startGame() {
    state.deck = shuffle(buildDeck());
    state.flippedCards = [];
    state.lockBoard = false;
    state.scores = { 1: 0, 2: 0 };
    state.currentPlayer = 1;
    state.matchedPairs = 0;
    state.gameActive = true;

    board.innerHTML = '';
    renderBoard();

    startButton.classList.add('hidden');
    restartButton.classList.add('hidden');
    statusPanel.classList.remove('hidden');
    messageEl.classList.remove('hidden');
    board.classList.remove('hidden');

    updateScoreboard();
    updateCurrentPlayerDisplay();
    setMessage('プレイヤー1のターンです。カードをめくってペアを探してください。');
  }

  function buildDeck() {
    const deck = [];
    ranks.forEach((rank) => {
      suits.forEach((suit) => {
        deck.push({ rank, suit });
      });
    });
    return deck;
  }

  function shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  function renderBoard() {
    state.deck.forEach((cardData, index) => {
      const cardButton = document.createElement('button');
      cardButton.type = 'button';
      cardButton.className = 'card';
      cardButton.dataset.rank = cardData.rank;
      cardButton.dataset.suit = cardData.suit;
      cardButton.dataset.index = String(index);
      cardButton.setAttribute('aria-pressed', 'false');
      cardButton.setAttribute('aria-label', `${suitLabels[cardData.suit]}の${cardData.rank}`);

      if (cardData.suit === 'hearts' || cardData.suit === 'diamonds') {
        cardButton.classList.add('red-suit');
      }

      const valueSpan = document.createElement('span');
      valueSpan.className = 'card-value';
      valueSpan.textContent = `${cardData.rank}${suitSymbols[cardData.suit]}`;
      cardButton.appendChild(valueSpan);

      cardButton.addEventListener('click', handleCardClick);
      board.appendChild(cardButton);
    });
  }

  function handleCardClick(event) {
    const card = event.currentTarget;

    if (!state.gameActive || state.lockBoard) return;
    if (card.classList.contains('face-up') || card.classList.contains('matched')) return;

    revealCard(card);
    state.flippedCards.push(card);

    if (state.flippedCards.length === 2) {
      state.lockBoard = true;
      window.setTimeout(checkForMatch, 450);
    }
  }

  function revealCard(card) {
    card.classList.add('face-up');
    card.disabled = true;
    card.setAttribute('aria-pressed', 'true');
  }

  function hideCard(card) {
    card.classList.remove('face-up');
    card.disabled = false;
    card.setAttribute('aria-pressed', 'false');
  }

  function checkForMatch() {
    const [firstCard, secondCard] = state.flippedCards;
    if (!firstCard || !secondCard) {
      state.lockBoard = false;
      return;
    }

    const isMatch = firstCard.dataset.rank === secondCard.dataset.rank;

    if (isMatch) {
      resolveMatch(firstCard, secondCard);
    } else {
      resolveMismatch(firstCard, secondCard);
    }
  }

  function resolveMatch(firstCard, secondCard) {
    const reward = state.matchedPairs >= totalPairs - 5 ? 2 : 1;
    const matchedRank = firstCard.dataset.rank;

    state.matchedPairs += 1;
    state.scores[state.currentPlayer] += reward;

    [firstCard, secondCard].forEach((card) => {
      card.classList.add('matched');
      card.setAttribute('aria-pressed', 'true');
      card.disabled = true;
    });

    updateScoreboard();
    setMessage(`プレイヤー${state.currentPlayer}が${matchedRank}のペアを揃えました。${reward}ポイント獲得！続けてめくってください。`);

    state.flippedCards = [];
    state.lockBoard = false;

    if (state.matchedPairs === totalPairs) {
      finishGame();
      return;
    }

    queueTurnMessage(900);
  }

  function resolveMismatch(firstCard, secondCard) {
    setMessage('ペアではありませんでした。');
    window.setTimeout(() => {
      hideCard(firstCard);
      hideCard(secondCard);
      state.flippedCards = [];
      state.lockBoard = false;
      switchPlayer();
      queueTurnMessage();
    }, 900);
  }

  function switchPlayer() {
    state.currentPlayer = state.currentPlayer === 1 ? 2 : 1;
    updateCurrentPlayerDisplay();
  }

  function updateScoreboard() {
    player1ScoreEl.textContent = `プレイヤー1：${state.scores[1]}点`;
    player2ScoreEl.textContent = `プレイヤー2：${state.scores[2]}点`;
    const remaining = totalPairs - state.matchedPairs;
    remainingPairsEl.textContent = `残りペア：${remaining}`;
  }

  function updateCurrentPlayerDisplay() {
    if (!state.gameActive) {
      currentPlayerEl.textContent = 'ゲーム終了';
      player1ScoreEl.classList.remove('active');
      player2ScoreEl.classList.remove('active');
      return;
    }

    currentPlayerEl.textContent = `プレイヤー${state.currentPlayer}のターンです。`;
    player1ScoreEl.classList.toggle('active', state.currentPlayer === 1);
    player2ScoreEl.classList.toggle('active', state.currentPlayer === 2);
  }

  function queueTurnMessage(delay = 0) {
    if (!state.gameActive) return;
    window.setTimeout(() => {
      if (!state.gameActive) return;
      setMessage(`プレイヤー${state.currentPlayer}のターンです。`);
    }, delay);
  }

  function setMessage(text) {
    messageEl.textContent = text;
  }

  function finishGame() {
    state.gameActive = false;
    state.lockBoard = true;

    const allCards = board.querySelectorAll('.card');
    allCards.forEach((card) => {
      card.disabled = true;
      card.classList.add('face-up');
    });

    updateCurrentPlayerDisplay();

    const { 1: p1, 2: p2 } = state.scores;
    let resultMessage = '引き分けです。';
    if (p1 > p2) {
      resultMessage = 'プレイヤー1の勝ち！';
    } else if (p2 > p1) {
      resultMessage = 'プレイヤー2の勝ち！';
    }

    setMessage(`ゲーム終了：${resultMessage}`);
    restartButton.classList.remove('hidden');
    restartButton.focus({ preventScroll: true });
  }
})();
