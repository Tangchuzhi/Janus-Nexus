

class SudokuGame {
    constructor() {
        this.gameId = 'sudoku_game_' + Date.now();
        this.grid = Array(9).fill().map(() => Array(9).fill(0));
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
        this.initialBoard = Array(9).fill().map(() => Array(9).fill(0));
        this.difficulty = 'easy'; // easy, medium, hard
        this.gameStarted = false;
        this.gameCompleted = false;
        this.startTime = null;
        this.timer = null;
        this.hintsLeft = 3;
        this.selectedCell = null;
        
        // 绑定方法
        this.saveGameState = this.saveGameState.bind(this);
        this.loadGameState = this.loadGameState.bind(this);
        this.init = this.init.bind(this);
    }

    /**
     * 使用酒馆原生变量系统保存游戏状态
     */
    async saveGameState() {
        try {
            const gameState = {
                grid: this.grid,
                solution: this.solution,
                initialBoard: this.initialBoard,
                difficulty: this.difficulty,
                gameStarted: this.gameStarted,
                gameCompleted: this.gameCompleted,
                hintsLeft: this.hintsLeft,
                startTime: this.startTime,
                timestamp: Date.now()
            };

            // 使用酒馆的chat级别变量存储
            if (typeof getVariables === 'function' && typeof replaceVariables === 'function') {
                const currentVars = getVariables({ type: 'chat' });
                currentVars[this.gameId] = gameState;
                await replaceVariables(currentVars, { type: 'chat' });
                console.log('数独游戏状态已保存到酒馆变量系统');
            } else {
                // 降级到localStorage
                localStorage.setItem(this.gameId, JSON.stringify(gameState));
                console.log('数独游戏状态已保存到本地存储');
            }
        } catch (error) {
            console.error('保存游戏状态失败:', error);
            // 降级到localStorage
            try {
                const gameState = {
                    grid: this.grid,
                    solution: this.solution,
                    initialBoard: this.initialBoard,
                    difficulty: this.difficulty,
                    gameStarted: this.gameStarted,
                    gameCompleted: this.gameCompleted,
                    hintsLeft: this.hintsLeft,
                    startTime: this.startTime,
                    timestamp: Date.now()
                };
                localStorage.setItem(this.gameId, JSON.stringify(gameState));
                console.log('数独游戏状态已保存到本地存储（降级）');
            } catch (localError) {
                console.error('本地存储也失败了:', localError);
            }
        }
    }

    /**
     * 使用酒馆原生变量系统加载游戏状态
     */
    async loadGameState() {
        try {
            let gameState = null;

            // 首先尝试从酒馆变量系统加载
            if (typeof getVariables === 'function') {
                const currentVars = getVariables({ type: 'chat' });
                gameState = currentVars[this.gameId];
                console.log('从酒馆变量系统加载游戏状态');
            }

            // 如果酒馆变量系统中没有，尝试从localStorage加载
            if (!gameState) {
                const savedState = localStorage.getItem(this.gameId);
                if (savedState) {
                    gameState = JSON.parse(savedState);
                    console.log('从本地存储加载游戏状态');
                }
            }

            if (gameState) {
                this.grid = gameState.grid || gameState.board || Array(9).fill().map(() => Array(9).fill(0));
                this.solution = gameState.solution || Array(9).fill().map(() => Array(9).fill(0));
                this.initialBoard = gameState.initialBoard || Array(9).fill().map(() => Array(9).fill(0));
                this.difficulty = gameState.difficulty || 'easy';
                this.gameStarted = gameState.gameStarted || false;
                this.gameCompleted = gameState.gameCompleted || false;
                this.hintsLeft = gameState.hintsLeft || 3;
                this.startTime = gameState.startTime || null;
                
                console.log('游戏状态加载成功');
                return true;
            }
        } catch (error) {
            console.error('加载游戏状态失败:', error);
        }
        return false;
    }

    /**
     * 生成完整的数独解答
     */
    generateSolution() {
        // 清空解答板
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
        
        // 使用回溯算法生成完整的数独解答
        this.solveSudoku(this.solution);
    }

