// 数据存储
const Storage = {
    saveData: function(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },
    
    getData: function(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }
};

// 获取头像表情符号
function getAvatarEmoji(avatarId) {
    const avatars = {
        1: '😊',
        2: '😎',
        3: '🤓',
        4: '😄',
        5: '🤠',
        6: '🐱'
    };
    return avatars[avatarId] || '👤';
}

// 玩家管理
const PlayerManager = {
    players: [],
    
    init: function() {
        const savedPlayers = Storage.getData('majiang_players');
        this.players = savedPlayers || [];
        
        // 初始时如果没有玩家，添加一些示例玩家
        if (this.players.length === 0) {
            this.addPlayer('张三', 1);
            this.addPlayer('李四', 2);
            this.addPlayer('王五', 3);
            this.addPlayer('赵六', 4);
        }
    },
    
    addPlayer: function(name, avatarId) {
        const newPlayer = {
            id: Date.now(), // 使用时间戳作为唯一ID
            name: name,
            avatarId: avatarId,
            totalWinnings: 0
        };
        
        this.players.push(newPlayer);
        this.savePlayers();
        return newPlayer;
    },
    
    savePlayers: function() {
        Storage.saveData('majiang_players', this.players);
    },
    
    updatePlayerStats: function(playerId, amount) {
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            player.totalWinnings += amount;
            this.savePlayers();
        }
    },
    
    getPlayerById: function(id) {
        return this.players.find(player => player.id === id);
    }
};

// 游戏管理
const GameManager = {
    currentGame: null,
    games: [],
    
    init: function() {
        const savedGames = Storage.getData('majiang_games');
        this.games = savedGames || [];
        
        // 检查是否有未完成的游戏
        const activeGame = Storage.getData('majiang_active_game');
        if (activeGame) {
            this.currentGame = activeGame;
        }
    },
    
    startNewGame: function(playerIds) {
        this.currentGame = {
            id: Date.now(),
            date: new Date(),
            playerIds: playerIds,
            rounds: [],
            isActive: true
        };
        
        // 保存当前游戏
        Storage.saveData('majiang_active_game', this.currentGame);
        return this.currentGame;
    },
    
    addRound: function(scores) {
        if (!this.currentGame) return;
        
        this.currentGame.rounds.push({
            id: Date.now(),
            scores: scores
        });
        
        // 保存当前游戏
        Storage.saveData('majiang_active_game', this.currentGame);
    },
    
    finishGame: function() {
        if (!this.currentGame) return;
        
        this.currentGame.isActive = false;
        this.games.push(this.currentGame);
        
        // 更新玩家统计数据
        const totals = this.calculateGameTotals(this.currentGame);
        Object.keys(totals).forEach(playerId => {
            PlayerManager.updatePlayerStats(parseInt(playerId), totals[playerId]);
        });
        
        this.saveGames();
        // 清除当前活动游戏
        localStorage.removeItem('majiang_active_game');
        this.currentGame = null;
    },
    
    saveGames: function() {
        Storage.saveData('majiang_games', this.games);
    },
    
    calculateRoundTotal: function(round) {
        let total = 0;
        Object.values(round.scores).forEach(score => {
            total += parseInt(score) || 0;
        });
        return total;
    },
    
    calculateGameTotals: function(game) {
        const totals = {};
        
        // 初始化所有玩家的总额为0
        game.playerIds.forEach(id => {
            totals[id] = 0;
        });
        
        // 计算每一轮的得分并加到总额中
        game.rounds.forEach(round => {
            Object.keys(round.scores).forEach(playerId => {
                totals[playerId] += parseInt(round.scores[playerId]) || 0;
            });
        });
        
        return totals;
    }
};

