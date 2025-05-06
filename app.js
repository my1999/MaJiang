/**
 * 麻将记账助手 - JavaScript
 */

// ==============================================
// 工具函数
// ==============================================

/**
 * 获取头像emoji
 */
function getAvatarEmoji(avatarId) {
    const avatars = {
        1: '😊',
        2: '😎',
        3: '🤓',
        4: '😄',
        5: '🤠',
        6: '🐱',
        7: '🐶',
        8: '🐼',
        9: '🐻'
    };
    return avatars[avatarId] || '👤';
}

/**
 * 格式化数字，添加正负号和单位
 */
function formatScore(score) {
    if (score === 0) return '0';
    return (score > 0 ? '+' : '') + score + ' 元';
}

/**
 * 格式化日期时间
 */
function formatDateTime(date) {
    const d = new Date(date);
    return d.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * 生成唯一ID
 */
function generateId() {
    return Date.now().toString() + Math.floor(Math.random() * 1000).toString();
}

/**
 * 显示页面
 */
function showPage(pageId) {
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // 显示目标页面
    const page = document.getElementById(pageId);
    if (page) {
        page.classList.add('active');
    }
}

/**
 * 打开模态框
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

/**
 * 关闭模态框
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// ==============================================
// 数据模型
// ==============================================

/**
 * 存储管理器
 */
const StorageManager = {
    /**
     * 保存数据
     */
    saveData: function(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('保存数据失败:', error);
            return false;
        }
    },
    
    /**
     * 获取数据
     */
    getData: function(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('获取数据失败:', error);
            return null;
        }
    }
};

/**
 * 玩家管理器
 */
const PlayerManager = {
    players: [],
    
    /**
     * 初始化
     */
    init: function() {
        const savedPlayers = StorageManager.getData('majiang_players');
        this.players = savedPlayers || [];
    },
    
    /**
     * 获取所有玩家
     */
    getAllPlayers: function() {
        return this.players;
    },
    
    /**
     * 添加玩家
     */
    addPlayer: function(name, avatarId) {
        const newPlayer = {
            id: generateId(),
            name: name,
            avatarId: avatarId,
            totalWinnings: 0,
            createdAt: new Date()
        };
        
        this.players.push(newPlayer);
        this.save();
        return newPlayer;
    },
    
    /**
     * 删除玩家
     */
    deletePlayer: function(playerId) {
        const index = this.players.findIndex(player => player.id === playerId);
        if (index !== -1) {
            this.players.splice(index, 1);
            this.save();
            return true;
        }
        return false;
    },
    
    /**
     * 获取玩家
     */
    getPlayer: function(playerId) {
        return this.players.find(player => player.id === playerId);
    },
    
    /**
     * 更新玩家统计
     */
    updatePlayerStats: function(playerId, amount) {
        const player = this.getPlayer(playerId);
        if (player) {
            player.totalWinnings += amount;
            this.save();
            return true;
        }
        return false;
    },
    
    /**
     * 保存玩家数据
     */
    save: function() {
        StorageManager.saveData('majiang_players', this.players);
    }
};

/**
 * 游戏管理器
 */