    /**
     * 回溯算法求解数独
     */
    solveSudoku(board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    // 随机排列数字1-9来增加随机性
                    const numbers = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                    
                    for (let num of numbers) {
                        if (this.isValidMove(board, row, col, num)) {
                            board[row][col] = num;
                            
                            if (this.solveSudoku(board)) {
                                return true;
                            }
                            
                            board[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * 检查移动是否有效
     */
    isValidMove(board, row, col, num) {
        // 检查行
        for (let j = 0; j < 9; j++) {
            if (board[row][j] === num) return false;
        }
        
        // 检查列
        for (let i = 0; i < 9; i++) {
            if (board[i][col] === num) return false;
        }
        
        // 检查3x3宫格
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        
        for (let i = boxRow; i < boxRow + 3; i++) {
            for (let j = boxCol; j < boxCol + 3; j++) {
                if (board[i][j] === num) return false;
            }
        }
        
        return true;
    }

    /**
     * 打乱数组
     */
    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    /**
     * 根据难度生成题目
     */
    generatePuzzle(difficulty = 'easy') {
        this.generateSolution();
        this.grid = this.solution.map(row => [...row]);
        
        // 根据难度设置参数
        const difficultySettings = {
            easy: { targetClues: 45, minClues: 42 },
            medium: { targetClues: 35, minClues: 30 },
            hard: { targetClues: 28, minClues: 25 }
        };

        const settings = difficultySettings[difficulty] || difficultySettings.easy;

        // 使用对称移除策略
        const removalPattern = this.getSymmetricRemovalPattern();
        let cluesCount = 81;

        // 逐步移除数字
        for (const positions of removalPattern) {
            if (cluesCount <= settings.targetClues) break;

            const originalValues = [];
            for (const pos of positions) {
                originalValues.push(this.grid[pos.row][pos.col]);
            }

            // 尝试移除
            for (const pos of positions) {
                this.grid[pos.row][pos.col] = 0;
            }

            // 检查有效性
            if (cluesCount - positions.length >= settings.minClues && this.isValidPuzzle(this.grid)) {
                cluesCount -= positions.length;
            } else {
                // 恢复数字
                for (let i = 0; i < positions.length; i++) {
                    this.grid[positions[i].row][positions[i].col] = originalValues[i];
                }
            }
        }
        
        // 保存初始状态
        this.initialBoard = this.grid.map(row => [...row]);
        this.difficulty = difficulty;
        this.gameStarted = true;
        this.gameCompleted = false;
    }

    /**
     * 生成对称的移除模式
     */
    getSymmetricRemovalPattern() {
        const patterns = [];
        const center = { row: 4, col: 4 };
        const used = new Set();

        // 添加中心点
        patterns.push([center]);
        used.add(`${center.row},${center.col}`);

        // 生成对称位置对
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const key = `${row},${col}`;
                if (used.has(key)) continue;

                const symmetric = { row: 8 - row, col: 8 - col };
                const symmetricKey = `${symmetric.row},${symmetric.col}`;

                if (!used.has(symmetricKey)) {
                    patterns.push([{ row, col }, symmetric]);
                    used.add(key);
                    used.add(symmetricKey);
                }
            }
        }

        // 随机打乱模式顺序
        return this.shuffleArray(patterns);
    }

    /**
     * 简化的数独有效性检查
     */
    isValidPuzzle(puzzle) {
        // 检查每行、每列、每个3x3块是否至少有一些给定数字
        for (let i = 0; i < 9; i++) {
            let rowClues = 0, colClues = 0;
            for (let j = 0; j < 9; j++) {
                if (puzzle[i][j] !== 0) rowClues++;
                if (puzzle[j][i] !== 0) colClues++;
            }
            if (rowClues < 2 || colClues < 2) return false;
        }

        // 检查每个3x3块至少有一些给定数字
        for (let boxRow = 0; boxRow < 3; boxRow++) {
            for (let boxCol = 0; boxCol < 3; boxCol++) {
                let boxClues = 0;
                for (let i = boxRow * 3; i < boxRow * 3 + 3; i++) {
                    for (let j = boxCol * 3; j < boxCol * 3 + 3; j++) {
                        if (puzzle[i][j] !== 0) boxClues++;
                    }
                }
                if (boxClues < 2) return false;
            }
        }

        return true;
    }

    /**
     * 检查游戏是否完成
     */
    checkGameCompletion() {
        // 获取当前网格状态（包括用户输入）
        const currentGrid = this.getCurrentGridState();
        
        // 检查是否所有格子都填满
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (currentGrid[i][j] === 0) return false;
            }
        }
        
        // 检查是否符合数独规则
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const num = currentGrid[i][j];
                currentGrid[i][j] = 0; // 临时清空以检查
                if (!this.isValidMove(currentGrid, i, j, num)) {
                    currentGrid[i][j] = num; // 恢复
                    return false;
                }
                currentGrid[i][j] = num; // 恢复
            }
        }
        
        this.gameCompleted = true;
        return true;
    }

    /**
     * 获取当前网格状态
     */
    getCurrentGridState() {
        const grid = Array(9).fill().map(() => Array(9).fill(0));
        
        // 从DOM获取当前状态
        const cells = document.querySelectorAll('.sudoku-cell');
        cells.forEach((cell, index) => {
            const row = Math.floor(index / 9);
            const col = index % 9;
            const value = cell.value;
            
            if (cell.classList.contains('sudoku-cell-given')) {
                grid[row][col] = this.grid[row][col]; // 预设数字
            } else if (value) {
                grid[row][col] = parseInt(value); // 用户输入
            }
        });
        
        return grid;
    }

    /**
     * 设置格子的值
     */
    setCellValue(row, col, value) {
        if (this.initialBoard[row][col] !== 0) {
            // 不能修改初始题目的数字
            return false;
        }
        
        if (value < 0 || value > 9) {
            return false;
        }
        
        this.grid[row][col] = value;
        
        // 检查游戏是否完成
        if (this.checkGameCompletion()) {
            this.gameCompleted = true;
            this.showCompletionMessage();
        }
        
        // 自动保存游戏状态
        this.saveGameState();
        
        return true;
    }

    /**
     * 开始计时器
     */
    startTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }

        this.startTime = Date.now();

        this.timer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');
            
            const timeElement = document.getElementById('sudoku-time');
            if (timeElement) {
                timeElement.textContent = `${minutes}:${seconds}`;
            }
        }, 1000);
    }

    /**
     * 停止计时器
     */
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    /**
     * 显示完成消息
     */
    showCompletionMessage() {
        this.stopTimer();
        const timeText = document.getElementById('sudoku-time')?.textContent || '00:00';
        const difficultyText = document.getElementById('sudoku-difficulty-text')?.textContent || '简单';
        
        // 检测深色模式
        const isDarkMode = document.body.classList.contains('dark-mode') || 
                          document.documentElement.classList.contains('dark-mode');
        
        const winHTML = `
            <div id="sudoku-win-dialog" class="${isDarkMode ? 'dark-mode' : ''}" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10002;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <div style="
                    background: linear-gradient(135deg, rgba(46, 204, 113, 0.95), rgba(39, 174, 96, 0.95));
                    color: white;
                    padding: 30px;
                    border-radius: 16px;
                    text-align: center;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    max-width: 400px;
                    margin: 20px;
                ">
                    <h2 style="margin: 0 0 20px 0; font-size: 24px;">🎉 恭喜完成！</h2>
                    <p style="margin: 10px 0; font-size: 16px;">用时：${timeText}</p>
                    <p style="margin: 10px 0; font-size: 16px;">难度：${difficultyText}</p>
                    <button onclick="document.getElementById('sudoku-win-dialog').remove(); window.sudokuGame.startNewGame();" style="
                        background: rgba(255, 255, 255, 0.2);
                        color: white;
                        border: 1px solid rgba(255, 255, 255, 0.3);
                        padding: 10px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        margin: 10px 5px;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                        再来一局
                    </button>
                    <button onclick="document.getElementById('sudoku-win-dialog').remove();" style="
                        background: rgba(255, 255, 255, 0.2);
                        color: white;
                        border: 1px solid rgba(255, 255, 255, 0.3);
                        padding: 10px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        margin: 10px 5px;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                        继续欣赏
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', winHTML);
    }

    /**
     * 渲染游戏界面（弹窗模式）
     */
    renderGame() {
        // 检测深色模式
        const isDarkMode = document.body.classList.contains('dark-mode') || 
                          document.documentElement.classList.contains('dark-mode');
        
        const gameHTML = `
            <div id="sudoku-game-popup" class="sudoku-game-overlay ${isDarkMode ? 'dark-mode' : ''}">
                <div class="sudoku-game-container">
                    <div class="sudoku-game-header">
                        <h3 class="sudoku-game-title">🧩 数独游戏</h3>
                        <button class="sudoku-game-close">✕</button>
                    </div>
                    <div class="sudoku-game-content">
                        <div class="sudoku-controls">
                            <button class="sudoku-control-btn" id="sudoku-new-game">新游戏</button>
                            <select class="sudoku-difficulty-select" id="sudoku-difficulty">
                                <option value="easy" ${this.difficulty === 'easy' ? 'selected' : ''}>简单</option>
                                <option value="medium" ${this.difficulty === 'medium' ? 'selected' : ''}>中等</option>
                                <option value="hard" ${this.difficulty === 'hard' ? 'selected' : ''}>困难</option>
                            </select>
                            <button class="sudoku-control-btn" id="sudoku-hint">提示</button>
                            <button class="sudoku-control-btn" id="sudoku-check">提交</button>
                        </div>
                        
                        <div class="sudoku-grid-container">
                            <div class="sudoku-grid" id="sudoku-grid">
                                <!-- 9x9网格将通过JavaScript生成 -->
                            </div>
                        </div>
                        
                        <div class="sudoku-info">
                            <div class="sudoku-info-item">
                                <span>⏱️</span>
                                <span id="sudoku-time">00:00</span>
                            </div>
                            <div class="sudoku-info-item">
                                <span>💡</span>
                                <span id="sudoku-hints">${this.hintsLeft}</span>
                            </div>
                            <div class="sudoku-info-item">
                                <span>🎯</span>
                                <span id="sudoku-difficulty-text">${this.getDifficultyText()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        return gameHTML;
    }

    /**
     * 获取难度文本
     */
    getDifficultyText() {
        const difficultyMap = {
            'easy': '简单',
            'medium': '中等', 
            'hard': '困难'
        };
        return difficultyMap[this.difficulty] || '简单';
    }

    /**
     * 渲染数独棋盘
     */
    renderBoard() {
        const grid = document.getElementById('sudoku-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        for (let i = 0; i < 81; i++) {
            const row = Math.floor(i / 9);
            const col = i % 9;
            const value = this.grid[row][col];
            const isInitial = this.initialBoard[row][col] !== 0;
            
            const cell = document.createElement('input');
            cell.type = 'text';
            cell.maxLength = 1;
            cell.className = 'sudoku-cell';
            cell.setAttribute('data-index', i);
            cell.setAttribute('data-row', row);
            cell.setAttribute('data-col', col);
            
            if (value !== 0) {
                cell.value = value;
                if (isInitial) {
                    cell.classList.add('sudoku-cell-given');
                    cell.readOnly = true;
                } else {
                    cell.classList.add('sudoku-cell-user');
                }
            }
            
            // 绑定事件
            cell.addEventListener('input', (e) => this.handleSudokuInput(e));
            cell.addEventListener('focus', (e) => this.handleSudokuFocus(e));
            cell.addEventListener('keydown', (e) => this.handleSudokuKeydown(e));
            
            grid.appendChild(cell);
        }
    }

    /**
     * 开始新游戏
     */
    startNewGame() {
        // 重置游戏状态
        this.hintsLeft = 3;
        this.selectedCell = null;
        this.gameCompleted = false;
        
        // 更新提示计数显示
        const hintsElement = document.getElementById('sudoku-hints');
        if (hintsElement) {
            hintsElement.textContent = this.hintsLeft;
        }
        
        // 生成新的数独谜题
        this.generatePuzzle(this.difficulty);
        
        // 更新界面
        this.renderBoard();
        
        // 开始计时
        this.startTimer();
        
        // 移除完成消息
        const completionMessage = document.querySelector('.completion-message');
        if (completionMessage) {
            completionMessage.remove();
        }
    }

    /**
     * 处理数独输入
     */
    handleSudokuInput(e) {
        const cell = e.target;
        const value = cell.value;
        const index = parseInt(cell.getAttribute('data-index'));
        const row = Math.floor(index / 9);
        const col = index % 9;

        // 只允许数字1-9
        if (value && !/^[1-9]$/.test(value)) {
            cell.value = '';
            return;
        }

        // 清除错误样式
        cell.classList.remove('sudoku-cell-error');

        if (value) {
            const num = parseInt(value);
            const currentGrid = this.getCurrentGridState();

            // 检查是否违反数独规则
            if (this.isValidMove(currentGrid, row, col, num)) {
                cell.classList.add('sudoku-cell-user');

                // 提供智能提示：如果这个数字在当前位置是正确的
                if (this.solution[row][col] === num) {
                    cell.classList.add('sudoku-cell-correct');
                    setTimeout(() => {
                        cell.classList.remove('sudoku-cell-correct');
                    }, 1000);
                }

                // 检查是否完成游戏
                if (this.checkGameCompletion()) {
                    setTimeout(() => {
                        this.showCompletionMessage();
                    }, 500);
                }
            } else {
                // 违反数独规则，显示错误
                cell.classList.add('sudoku-cell-error');
                setTimeout(() => {
                    cell.classList.remove('sudoku-cell-error');
                }, 1500);

                // 给用户友好的提示
                this.showValidationHint(row, col, num);
            }
        } else {
            cell.classList.remove('sudoku-cell-user');
        }
    }

    /**
     * 处理数独焦点
     */
    handleSudokuFocus(e) {
        this.selectedCell = e.target;
    }

    /**
     * 处理键盘输入
     */
    handleSudokuKeydown(e) {
        const cell = e.target;

        // 删除键清空单元格
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (!cell.classList.contains('sudoku-cell-given')) {
                cell.value = '';
                cell.classList.remove('sudoku-cell-user', 'sudoku-cell-error');
            }
        }

        // 方向键移动
        const index = parseInt(cell.getAttribute('data-index'));
        let newIndex = index;

        switch (e.key) {
            case 'ArrowUp':
                if (index >= 9) newIndex = index - 9;
                break;
            case 'ArrowDown':
                if (index < 72) newIndex = index + 9;
                break;
            case 'ArrowLeft':
                if (index % 9 !== 0) newIndex = index - 1;
                break;
            case 'ArrowRight':
                if (index % 9 !== 8) newIndex = index + 1;
                break;
        }

        if (newIndex !== index) {
            e.preventDefault();
            const newCell = document.querySelector(`.sudoku-cell[data-index="${newIndex}"]`);
            if (newCell) {
                newCell.focus();
            }
        }
    }

    /**
     * 显示验证提示
     */
    showValidationHint(row, col, num) {
        const currentGrid = this.getCurrentGridState();
        let conflictType = '';

        // 检查行冲突
        for (let j = 0; j < 9; j++) {
            if (j !== col && currentGrid[row][j] === num) {
                conflictType = `数字${num}在第${row + 1}行已存在`;
                break;
            }
        }

        // 检查列冲突
        if (!conflictType) {
            for (let i = 0; i < 9; i++) {
                if (i !== row && currentGrid[i][col] === num) {
                    conflictType = `数字${num}在第${col + 1}列已存在`;
                    break;
                }
            }
        }

        // 检查3x3块冲突
        if (!conflictType) {
            const boxRow = Math.floor(row / 3) * 3;
            const boxCol = Math.floor(col / 3) * 3;

            for (let i = boxRow; i < boxRow + 3; i++) {
                for (let j = boxCol; j < boxCol + 3; j++) {
                    if ((i !== row || j !== col) && currentGrid[i][j] === num) {
                        conflictType = `数字${num}在3×3方块内已存在`;
                        break;
                    }
                }
                if (conflictType) break;
            }
        }

        if (conflictType && typeof toastr !== 'undefined') {
            toastr.warning(conflictType, '数独规则冲突', {
                timeOut: 2000,
                positionClass: 'toast-top-center',
            });
        }
    }

    /**
     * 处理格子点击事件
     */
    onCellClick(row, col) {
        if (this.initialBoard[row][col] !== 0) {
            return; // 不能修改初始数字
        }
        
        const cell = document.getElementById(`cell-${row}-${col}`);
        if (cell) {
            cell.focus();
        }
    }

    /**
     * 处理格子键盘事件
     */
    onCellKeyDown(event, row, col) {
        if (this.initialBoard[row][col] !== 0) {
            event.preventDefault();
            return;
        }
        
        const key = event.key;
        
        if (key >= '1' && key <= '9') {
            event.preventDefault();
            const num = parseInt(key);
            this.setCellValue(row, col, num);
            this.updateCellDisplay(row, col);
        } else if (key === 'Delete' || key === 'Backspace' || key === '0') {
            event.preventDefault();
            this.setCellValue(row, col, 0);
            this.updateCellDisplay(row, col);
        } else if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
            event.preventDefault();
            this.handleArrowKey(key, row, col);
        } else {
            event.preventDefault();
        }
    }

    /**
     * 处理方向键导航
     */
    handleArrowKey(key, row, col) {
        let newRow = row;
        let newCol = col;
        
        switch (key) {
            case 'ArrowUp':
                newRow = Math.max(0, row - 1);
                break;
            case 'ArrowDown':
                newRow = Math.min(8, row + 1);
                break;
            case 'ArrowLeft':
                newCol = Math.max(0, col - 1);
                break;
            case 'ArrowRight':
                newCol = Math.min(8, col + 1);
                break;
        }
        
        const newCell = document.getElementById(`cell-${newRow}-${newCol}`);
        if (newCell) {
            newCell.focus();
        }
    }

    /**
     * 处理格子失去焦点事件
     */
    onCellBlur(row, col) {
        const cell = document.getElementById(`cell-${row}-${col}`);
        if (cell && this.initialBoard[row][col] === 0) {
            const value = cell.textContent.trim();
            if (value === '') {
                this.setCellValue(row, col, 0);
            } else {
                const num = parseInt(value);
                if (!isNaN(num) && num >= 1 && num <= 9) {
                    this.setCellValue(row, col, num);
                } else {
                    this.setCellValue(row, col, 0);
                }
            }
            this.updateCellDisplay(row, col);
        }
    }

    /**
     * 更新格子显示
     */
    updateCellDisplay(row, col) {
        const cell = document.getElementById(`cell-${row}-${col}`);
        if (cell) {
            const value = this.board[row][col];
            cell.textContent = value === 0 ? '' : value;
            
            // 更新样式
            const isError = this.hasError(row, col);
            if (isError) {
                cell.style.background = '#ffebee';
                cell.style.color = '#d32f2f';
            } else {
                cell.style.background = 'white';
                cell.style.color = '#333';
            }
        }
    }

    /**
     * 提供提示
     */
    giveHint() {
        if (this.hintsLeft <= 0) {
            if (typeof toastr !== 'undefined') {
                toastr.warning('没有剩余提示了！');
            } else {
                alert('没有剩余提示了！');
            }
            return;
        }

        // 找到所有空的单元格
        const emptyCells = [];
        const cells = document.querySelectorAll('.sudoku-cell');
        cells.forEach((cell, index) => {
            if (!cell.classList.contains('sudoku-cell-given') && !cell.value) {
                emptyCells.push({
                    index: index,
                    element: cell,
                });
            }
        });

        if (emptyCells.length === 0) {
            if (typeof toastr !== 'undefined') {
                toastr.info('没有需要提示的位置了！');
            } else {
                alert('没有需要提示的位置了！');
            }
            return;
        }

        // 随机选择一个空单元格并填入正确答案
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const row = Math.floor(randomCell.index / 9);
        const col = randomCell.index % 9;
        const correctValue = this.solution[row][col];

        randomCell.element.value = correctValue;
        randomCell.element.classList.add('sudoku-cell-user');

        this.hintsLeft--;
        const hintsElement = document.getElementById('sudoku-hints');
        if (hintsElement) {
            hintsElement.textContent = this.hintsLeft;
        }

        // 检查是否完成
        if (this.checkGameCompletion()) {
            setTimeout(() => {
                this.showCompletionMessage();
            }, 500);
        }
    }

    /**
     * 检查当前解答
     */
    checkSudokuSolution() {
        let hasErrors = false;
        let hasEmpty = false;

        const cells = document.querySelectorAll('.sudoku-cell');
        cells.forEach((cell, index) => {
            const value = cell.value;
            const row = Math.floor(index / 9);
            const col = index % 9;

            cell.classList.remove('sudoku-cell-error');

            if (!value) {
                hasEmpty = true;
                return;
            }

            const num = parseInt(value);
            const correctValue = this.solution[row][col];

            if (num !== correctValue) {
                cell.classList.add('sudoku-cell-error');
                hasErrors = true;
            }
        });

        if (hasEmpty) {
            if (typeof toastr !== 'undefined') {
                toastr.info('还有空格需要填写！');
            } else {
                alert('还有空格需要填写！');
            }
        } else if (hasErrors) {
            if (typeof toastr !== 'undefined') {
                toastr.error('发现错误，请检查红色标记的位置！');
            } else {
                alert('发现错误，请检查红色标记的位置！');
            }
            setTimeout(() => {
                document.querySelectorAll('.sudoku-cell-error').forEach(cell => {
                    cell.classList.remove('sudoku-cell-error');
                });
            }, 3000);
        } else {
            if (typeof toastr !== 'undefined') {
                toastr.success('答案正确！恭喜完成！');
            } else {
                alert('答案正确！恭喜完成！');
            }
        }
    }

    /**
     * 刷新整个棋盘显示
     */
    refreshBoard() {
        const boardContainer = document.getElementById('sudoku-board');
        if (boardContainer) {
            boardContainer.innerHTML = this.renderBoard();
        }
    }

    /**
     * 初始化游戏
     */
    async init() {
        // 先关闭可能存在的游戏弹窗和所有相关元素
        const existingPopup = document.getElementById('sudoku-game-popup');
        if (existingPopup) {
            existingPopup.remove();
        }
        
        // 清理完成消息弹窗
        const winDialog = document.getElementById('sudoku-win-dialog');
        if (winDialog) {
            winDialog.remove();
        }
        
        // 清理任何可能残留的数独相关弹窗
        const existingPopups = document.querySelectorAll('[id*="sudoku"]');
        existingPopups.forEach(popup => {
            if (popup.id.includes('sudoku')) {
                popup.remove();
            }
        });

        // 添加数独游戏专用样式
        if (!document.getElementById('sudoku-game-styles')) {
            const styleElement = document.createElement('style');
            styleElement.id = 'sudoku-game-styles';
            styleElement.textContent = this.getSudokuStyles();
            document.head.appendChild(styleElement);
        }

        // 渲染游戏界面
        const gameHTML = this.renderGame();
        document.body.insertAdjacentHTML('beforeend', gameHTML);
        
        // 绑定事件监听器
        this.setupEventListeners();

        // 尝试加载已保存的游戏
        const loaded = await this.loadGameState();
        
        if (!loaded || !this.gameStarted) {
            // 如果没有保存的游戏，开始新游戏
            this.startNewGame();
        } else {
            // 加载已保存的游戏
            this.renderBoard();
            if (this.startTime) {
                this.startTimer();
            }
        }
        
        return true;
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 绑定关闭按钮点击事件
        const closeBtn = document.querySelector('.sudoku-game-close');
        if (closeBtn) {
            closeBtn.onclick = () => {
                this.closeGame();
            };
        }

        // 绑定ESC键关闭
        const keydownHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeGame();
            }
        };
        document.addEventListener('keydown', keydownHandler);

        // 点击遮罩层关闭弹窗
        const overlay = document.querySelector('.sudoku-game-overlay');
        if (overlay) {
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    this.closeGame();
                }
            };
        }

        // 绑定控制按钮事件
        const newGameBtn = document.getElementById('sudoku-new-game');
        const hintBtn = document.getElementById('sudoku-hint');
        const checkBtn = document.getElementById('sudoku-check');
        const difficultySelect = document.getElementById('sudoku-difficulty');
        
        if (newGameBtn) {
            newGameBtn.onclick = () => {
                this.startNewGame();
            };
        }
        
        if (hintBtn) {
            hintBtn.onclick = () => {
                this.giveHint();
            };
        }

        if (checkBtn) {
            checkBtn.onclick = () => {
                this.checkSudokuSolution();
            };
        }
        
        if (difficultySelect) {
            difficultySelect.onchange = (e) => {
                this.difficulty = e.target.value;
                const difficultyText = document.getElementById('sudoku-difficulty-text');
                if (difficultyText) {
                    difficultyText.textContent = this.getDifficultyText();
                }
            };
        }

        // 保存事件处理器引用以便清理
        this.keydownHandler = keydownHandler;
    }

    /**
     * 关闭游戏
     */
    closeGame() {
        // 停止计时器
        this.stopTimer();

        // 解绑事件监听器
        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler);
        }

        // 移除所有数独相关的弹窗和元素
        const popup = document.getElementById('sudoku-game-popup');
        if (popup) {
            popup.remove();
        }
        
        // 移除完成消息弹窗
        const winDialog = document.getElementById('sudoku-win-dialog');
        if (winDialog) {
            winDialog.remove();
        }
        
        // 移除样式
        const styles = document.getElementById('sudoku-game-styles');
        if (styles) {
            styles.remove();
        }
        
        // 清理任何可能残留的弹窗
        const existingPopups = document.querySelectorAll('[id*="sudoku"]');
        existingPopups.forEach(popup => {
            if (popup.id.includes('sudoku')) {
                popup.remove();
            }
        });
    }

    /**
     * 获取数独游戏样式
     */
    getSudokuStyles() {
        return `
            /* 数独游戏弹窗样式 */
            .sudoku-game-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10001;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                padding: 20px;
            }

            .sudoku-game-container {
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 249, 250, 0.95));
                backdrop-filter: blur(20px);
                color: #2c3e50;
                padding: 0;
                border-radius: 16px;
                width: 90%;
                max-width: 600px;
                min-width: 320px;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
                border: 1px solid rgba(255, 255, 255, 0.3);
                overflow: hidden;
                display: flex;
                flex-direction: column;
                position: relative;
                margin: auto;
                max-height: 90vh;
                transition: all 0.3s ease;
            }

            /* 夜间模式数独弹窗 */
            .dark-mode .sudoku-game-container {
                background: linear-gradient(135deg, rgba(30, 30, 30, 0.95), rgba(45, 45, 45, 0.95));
                color: #ffffff;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .sudoku-game-header {
                background: linear-gradient(135deg, rgba(52, 152, 219, 0.9), rgba(41, 128, 185, 0.9));
                backdrop-filter: blur(10px);
                padding: 20px 24px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                align-items: center;
                justify-content: space-between;
                transition: all 0.3s ease;
            }

            .sudoku-game-title {
                color: white;
                font-size: 20px;
                font-weight: 700;
                margin: 0;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }

            .sudoku-game-close {
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                cursor: pointer;
                border-radius: 8px;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
            }

            .sudoku-game-close:hover {
                background: rgba(231, 76, 60, 0.9);
                border-color: #e74c3c;
                color: white;
                transform: scale(1.1);
            }

            .sudoku-game-content {
                padding: 20px;
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                min-height: 300px;
            }

            /* 数独游戏控制面板 */
            .sudoku-controls {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
                flex-wrap: wrap;
                justify-content: center;
            }

            .sudoku-control-btn {
                background: linear-gradient(135deg, rgba(52, 152, 219, 0.9), rgba(41, 128, 185, 0.9));
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
                box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
            }

            .sudoku-control-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
            }

            .dark-mode .sudoku-control-btn {
                background: linear-gradient(135deg, rgba(65, 65, 65, 0.9), rgba(45, 45, 45, 0.9));
                color: #ffffff;
            }

            /* 难度选择下拉框 */
            .sudoku-difficulty-select {
                background: rgba(255, 255, 255, 0.9);
                border: 2px solid rgba(52, 152, 219, 0.3);
                border-radius: 8px;
                padding: 8px 12px;
                font-size: 14px;
                color: #2c3e50;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .sudoku-difficulty-select:focus {
                outline: none;
                border-color: rgba(52, 152, 219, 0.6);
                box-shadow: 0 0 10px rgba(52, 152, 219, 0.3);
            }

            .dark-mode .sudoku-difficulty-select {
                background: rgba(45, 45, 45, 0.9);
                color: #ffffff;
                border-color: rgba(85, 85, 85, 0.8);
            }

            /* 数独网格容器 */
            .sudoku-grid-container {
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 249, 250, 0.95));
                border-radius: 12px;
                padding: 15px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                border: 2px solid rgba(52, 152, 219, 0.2);
                margin-bottom: 20px;
            }

            .dark-mode .sudoku-grid-container {
                background: linear-gradient(135deg, rgba(35, 35, 35, 0.95), rgba(45, 45, 45, 0.95));
                border-color: rgba(85, 85, 85, 0.6);
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            }

            /* 数独网格 */
            .sudoku-grid {
                display: grid;
                grid-template-columns: repeat(9, 1fr);
                grid-template-rows: repeat(9, 1fr);
                gap: 1px;
                width: 360px;
                height: 360px;
                background: #34495e;
                border: 3px solid #34495e;
                border-radius: 8px;
                overflow: hidden;
                box-sizing: border-box;
                aspect-ratio: 1;
            }

            .dark-mode .sudoku-grid {
                background: #2c3e50;
                border-color: #2c3e50;
            }

            /* 数独单元格 */
            .sudoku-cell {
                background: #ffffff;
                border: none;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                font-weight: bold;
                color: #2c3e50;
                cursor: pointer;
                transition: all 0.2s ease;
                outline: none;
                text-align: center;
                box-sizing: border-box;
                width: 100%;
                height: 100%;
                aspect-ratio: 1;
            }

            .sudoku-cell:focus {
                background: rgba(52, 152, 219, 0.2);
                box-shadow: inset 0 0 0 2px rgba(52, 152, 219, 0.5);
            }

            .sudoku-cell:hover:not(.sudoku-cell-given) {
                background: rgba(52, 152, 219, 0.1);
            }

            /* 3x3块的边界 - 右边界（第3、6列） */
            .sudoku-cell:nth-child(3), .sudoku-cell:nth-child(6),
            .sudoku-cell:nth-child(12), .sudoku-cell:nth-child(15),
            .sudoku-cell:nth-child(21), .sudoku-cell:nth-child(24),
            .sudoku-cell:nth-child(30), .sudoku-cell:nth-child(33),
            .sudoku-cell:nth-child(39), .sudoku-cell:nth-child(42),
            .sudoku-cell:nth-child(48), .sudoku-cell:nth-child(51),
            .sudoku-cell:nth-child(57), .sudoku-cell:nth-child(60),
            .sudoku-cell:nth-child(66), .sudoku-cell:nth-child(69),
            .sudoku-cell:nth-child(75), .sudoku-cell:nth-child(78) {
                border-right: 3px solid #34495e;
            }

            /* 3x3块的边界 - 下边界（第3、6行） */
            .sudoku-cell:nth-child(n+19):nth-child(-n+27),
            .sudoku-cell:nth-child(n+46):nth-child(-n+54) {
                border-bottom: 3px solid #34495e;
            }

            /* 夜间模式下的3x3块边界 */
            .dark-mode .sudoku-cell:nth-child(3), .dark-mode .sudoku-cell:nth-child(6),
            .dark-mode .sudoku-cell:nth-child(12), .dark-mode .sudoku-cell:nth-child(15),
            .dark-mode .sudoku-cell:nth-child(21), .dark-mode .sudoku-cell:nth-child(24),
            .dark-mode .sudoku-cell:nth-child(30), .dark-mode .sudoku-cell:nth-child(33),
            .dark-mode .sudoku-cell:nth-child(39), .dark-mode .sudoku-cell:nth-child(42),
            .dark-mode .sudoku-cell:nth-child(48), .dark-mode .sudoku-cell:nth-child(51),
            .dark-mode .sudoku-cell:nth-child(57), .dark-mode .sudoku-cell:nth-child(60),
            .dark-mode .sudoku-cell:nth-child(66), .dark-mode .sudoku-cell:nth-child(69),
            .dark-mode .sudoku-cell:nth-child(75), .dark-mode .sudoku-cell:nth-child(78) {
                border-right: 3px solid #2c3e50;
            }

            .dark-mode .sudoku-cell:nth-child(n+19):nth-child(-n+27),
            .dark-mode .sudoku-cell:nth-child(n+46):nth-child(-n+54) {
                border-bottom: 3px solid #2c3e50;
            }

            /* 预设数字样式 */
            .sudoku-cell-given {
                background: linear-gradient(135deg, rgba(52, 152, 219, 0.1), rgba(52, 152, 219, 0.05));
                color: #2c3e50;
                font-weight: 900;
                cursor: default;
            }

            /* 用户输入数字样式 */
            .sudoku-cell-user {
                color: rgba(52, 152, 219, 0.9);
                font-weight: 700;
            }

            /* 错误高亮 */
            .sudoku-cell-error {
                background: rgba(231, 76, 60, 0.2);
                color: #e74c3c;
            }

            /* 正确输入提示 */
            .sudoku-cell-correct {
                background: rgba(46, 204, 113, 0.2);
                color: #27ae60;
                animation: correctPulse 1s ease-in-out;
            }

            @keyframes correctPulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }

            /* 夜间模式下的单元格样式 */
            .dark-mode .sudoku-cell {
                background: #2a2a2a;
                color: #ffffff;
            }

            .dark-mode .sudoku-cell:focus {
                background: rgba(85, 85, 85, 0.8);
                box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.3);
            }

            .dark-mode .sudoku-cell:hover:not(.sudoku-cell-given) {
                background: rgba(70, 70, 70, 0.9);
            }

            .dark-mode .sudoku-cell-given {
                background: linear-gradient(135deg, rgba(70, 70, 70, 0.8), rgba(60, 60, 60, 0.8));
                color: #ecf0f1;
                font-weight: 900;
            }

            .dark-mode .sudoku-cell-user {
                color: #87ceeb;
                font-weight: 700;
            }

            .dark-mode .sudoku-cell-error {
                background: rgba(231, 76, 60, 0.3);
                color: #e74c3c;
            }

            .dark-mode .sudoku-cell-correct {
                background: rgba(46, 204, 113, 0.3);
                color: #2ecc71;
            }

            /* 游戏状态信息 */
            .sudoku-info {
                display: flex;
                gap: 20px;
                color: #7f8c8d;
                font-size: 14px;
                font-weight: 500;
                justify-content: center;
                flex-wrap: wrap;
            }

            .dark-mode .sudoku-info {
                color: #bdc3c7;
            }

            .sudoku-info-item {
                display: flex;
                align-items: center;
                gap: 5px;
            }

            /* 响应式设计 */
            @media (max-width: 768px) {
                .sudoku-game-overlay {
                    align-items: center;
                    justify-content: center;
                }
                
                .sudoku-game-container {
                    width: 95%;
                    min-width: 320px;
                    max-height: 90vh;
                }
                
                .sudoku-game-header {
                    padding: 16px 20px;
                }
                
                .sudoku-game-title {
                    font-size: 18px;
                }
                
                .sudoku-game-close {
                    width: 28px;
                    height: 28px;
                    font-size: 14px;
                }

                .sudoku-game-content {
                    padding: 15px;
                }

                .sudoku-grid {
                    width: 280px;
                    height: 280px;
                    aspect-ratio: 1;
                }

                .sudoku-cell {
                    font-size: 16px;
                    aspect-ratio: 1;
                }
                
                .sudoku-control-btn {
                    padding: 6px 12px;
                    font-size: 12px;
                }
            }

            @media (max-width: 480px) {
                .sudoku-game-overlay {
                    align-items: center;
                    justify-content: center;
                    padding: 5px;
                }
                
                .sudoku-game-container {
                    width: 98%;
                    min-width: 320px;
                    border-radius: 12px;
                }
                
                .sudoku-game-header {
                    padding: 12px 16px;
                }
                
                .sudoku-game-title {
                    font-size: 16px;
                }
                
                .sudoku-game-content {
                    padding: 8px;
                }
                
                .sudoku-grid {
                    width: 300px;
                    height: 300px;
                    aspect-ratio: 1;
                }

                .sudoku-cell {
                    font-size: 16px;
                    font-weight: bold;
                    aspect-ratio: 1;
                }
                
                .sudoku-controls {
                    gap: 5px;
                    margin-bottom: 10px;
                }
                
                .sudoku-control-btn {
                    padding: 6px 12px;
                    font-size: 12px;
                }

                .sudoku-info {
                    font-size: 12px;
                    gap: 10px;
                }
            }

            /* 大屏幕优化 */
            @media (min-width: 1200px) {
                .sudoku-game-container {
                    max-width: 700px;
                }
                
                .sudoku-game-content {
                    padding: 50px 30px;
                    min-height: 400px;
                }
            }
        `;
    }
}

// 创建全局游戏实例
window.sudokuGame = new SudokuGame();

// 导出游戏启动函数
window.startSudokuGame = async function() {
    try {
        const gameHTML = await window.sudokuGame.init();
        return gameHTML;
    } catch (error) {
        console.error('启动数独游戏失败:', error);
        return '<div style="color: red; text-align: center; padding: 20px;">数独游戏启动失败，请检查控制台错误信息。</div>';
    }
};

// 如果在酒馆环境中，自动启动游戏
if (typeof jQuery !== 'undefined' && jQuery('#chat').length > 0) {
    // 在酒馆环境中
    console.log('数独游戏已加载，使用 startSudokuGame() 函数启动游戏');
}