// UI管理
const UIManager = {
    currentPage: 'home',
    selectedPlayers: [],
    selectedAvatarId: null,
    
    init: function() {
        this.bindEvents();
        this.showPage('home');
        
        // 如果有活动游戏，直接进入游戏记录页面
        if (GameManager.currentGame) {
            this.showPage('game-record');
            this.renderGameRecord();
        }
    },
    
    bindEvents: function() {
        // 主页按钮
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.showPage('player-select');
            this.renderPlayerSelect();
        });
        
        document.getElementById('history-btn').addEventListener('click', () => {
            this.showPage('history');
            this.renderHistory();
        });
        
        document.getElementById('stats-btn').addEventListener('click', () => {
            this.showPage('stats');
            this.renderStats();
        });
        
        // 玩家选择页面
        document.getElementById('add-player-btn').addEventListener('click', () => {
            document.getElementById('add-player-form').style.display = 'block';
        });
        
        document.getElementById('cancel-add-player-btn').addEventListener('click', () => {
            document.getElementById('add-player-form').style.display = 'none';
            document.getElementById('player-name').value = '';
            this.selectedAvatarId = null;
            document.querySelectorAll('.avatar-option').forEach(option => {
                option.classList.remove('selected');
            });
        });
        
        document.querySelectorAll('.avatar-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.avatar-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                e.target.classList.add('selected');
                this.selectedAvatarId = parseInt(e.target.dataset.id);
            });
        });
        
        document.getElementById('save-player-btn').addEventListener('click', () => {
            const playerName = document.getElementById('player-name').value.trim();
            if (playerName && this.selectedAvatarId) {
                PlayerManager.addPlayer(playerName, this.selectedAvatarId);
                document.getElementById('add-player-form').style.display = 'none';
                document.getElementById('player-name').value = '';
                this.selectedAvatarId = null;
                document.querySelectorAll('.avatar-option').forEach(option => {
                    option.classList.remove('selected');
                });
                this.renderPlayerSelect();
            } else {
                alert('请输入玩家姓名并选择头像！');
            }
        });
        
        document.getElementById('back-from-player-select-btn').addEventListener('click', () => {
            this.showPage('home');
        });
        
        document.getElementById('start-game-btn').addEventListener('click', () => {
            if (this.selectedPlayers.length === 4) {
                GameManager.startNewGame(this.selectedPlayers);
                this.showPage('game-record');
                this.renderGameRecord();
            }
        });
        
        // 游戏记录页面
        document.getElementById('next-round-btn').addEventListener('click', () => {
            const scores = {};
            let isValid = true;
            let total = 0;
            
            // 获取所有玩家的得分
            GameManager.currentGame.playerIds.forEach(playerId => {
                const scoreInput = document.getElementById(`score-${playerId}`);
                const score = parseInt(scoreInput.value) || 0;
                scores[playerId] = score;
                total += score;
                scoreInput.value = '0'; // 重置输入框
            });
            
            // 检查总和是否为0
            if (total !== 0) {
                alert('所有玩家的得分总和必须为0！当前总和: ' + total);
                isValid = false;
            }
            
            if (isValid) {
                GameManager.addRound(scores);
                document.getElementById('round-count').textContent = GameManager.currentGame.rounds.length;
            }
        });
        
        document.getElementById('check-current-scores-btn').addEventListener('click', () => {
            this.showCurrentScores();
        });
        
        document.getElementById('close-scores-modal-btn').addEventListener('click', () => {
            document.getElementById('current-scores-modal').classList.remove('active');
        });
        
        document.getElementById('finish-game-btn').addEventListener('click', () => {
            if (GameManager.currentGame && GameManager.currentGame.rounds.length > 0) {
                GameManager.finishGame();
                this.showPage('settlement');
                this.renderSettlement();
            } else {
                alert('至少需要完成一局游戏才能结算！');
            }
        });
        
        // 结算页面
        document.getElementById('back-to-home-btn').addEventListener('click', () => {
            this.showPage('home');
        });
        
        // 历史记录页面
        document.getElementById('back-from-history-btn').addEventListener('click', () => {
            this.showPage('home');
        });
        
        // 统计页面
        document.getElementById('back-from-stats-btn').addEventListener('click', () => {
            this.showPage('home');
        });
    },
    
    showPage: function(pageId) {
        // 隐藏所有页面
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // 显示目标页面
        const page = document.getElementById(pageId + '-page');
        if (page) {
            page.classList.add('active');
            this.currentPage = pageId;
        }
    },
    
    renderPlayerSelect: function() {
        const container = document.getElementById('player-select-container');
        container.innerHTML = '';
        
        // 重置选择的玩家
        this.selectedPlayers = [];
        
        // 渲染所有玩家卡片
        PlayerManager.players.forEach(player => {
            const playerCard = document.createElement('div');
            playerCard.className = 'player-card';
            playerCard.dataset.id = player.id;
            
            playerCard.innerHTML = `
                <div class="avatar">${getAvatarEmoji(player.avatarId)}</div>
                <div class="player-name">${player.name}</div>
            `;
            
            playerCard.addEventListener('click', () => {
                // 如果已选择，则取消选择
                if (playerCard.classList.contains('selected')) {
                    playerCard.classList.remove('selected');
                    this.selectedPlayers = this.selectedPlayers.filter(id => id !== player.id);
                } 
                // 如果未选满4人，则添加选择
                else if (this.selectedPlayers.length < 4) {
                    playerCard.classList.add('selected');
                    this.selectedPlayers.push(player.id);
                }
                
                // 更新开始游戏按钮状态
                document.getElementById('start-game-btn').disabled = this.selectedPlayers.length !== 4;
            });
            
            container.appendChild(playerCard);
        });
    },
    
    renderGameRecord: function() {
        if (!GameManager.currentGame) return;
        
        // 更新局数
        document.getElementById('round-count').textContent = GameManager.currentGame.rounds.length;
        
        // 渲染玩家得分输入区域
        const container = document.getElementById('player-scores-container');
        container.innerHTML = '';
        
        GameManager.currentGame.playerIds.forEach(playerId => {
            const player = PlayerManager.getPlayerById(playerId);
            if (!player) return;
            
            const playerScoreElement = document.createElement('div');
            playerScoreElement.className = 'player-score';
            
            playerScoreElement.innerHTML = `
                <div class="avatar">${getAvatarEmoji(player.avatarId)}</div>
                <div class="player-name">${player.name}</div>
                <input type="number" id="score-${player.id}" class="score-input" placeholder="0" value="0" min="-1000" max="1000">
            `;
            
            container.appendChild(playerScoreElement);
        });
    },
    
    showCurrentScores: function() {
        if (!GameManager.currentGame) return;
        
        const scoresContainer = document.getElementById('current-scores-container');
        scoresContainer.innerHTML = '';
        
        // 计算当前总分
        const totals = GameManager.calculateGameTotals(GameManager.currentGame);
        
        // 根据总分排序玩家（从高到低）
        const sortedPlayerIds = Object.keys(totals).sort((a, b) => totals[b] - totals[a]);
        
        // 渲染每个玩家的总分
        sortedPlayerIds.forEach(playerId => {
            const player = PlayerManager.getPlayerById(parseInt(playerId));
            if (!player) return;
            
            const playerTotal = document.createElement('div');
            playerTotal.className = 'player-total ' + (totals[playerId] >= 0 ? 'positive' : 'negative');
            
            playerTotal.innerHTML = `
                <div class="player-info">
                    <div class="player-avatar">${getAvatarEmoji(player.avatarId)}</div>
                    <div class="player-name">${player.name}</div>
                </div>
                <div class="player-winnings ${totals[playerId] >= 0 ? 'positive-amount' : 'negative-amount'}">
                    ${totals[playerId] >= 0 ? '+' : ''}${totals[playerId]} 元
                </div>
            `;
            
            scoresContainer.appendChild(playerTotal);
        });
        
        // 显示模态框
        document.getElementById('current-scores-modal').classList.add('active');
    },
    
    renderSettlement: function() {
        if (!GameManager.games.length) return;
        
        const lastGame = GameManager.games[GameManager.games.length - 1];
        
        // 更新游戏信息
        document.getElementById('total-rounds').textContent = lastGame.rounds.length;
        document.getElementById('game-date').textContent = new Date(lastGame.date).toLocaleString();
        
        // 计算每个玩家的总分
        const totals = GameManager.calculateGameTotals(lastGame);
        
        // 根据总分排序玩家（从高到低）
        const sortedPlayerIds = Object.keys(totals).sort((a, b) => totals[b] - totals[a]);
        
        // 渲染每个玩家的总分
        const container = document.getElementById('player-totals-container');
        container.innerHTML = '';
        
        sortedPlayerIds.forEach(playerId => {
            const player = PlayerManager.getPlayerById(parseInt(playerId));
            if (!player) return;
            
            const playerTotal = document.createElement('div');
            playerTotal.className = 'player-total ' + (totals[playerId] >= 0 ? 'positive' : 'negative');
            
            playerTotal.innerHTML = `
                <div class="player-info">
                    <div class="player-avatar">${getAvatarEmoji(player.avatarId)}</div>
                    <div class="player-name">${player.name}</div>
                </div>
                <div class="player-winnings ${totals[playerId] >= 0 ? 'positive-amount' : 'negative-amount'}">
                    ${totals[playerId] >= 0 ? '+' : ''}${totals[playerId]} 元
                </div>
            `;
            
            container.appendChild(playerTotal);
        });
    },
    
    renderHistory: function() {
        const container = document.getElementById('history-list-container');
        container.innerHTML = '';
        
        if (GameManager.games.length === 0) {
            container.innerHTML = '<p class="text-center mt-20">暂无历史记录</p>';
            return;
        }
        
        // 按日期倒序排列游戏记录
        const sortedGames = [...GameManager.games].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        sortedGames.forEach(game => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            // 计算总局数和日期
            const roundCount = game.rounds.length;
            const gameDate = new Date(game.date).toLocaleString();
            
            // 计算每个玩家的总分
            const totals = GameManager.calculateGameTotals(game);
            
            // 找出赢得最多的玩家
            let winnerName = '无';
            let maxWinnings = 0;
            
            game.playerIds.forEach(playerId => {
                const player = PlayerManager.getPlayerById(playerId);
                if (player && totals[playerId] > maxWinnings) {
                    maxWinnings = totals[playerId];
                    winnerName = player.name;
                }
            });
            
            historyItem.innerHTML = `
                <div class="history-header">
                    <span class="history-date">${gameDate}</span>
                    <span>局数: ${roundCount}</span>
                </div>
                <div class="history-summary">
                    <p>赢家: ${winnerName} (${maxWinnings} 元)</p>
                </div>
                <div class="history-details" style="display: none;">
                    <div class="player-details"></div>
                </div>
            `;
            
            // 添加点击展开详情功能
            historyItem.addEventListener('click', () => {
                const detailsElement = historyItem.querySelector('.history-details');
                const playerDetailsElement = historyItem.querySelector('.player-details');
                
                if (detailsElement.style.display === 'none') {
                    detailsElement.style.display = 'block';
                    
                    // 渲染玩家详情
                    playerDetailsElement.innerHTML = '';
                    
                    // 按赢钱多少排序
                    const sortedPlayerIds = Object.keys(totals).sort((a, b) => totals[b] - totals[a]);
                    
                    sortedPlayerIds.forEach(playerId => {
                        const player = PlayerManager.getPlayerById(parseInt(playerId));
                        if (!player) return;
                        
                        const playerDetail = document.createElement('div');
                        playerDetail.className = 'player-total ' + (totals[playerId] >= 0 ? 'positive' : 'negative');
                        
                        playerDetail.innerHTML = `
                            <div class="player-info">
                                <div class="player-avatar">${getAvatarEmoji(player.avatarId)}</div>
                                <div class="player-name">${player.name}</div>
                            </div>
                            <div class="player-winnings ${totals[playerId] >= 0 ? 'positive-amount' : 'negative-amount'}">
                                ${totals[playerId] >= 0 ? '+' : ''}${totals[playerId]} 元
                            </div>
                        `;
                        
                        playerDetailsElement.appendChild(playerDetail);
                    });
                } else {
                    detailsElement.style.display = 'none';
                }
            });
            
            container.appendChild(historyItem);
        });
    },
    
    renderStats: function() {
        const container = document.getElementById('stats-container');
        container.innerHTML = '';
        
        if (PlayerManager.players.length === 0) {
            container.innerHTML = '<p class="text-center mt-20">暂无玩家统计数据</p>';
            return;
        }
        
        // 按总赢钱数排序玩家（从高到低）
        const sortedPlayers = [...PlayerManager.players].sort((a, b) => b.totalWinnings - a.totalWinnings);
        
        sortedPlayers.forEach(player => {
            const playerStat = document.createElement('div');
            playerStat.className = 'player-total ' + (player.totalWinnings >= 0 ? 'positive' : 'negative');
            
            playerStat.innerHTML = `
                <div class="player-info">
                    <div class="player-avatar">${getAvatarEmoji(player.avatarId)}</div>
                    <div class="player-name">${player.name}</div>
                </div>
                <div class="player-winnings ${player.totalWinnings >= 0 ? 'positive-amount' : 'negative-amount'}">
                    ${player.totalWinnings >= 0 ? '+' : ''}${player.totalWinnings} 元
                </div>
            `;
            
            container.appendChild(playerStat);
        });
    }
};

// 应用初始化
document.addEventListener('DOMContentLoaded', function() {
    PlayerManager.init();
    GameManager.init();
    UIManager.init();
    
    // 注册Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(error => {
                    console.log('ServiceWorker registration failed: ', error);
                });
        });
    }
});