const GameManager = {
    games: [],
    currentGame: null,
    
    /**
     * 初始化
     */
    init: function() {
        const savedGames = StorageManager.getData('majiang_games');
        this.games = savedGames || [];
        
        // 检查是否有未完成的游戏
        const activeGame = StorageManager.getData('majiang_active_game');
        if (activeGame) {
            this.currentGame = activeGame;
        }
    },
    
    /**
     * 开始新游戏
     */
    startNewGame: function(playerIds) {
        this.currentGame = {
            id: generateId(),
            startDate: new Date(),
            endDate: null,
            playerIds: playerIds,
            rounds: []
        };
        
        this.saveCurrentGame();
        return this.currentGame;
    },
    
    /**
     * 添加回合
     */
    addRound: function(scores) {
        if (!this.currentGame) return false;
        
        const newRound = {
            id: generateId(),
            date: new Date(),
            scores: scores
        };
        
        this.currentGame.rounds.push(newRound);
        this.saveCurrentGame();
        return true;
    },
    
    /**
     * 结束游戏
     */
    finishGame: function() {
        if (!this.currentGame) return false;
        
        this.currentGame.endDate = new Date();
        this.games.push(this.currentGame);
        
        // 更新玩家统计数据
        const totals = this.calculateGameTotals(this.currentGame);
        Object.keys(totals).forEach(playerId => {
            PlayerManager.updatePlayerStats(playerId, totals[playerId]);
        });
        
        this.saveGames();
        this.clearCurrentGame();
        return true;
    },
    
    /**
     * 计算游戏总分
     */
    calculateGameTotals: function(game) {
        const totals = {};
        
        game.playerIds.forEach(id => {
            totals[id] = 0;
        });
        
        game.rounds.forEach(round => {
            Object.keys(round.scores).forEach(playerId => {
                const score = parseInt(round.scores[playerId]) || 0;
                totals[playerId] = (totals[playerId] || 0) + score;
            });
        });
        
        return totals;
    },
    
    /**
     * 获取所有游戏
     */
    getAllGames: function() {
        return this.games;
    },
    
    /**
     * 获取游戏详情
     */
    getGame: function(gameId) {
        return this.games.find(game => game.id === gameId);
    },
    
    /**
     * 保存当前游戏
     */
    saveCurrentGame: function() {
        if (this.currentGame) {
            StorageManager.saveData('majiang_active_game', this.currentGame);
        }
    },
    
    /**
     * 清除当前游戏
     */
    clearCurrentGame: function() {
        this.currentGame = null;
        localStorage.removeItem('majiang_active_game');
    },
    
    /**
     * 保存所有游戏
     */
    saveGames: function() {
        StorageManager.saveData('majiang_games', this.games);
    }
};

// ==============================================
// UI控制器
// ==============================================

/**
 * 应用控制器
 */
const AppController = {
    // 已选择的玩家IDs
    selectedPlayerIds: [],
    // 添加玩家时选择的头像ID
    selectedAvatarId: null,
    
    /**
     * 初始化应用
     */
    init: function() {
        // 初始化数据
        PlayerManager.init();
        GameManager.init();
        
        // 绑定事件监听
        this.bindEvents();
        
        // 如果有进行中的游戏，直接进入游戏页面
        if (GameManager.currentGame) {
            showPage('game-page');
            GameUIController.renderGame();
        }
    },
    
    /**
     * 绑定事件监听
     */
    bindEvents: function() {
        // 主页按钮
        document.getElementById('new-game-btn').addEventListener('click', () => {
            showPage('player-page');
            this.renderPlayerList();
        });
        
        document.getElementById('history-btn').addEventListener('click', () => {
            showPage('history-page');
            HistoryUIController.renderHistory();
        });
        
        document.getElementById('stats-btn').addEventListener('click', () => {
            showPage('stats-page');
            StatsUIController.renderStats();
        });
        
        // 返回主页按钮
        document.getElementById('back-to-home').addEventListener('click', () => {
            showPage('home-page');
        });
        
        // 玩家页面 - 添加玩家
        document.getElementById('add-player-btn').addEventListener('click', () => {
            this.resetAddPlayerForm();
            openModal('add-player-modal');
        });
        
        // 添加玩家弹窗
        document.querySelectorAll('.avatar-option').forEach(option => {
            option.addEventListener('click', () => {
                // 移除其他选中状态
                document.querySelectorAll('.avatar-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                
                // 设置当前选中
                option.classList.add('selected');
                this.selectedAvatarId = parseInt(option.getAttribute('data-id'));
                
                // 检查保存按钮状态
                this.checkSavePlayerButtonState();
            });
        });
        
        document.getElementById('player-name').addEventListener('input', () => {
            this.checkSavePlayerButtonState();
        });
        
        document.getElementById('cancel-add-player').addEventListener('click', () => {
            closeModal('add-player-modal');
        });
        
        document.getElementById('save-player').addEventListener('click', () => {
            const nameInput = document.getElementById('player-name');
            const name = nameInput.value.trim();
            
            if (name && this.selectedAvatarId) {
                // 添加玩家
                PlayerManager.addPlayer(name, this.selectedAvatarId);
                
                // 关闭弹窗
                closeModal('add-player-modal');
                
                // 重新渲染玩家列表
                this.renderPlayerList();
            }
        });
        
        // 玩家页面 - 开始游戏
        document.getElementById('start-game-btn').addEventListener('click', () => {
            if (this.selectedPlayerIds.length === 4) {
                // 开始游戏
                GameManager.startNewGame(this.selectedPlayerIds);
                
                // 进入游戏页面
                showPage('game-page');
                GameUIController.renderGame();
            }
        });
    },
    
    /**
     * 检查保存玩家按钮状态
     */
    checkSavePlayerButtonState: function() {
        const nameInput = document.getElementById('player-name');
        const saveButton = document.getElementById('save-player');
        
        if (nameInput.value.trim() && this.selectedAvatarId) {
            saveButton.disabled = false;
        } else {
            saveButton.disabled = true;
        }
    },
    
    /**
     * 重置添加玩家表单
     */
    resetAddPlayerForm: function() {
        const nameInput = document.getElementById('player-name');
        nameInput.value = '';
        
        document.querySelectorAll('.avatar-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        this.selectedAvatarId = null;
        document.getElementById('save-player').disabled = true;
    },
    
    /**
     * 渲染玩家列表
     */
    renderPlayerList: function() {
        const container = document.getElementById('player-list');
        container.innerHTML = '';
        
        const players = PlayerManager.getAllPlayers();
        
        // 重置已选择的玩家
        this.selectedPlayerIds = [];
        
        if (players.length === 0) {
            container.innerHTML = '<div class="empty-state">还没有玩家，请添加新玩家</div>';
            document.getElementById('start-game-btn').disabled = true;
            document.getElementById('selected-count').textContent = '0';
            return;
        }
        
        // 创建玩家卡片
        players.forEach(player => {
            const playerCard = document.createElement('div');
            playerCard.className = 'player-card';
            playerCard.dataset.id = player.id;
            
            playerCard.innerHTML = `
                <div class="player-avatar">${getAvatarEmoji(player.avatarId)}</div>
                <div class="player-name">${player.name}</div>
                <button class="delete-player" data-id="${player.id}">×</button>
            `;
            
            // 点击玩家卡片选择/取消选择
            playerCard.addEventListener('click', (e) => {
                // 忽略删除按钮点击
                if (e.target.classList.contains('delete-player')) return;
                
                const playerId = player.id;
                
                if (playerCard.classList.contains('selected')) {
                    // 取消选择
                    playerCard.classList.remove('selected');
                    this.selectedPlayerIds = this.selectedPlayerIds.filter(id => id !== playerId);
                } else if (this.selectedPlayerIds.length < 4) {
                    // 选择
                    playerCard.classList.add('selected');
                    this.selectedPlayerIds.push(playerId);
                }
                
                // 更新选择计数和开始按钮状态
                this.updatePlayerSelection();
            });
            
            // 删除玩家事件
            const deleteBtn = playerCard.querySelector('.delete-player');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.confirmDeletePlayer(player);
            });
            
            container.appendChild(playerCard);
        });
        
        this.updatePlayerSelection();
    },
    
    /**
     * 更新玩家选择状态
     */
    updatePlayerSelection: function() {
        const countElement = document.getElementById('selected-count');
        const startGameBtn = document.getElementById('start-game-btn');
        
        countElement.textContent = this.selectedPlayerIds.length;
        startGameBtn.disabled = this.selectedPlayerIds.length !== 4;
    },
    
    /**
     * 确认删除玩家
     */
    confirmDeletePlayer: function(player) {
        document.getElementById('delete-player-name').textContent = player.name;
        
        // 绑定确认删除按钮事件
        const confirmBtn = document.getElementById('confirm-delete');
        
        // 移除旧事件监听
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        // 添加新事件监听
        newConfirmBtn.addEventListener('click', () => {
            PlayerManager.deletePlayer(player.id);
            closeModal('delete-confirm-modal');
            this.renderPlayerList();
        });
        
        // 绑定取消按钮事件
        document.getElementById('cancel-delete').addEventListener('click', () => {
            closeModal('delete-confirm-modal');
        });
        
        // 显示确认弹窗
        openModal('delete-confirm-modal');
    }
};

/**
 * 游戏UI控制器
 */
const GameUIController = {
    currentRoundScores: {},
    
    /**
     * 渲染游戏页面
     */
    renderGame: function() {
        if (!GameManager.currentGame) return;

        // 显示当前局数
        document.getElementById('round-count').textContent = GameManager.currentGame.rounds.length;
        document.getElementById('current-round-number').textContent = GameManager.currentGame.rounds.length + 1;
        
        // 渲染玩家栏
        this.renderPlayersBar();
        
        // 渲染输入区域
        this.renderScoreInputs();
        
        // 渲染历史记录
        this.renderRoundsHistory();
        
        // 绑定事件
        this.bindGameEvents();
    },
    
    /**
     * 渲染玩家栏
     */
    renderPlayersBar: function() {
        const container = document.getElementById('players-bar');
        container.innerHTML = '';
        
        GameManager.currentGame.playerIds.forEach(playerId => {
            const player = PlayerManager.getPlayer(playerId);
            if (!player) return;
            
            const playerElement = document.createElement('div');
            playerElement.className = 'player-item';
            playerElement.dataset.id = player.id;
            
            // 计算当前玩家总分
            const totalScore = this.calculatePlayerTotalScore(player.id);
            const scoreClass = totalScore > 0 ? 'positive' : (totalScore < 0 ? 'negative' : '');
            
            playerElement.innerHTML = `
                <div class="player-avatar">${getAvatarEmoji(player.avatarId)}</div>
                <div class="player-name">${player.name}</div>
                <div class="player-score ${scoreClass}">${formatScore(totalScore)}</div>
            `;
            
            container.appendChild(playerElement);
        });
    },
    
    /**
     * 渲染得分输入区域
     */
    renderScoreInputs: function() {
        const container = document.getElementById('score-inputs');
        container.innerHTML = '';
        
        // 重置当前回合分数
        this.currentRoundScores = {};
        
        GameManager.currentGame.playerIds.forEach(playerId => {
            const player = PlayerManager.getPlayer(playerId);
            if (!player) return;
            
            this.currentRoundScores[playerId] = 0;
            
            const inputGroup = document.createElement('div');
            inputGroup.className = 'score-input-group';
            
            inputGroup.innerHTML = `
                <div class="input-player-info">
                    <div class="player-avatar">${getAvatarEmoji(player.avatarId)}</div>
                    <div class="player-name">${player.name}</div>
                </div>
                <input type="number" class="score-input" data-id="${player.id}" placeholder="输入得分">
            `;
            
            container.appendChild(inputGroup);
        });
        
        // 绑定输入框事件
        document.querySelectorAll('.score-input').forEach(input => {
            input.addEventListener('input', () => {
                this.updateScoreInputs();
            });
        });
    },
    
    /**
     * 渲染历史记录
     */
    renderRoundsHistory: function() {
        const container = document.getElementById('rounds-history');
        container.innerHTML = '';
        
        if (!GameManager.currentGame.rounds.length) {
            container.innerHTML = '<div class="empty-state">暂无记录</div>';
            return;
        }
        
        // 逆序显示历史记录（最新的排在前面）
        const rounds = [...GameManager.currentGame.rounds].reverse();
        
        rounds.forEach((round, index) => {
            const roundNumber = GameManager.currentGame.rounds.length - index;
            
            const roundElement = document.createElement('div');
            roundElement.className = 'round-item';
            
            let roundContent = `<div class="round-title">第 ${roundNumber} 局</div>`;
            roundContent += '<div class="round-scores">';
            
            GameManager.currentGame.playerIds.forEach(playerId => {
                const player = PlayerManager.getPlayer(playerId);
                if (!player) return;
                
                const score = round.scores[playerId] || 0;
                const scoreClass = score > 0 ? 'positive' : (score < 0 ? 'negative' : '');
                
                roundContent += `
                    <div class="round-score-item">
                        <div class="player-name">${player.name}</div>
                        <div class="score ${scoreClass}">${formatScore(score)}</div>
                    </div>
                `;
            });
            
            roundContent += '</div>';
            roundElement.innerHTML = roundContent;
            
            container.appendChild(roundElement);
        });
    },
    
    /**
     * 更新得分输入
     */
    updateScoreInputs: function() {
        let total = 0;
        let hasInvalidInput = false;
        
        document.querySelectorAll('.score-input').forEach(input => {
            const playerId = input.dataset.id;
            const value = input.value.trim();
            
            // 如果为空则视为0
            if (!value) {
                this.currentRoundScores[playerId] = 0;
                return;
            }
            
            const score = parseInt(value);
            
            // 检查是否为有效数字
            if (isNaN(score)) {
                hasInvalidInput = true;
                return;
            }
            
            this.currentRoundScores[playerId] = score;
            total += score;
        });
        
        // 检查合计是否为0
        const checkBtn = document.getElementById('check-scores-btn');
        const confirmBtn = document.getElementById('confirm-round-btn');
        
        if (hasInvalidInput) {
            checkBtn.disabled = true;
            confirmBtn.disabled = true;
        } else {
            checkBtn.disabled = false;
            confirmBtn.disabled = (total !== 0);
            
            // 如果分数不平衡，在确认按钮上显示当前总和
            if (total !== 0) {
                confirmBtn.textContent = `分数不平衡 (${total})`;
            } else {
                confirmBtn.textContent = '确认本局';
            }
        }
    },
    
    /**
     * 计算玩家总得分
     */
    calculatePlayerTotalScore: function(playerId) {
        let total = 0;
        
        GameManager.currentGame.rounds.forEach(round => {
            total += (round.scores[playerId] || 0);
        });
        
        return total;
    },
    
    /**
     * 绑定游戏页面事件
     */
    bindGameEvents: function() {
        // 看看谁赢了按钮
        const checkBtn = document.getElementById('check-scores-btn');
        
        // 移除旧的事件监听器
        const newCheckBtn = checkBtn.cloneNode(true);
        checkBtn.parentNode.replaceChild(newCheckBtn, checkBtn);
        newCheckBtn.addEventListener('click', () => {
            this.showCurrentScores();
        });
        
        // 确认本局按钮
        const confirmBtn = document.getElementById('confirm-round-btn');
        
        // 移除旧的事件监听器
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        newConfirmBtn.addEventListener('click', () => {
            // 验证输入
            let total = 0;
            Object.values(this.currentRoundScores).forEach(score => {
                total += score;
            });
            
            if (total === 0) {
                // 添加回合
                GameManager.addRound(this.currentRoundScores);
                
                // 重新渲染游戏
                this.renderGame();
            }
        });
        
        // 结束游戏按钮
        const endGameBtn = document.getElementById('end-game-btn');
        
        // 移除旧的事件监听器
        const newEndGameBtn = endGameBtn.cloneNode(true);
        endGameBtn.parentNode.replaceChild(newEndGameBtn, endGameBtn);
        newEndGameBtn.addEventListener('click', () => {
            // 结束游戏
            if (GameManager.currentGame.rounds.length > 0) {
                GameManager.finishGame();
                this.showSettlement();
            } else {
                // 如果没有回合，直接取消游戏
                GameManager.clearCurrentGame();
                showPage('home-page');
            }
        });
        
        // 关闭当前得分弹窗按钮
        document.getElementById('close-scores-modal').addEventListener('click', () => {
            closeModal('current-scores-modal');
        });
        
        // 返回主页按钮（结算页面）
        document.getElementById('return-home-btn').addEventListener('click', () => {
            showPage('home-page');
        });
    },
    
    /**
     * 显示当前得分弹窗
     */
    showCurrentScores: function() {
        const container = document.getElementById('current-scores-list');
        container.innerHTML = '';
        
        // 将玩家按得分排序
        const playerScores = [];
        
        GameManager.currentGame.playerIds.forEach(playerId => {
            const player = PlayerManager.getPlayer(playerId);
            const score = this.calculatePlayerTotalScore(playerId) + (this.currentRoundScores[playerId] || 0);
            
            playerScores.push({
                player: player,
                score: score
            });
        });
        
        // 按分数从高到低排序
        playerScores.sort((a, b) => b.score - a.score);
        
        // 渲染排序后的玩家得分
        playerScores.forEach((item, index) => {
            const scoreElement = document.createElement('div');
            scoreElement.className = 'score-item';
            
            const rankClass = index === 0 ? 'rank-first' : 
                             (index === 1 ? 'rank-second' : 
                             (index === 2 ? 'rank-third' : 'rank-fourth'));
            
            const scoreClass = item.score > 0 ? 'positive' : (item.score < 0 ? 'negative' : '');
            
            scoreElement.innerHTML = `
                <div class="player-rank ${rankClass}">${index + 1}</div>
                <div class="player-info">
                    <div class="player-avatar">${getAvatarEmoji(item.player.avatarId)}</div>
                    <div class="player-name">${item.player.name}</div>
                </div>
                <div class="player-score ${scoreClass}">${formatScore(item.score)}</div>
            `;
            
            container.appendChild(scoreElement);
        });
        
        // 显示弹窗
        openModal('current-scores-modal');
    },
    
    /**
     * 显示结算页面
     */
    showSettlement: function() {
        // 计算最终得分
        const totals = GameManager.calculateGameTotals(GameManager.currentGame);
        
        // 设置结算信息
        document.getElementById('total-rounds').textContent = GameManager.currentGame.rounds.length;
        document.getElementById('game-date').textContent = formatDateTime(GameManager.currentGame.startDate);
        
        // 渲染最终得分
        const container = document.getElementById('final-scores');
        container.innerHTML = '';
        
        // 将玩家按得分排序
        const playerScores = [];
        
        Object.keys(totals).forEach(playerId => {
            const player = PlayerManager.getPlayer(playerId);
            const score = totals[playerId];
            
            if (player) {
                playerScores.push({
                    player: player,
                    score: score
                });
            }
        });
        
        // 按分数从高到低排序
        playerScores.sort((a, b) => b.score - a.score);
        
        // 渲染排序后的玩家得分
        playerScores.forEach((item, index) => {
            const scoreElement = document.createElement('div');
            scoreElement.className = 'final-score-item';
            
            const rankClass = index === 0 ? 'rank-first' : 
                             (index === 1 ? 'rank-second' : 
                             (index === 2 ? 'rank-third' : 'rank-fourth'));
            
            const scoreClass = item.score > 0 ? 'positive' : (item.score < 0 ? 'negative' : '');
            
            scoreElement.innerHTML = `
                <div class="player-rank ${rankClass}">${index + 1}</div>
                <div class="player-info">
                    <div class="player-avatar">${getAvatarEmoji(item.player.avatarId)}</div>
                    <div class="player-name">${item.player.name}</div>
                </div>
                <div class="player-score ${scoreClass}">${formatScore(item.score)}</div>
            `;
            
            container.appendChild(scoreElement);
        });
        
        // 显示结算页面
        showPage('settlement-page');
    }
};

/**
 * 历史记录UI控制器
 */
const HistoryUIController = {
    /**
     * 渲染历史记录
     */
    renderHistory: function() {
        const container = document.getElementById('history-list');
        container.innerHTML = '';
        
        const games = GameManager.getAllGames();
        
        // 判断是否有历史记录
        if (games.length === 0) {
            document.getElementById('no-history').style.display = 'block';
            return;
        }
        
        document.getElementById('no-history').style.display = 'none';
        
        // 将游戏按日期从新到旧排序
        const sortedGames = [...games].sort((a, b) => {
            return new Date(b.startDate) - new Date(a.startDate);
        });
        
        // 渲染每个游戏记录
        sortedGames.forEach(game => {
            const gameElement = document.createElement('div');
            gameElement.className = 'history-item';
            
            // 计算游戏总分
            const totals = GameManager.calculateGameTotals(game);
            
            // 获取玩家信息
            const playerInfos = [];
            game.playerIds.forEach(playerId => {
                const player = PlayerManager.getPlayer(playerId);
                if (player) {
                    playerInfos.push({
                        player: player,
                        score: totals[playerId] || 0
                    });
                }
            });
            
            // 按分数从高到低排序
            playerInfos.sort((a, b) => b.score - a.score);
            
            let playerListHTML = '';
            playerInfos.forEach(info => {
                const scoreClass = info.score > 0 ? 'positive' : (info.score < 0 ? 'negative' : '');
                
                playerListHTML += `
                    <div class="history-player-item">
                        <div class="player-info">
                            <div class="player-avatar">${getAvatarEmoji(info.player.avatarId)}</div>
                            <div class="player-name">${info.player.name}</div>
                        </div>
                        <div class="player-score ${scoreClass}">${formatScore(info.score)}</div>
                    </div>
                `;
            });
            
            gameElement.innerHTML = `
                <div class="history-item-header">
                    <div class="history-date">${formatDateTime(game.startDate)}</div>
                    <div class="history-rounds">${game.rounds.length} 局</div>
                </div>
                <div class="history-players">
                    ${playerListHTML}
                </div>
            `;
            
            container.appendChild(gameElement);
        });
        
        // 绑定返回按钮事件
        document.getElementById('back-from-history').addEventListener('click', () => {
            showPage('home-page');
        });
    }
};

/**
 * 统计UI控制器
 */
const StatsUIController = {
    /**
     * 渲染统计数据
     */
    renderStats: function() {
        const container = document.getElementById('stats-list');
        container.innerHTML = '';
        
        const players = PlayerManager.getAllPlayers();
        
        // 判断是否有玩家数据
        if (players.length === 0) {
            document.getElementById('no-stats').style.display = 'block';
            return;
        }
        
        document.getElementById('no-stats').style.display = 'none';
        
        // 计算玩家游戏次数
        const playerGameCounts = {};
        GameManager.getAllGames().forEach(game => {
            game.playerIds.forEach(playerId => {
                playerGameCounts[playerId] = (playerGameCounts[playerId] || 0) + 1;
            });
        });
        
        // 将玩家按总输赢从高到低排序
        const sortedPlayers = [...players].sort((a, b) => {
            return b.totalWinnings - a.totalWinnings;
        });
        
        // 渲染每个玩家的统计数据
        sortedPlayers.forEach((player, index) => {
            const playerElement = document.createElement('div');
            playerElement.className = 'stats-item';
            
            const rankClass = index === 0 ? 'rank-first' : 
                             (index === 1 ? 'rank-second' : 
                             (index === 2 ? 'rank-third' : ''));
            
            const scoreClass = player.totalWinnings > 0 ? 'positive' : (player.totalWinnings < 0 ? 'negative' : '');
            
            playerElement.innerHTML = `
                <div class="stats-item-header">
                    <div class="player-rank ${rankClass}">${index + 1}</div>
                    <div class="player-info">
                        <div class="player-avatar">${getAvatarEmoji(player.avatarId)}</div>
                        <div class="player-name">${player.name}</div>
                    </div>
                </div>
                <div class="stats-details">
                    <div class="stats-detail-item">
                        <div class="stats-label">总输赢:</div>
                        <div class="stats-value ${scoreClass}">${formatScore(player.totalWinnings)}</div>
                    </div>
                    <div class="stats-detail-item">
                        <div class="stats-label">游戏次数:</div>
                        <div class="stats-value">${playerGameCounts[player.id] || 0} 次</div>
                    </div>
                    <div class="stats-detail-item">
                        <div class="stats-label">加入时间:</div>
                        <div class="stats-value">${formatDateTime(player.createdAt)}</div>
                    </div>
                </div>
            `;
            
            container.appendChild(playerElement);
        });
        
        // 绑定返回按钮事件
        document.getElementById('back-from-stats').addEventListener('click', () => {
            showPage('home-page');
        });
    }
};

// 当页面加载完成时初始化应用
document.addEventListener('DOMContentLoaded', function() {
    AppController.init();
});