
class SudokuGame {
    constructor() {
        this.gameId = 'sudoku_game_' + Date.now();
        this.board = Array(9).fill().map(() => Array(9).fill(0));
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
        this.initialBoard = Array(9).fill().map(() => Array(9).fill(0));
        this.difficulty = 'medium'; // easy, medium, hard
        this.gameStarted = false;
        this.gameCompleted = false;
        
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
                board: this.board,
                solution: this.solution,
                initialBoard: this.initialBoard,
                difficulty: this.difficulty,
                gameStarted: this.gameStarted,
                gameCompleted: this.gameCompleted,
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
                    board: this.board,
                    solution: this.solution,
                    initialBoard: this.initialBoard,
                    difficulty: this.difficulty,
                    gameStarted: this.gameStarted,
                    gameCompleted: this.gameCompleted,
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
                this.board = gameState.board || Array(9).fill().map(() => Array(9).fill(0));
                this.solution = gameState.solution || Array(9).fill().map(() => Array(9).fill(0));
                this.initialBoard = gameState.initialBoard || Array(9).fill().map(() => Array(9).fill(0));
                this.difficulty = gameState.difficulty || 'medium';
                this.gameStarted = gameState.gameStarted || false;
                this.gameCompleted = gameState.gameCompleted || false;
                
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
    generatePuzzle(difficulty = 'medium') {
        this.generateSolution();
        this.board = this.solution.map(row => [...row]);
        
        // 根据难度确定要移除的格子数量
        let cellsToRemove;
        switch (difficulty) {
            case 'easy':
                cellsToRemove = 40;
                break;
            case 'medium':
                cellsToRemove = 50;
                break;
            case 'hard':
                cellsToRemove = 60;
                break;
            default:
                cellsToRemove = 50;
        }

        // 随机移除格子
        const positions = [];
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                positions.push([i, j]);
            }
        }
        
        const shuffledPositions = this.shuffleArray(positions);
        
        for (let i = 0; i < cellsToRemove && i < shuffledPositions.length; i++) {
            const [row, col] = shuffledPositions[i];
            this.board[row][col] = 0;
        }
        
        // 保存初始状态
        this.initialBoard = this.board.map(row => [...row]);
        this.difficulty = difficulty;
        this.gameStarted = true;
        this.gameCompleted = false;
    }

    /**
     * 检查游戏是否完成
     */
    checkGameCompletion() {
        // 检查是否所有格子都填满
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.board[i][j] === 0) return false;
            }
        }
        
        // 检查是否符合数独规则
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const num = this.board[i][j];
                this.board[i][j] = 0; // 临时清空以检查
                if (!this.isValidMove(this.board, i, j, num)) {
                    this.board[i][j] = num; // 恢复
                    return false;
                }
                this.board[i][j] = num; // 恢复
            }
        }
        
        this.gameCompleted = true;
        return true;
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
        
        this.board[row][col] = value;
        
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
     * 显示完成消息
     */
    showCompletionMessage() {
        const message = `
        <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px; margin: 10px 0;">
            <h2 style="margin: 0 0 10px 0;">🎉 恭喜！</h2>
            <p style="margin: 0; font-size: 16px;">您成功完成了${this.difficulty}难度的数独游戏！</p>
        </div>
        `;
        
        const gameContainer = document.getElementById('sudoku-game-container');
        if (gameContainer) {
            const existingMessage = gameContainer.querySelector('.completion-message');
            if (existingMessage) {
                existingMessage.remove();
            }
            
            const messageDiv = document.createElement('div');
            messageDiv.className = 'completion-message';
            messageDiv.innerHTML = message;
            gameContainer.insertBefore(messageDiv, gameContainer.firstChild);
        }
    }

    /**
     * 渲染游戏界面
     */
    renderGame() {
        const gameHTML = `
        <div id="sudoku-game-container" style="max-width: 600px; margin: 20px auto; font-family: Arial, sans-serif;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #333; margin-bottom: 10px;">🔢 数独游戏</h2>
                <div style="margin-bottom: 15px;">
                    <label for="difficulty-select" style="margin-right: 10px; font-weight: bold;">难度:</label>
                    <select id="difficulty-select" style="padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="easy" ${this.difficulty === 'easy' ? 'selected' : ''}>简单</option>
                        <option value="medium" ${this.difficulty === 'medium' ? 'selected' : ''}>中等</option>
                        <option value="hard" ${this.difficulty === 'hard' ? 'selected' : ''}>困难</option>
                    </select>
                </div>
                <div style="margin-bottom: 15px;">
                    <button id="new-game-btn" style="padding: 8px 16px; margin: 0 5px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">新游戏</button>
                    <button id="save-game-btn" style="padding: 8px 16px; margin: 0 5px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">保存游戏</button>
                    <button id="load-game-btn" style="padding: 8px 16px; margin: 0 5px; background: #FF9800; color: white; border: none; border-radius: 4px; cursor: pointer;">加载游戏</button>
                    <button id="hint-btn" style="padding: 8px 16px; margin: 0 5px; background: #9C27B0; color: white; border: none; border-radius: 4px; cursor: pointer;">提示</button>
                </div>
            </div>
            
            <div id="sudoku-board" style="display: inline-block; border: 3px solid #333; background: white; margin: 0 auto;">
                ${this.renderBoard()}
            </div>
            
            <div style="text-align: center; margin-top: 15px; font-size: 14px; color: #666;">
                <p>点击格子输入数字 1-9，按Delete键清空格子</p>
                <p>游戏状态会自动保存到酒馆变量系统中</p>
            </div>
        </div>
        `;
        
        return gameHTML;
    }

    /**
     * 渲染数独棋盘
     */
    renderBoard() {
        let boardHTML = '<table style="border-collapse: collapse; margin: 0 auto;">';
        
        for (let i = 0; i < 9; i++) {
            boardHTML += '<tr>';
            for (let j = 0; j < 9; j++) {
                const value = this.board[i][j];
                const isInitial = this.initialBoard[i][j] !== 0;
                const isError = this.hasError(i, j);
                
                let cellStyle = `
                    width: 40px; 
                    height: 40px; 
                    text-align: center; 
                    vertical-align: middle;
                    font-size: 16px; 
                    font-weight: bold;
                    border: 1px solid #ccc;
                    cursor: ${isInitial ? 'not-allowed' : 'pointer'};
                    background: ${isInitial ? '#f0f0f0' : (isError ? '#ffebee' : 'white')};
                    color: ${isInitial ? '#666' : (isError ? '#d32f2f' : '#333')};
                `;
                
                // 加粗3x3宫格边界
                if (i % 3 === 0) cellStyle += 'border-top: 3px solid #333;';
                if (i % 3 === 2) cellStyle += 'border-bottom: 3px solid #333;';
                if (j % 3 === 0) cellStyle += 'border-left: 3px solid #333;';
                if (j % 3 === 2) cellStyle += 'border-right: 3px solid #333;';
                
                boardHTML += `
                    <td id="cell-${i}-${j}" 
                        data-row="${i}" 
                        data-col="${j}" 
                        style="${cellStyle}"
                        onclick="sudokuGame.onCellClick(${i}, ${j})"
                        ${isInitial ? '' : 'contenteditable="true"'}
                        onkeydown="sudokuGame.onCellKeyDown(event, ${i}, ${j})"
                        onblur="sudokuGame.onCellBlur(${i}, ${j})"
                    >
                        ${value === 0 ? '' : value}
                    </td>
                `;
            }
            boardHTML += '</tr>';
        }
        
        boardHTML += '</table>';
        return boardHTML;
    }

    /**
     * 检查格子是否有错误
     */
    hasError(row, col) {
        const num = this.board[row][col];
        if (num === 0) return false;
        
        // 临时清空当前格子
        this.board[row][col] = 0;
        const isValid = this.isValidMove(this.board, row, col, num);
        this.board[row][col] = num; // 恢复
        
        return !isValid;
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
        if (this.gameCompleted) {
            alert('游戏已经完成了！');
            return;
        }
        
        // 找到一个空格子并填入正确答案
        const emptyCells = [];
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.board[i][j] === 0 && this.initialBoard[i][j] === 0) {
                    emptyCells.push([i, j]);
                }
            }
        }
        
        if (emptyCells.length === 0) {
            alert('没有可以提示的格子了！');
            return;
        }
        
        // 随机选择一个空格子
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        const [row, col] = emptyCells[randomIndex];
        const correctValue = this.solution[row][col];
        
        this.setCellValue(row, col, correctValue);
        this.updateCellDisplay(row, col);
        
        // 高亮显示提示的格子
        const cell = document.getElementById(`cell-${row}-${col}`);
        if (cell) {
            cell.style.background = '#e8f5e8';
            setTimeout(() => {
                if (!this.hasError(row, col)) {
                    cell.style.background = 'white';
                }
            }, 2000);
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
        // 尝试加载已保存的游戏
        const loaded = await this.loadGameState();
        
        if (!loaded || !this.gameStarted) {
            // 如果没有保存的游戏，开始新游戏
            this.generatePuzzle(this.difficulty);
        }
        
        // 渲染游戏界面
        const gameContainer = document.createElement('div');
        gameContainer.innerHTML = this.renderGame();
        
        // 添加事件监听器
        setTimeout(() => {
            this.setupEventListeners();
        }, 100);
        
        return gameContainer.innerHTML;
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        const newGameBtn = document.getElementById('new-game-btn');
        const saveGameBtn = document.getElementById('save-game-btn');
        const loadGameBtn = document.getElementById('load-game-btn');
        const hintBtn = document.getElementById('hint-btn');
        const difficultySelect = document.getElementById('difficulty-select');
        
        if (newGameBtn) {
            newGameBtn.onclick = () => {
                const difficulty = document.getElementById('difficulty-select').value;
                this.generatePuzzle(difficulty);
                this.refreshBoard();
                
                // 移除完成消息
                const completionMessage = document.querySelector('.completion-message');
                if (completionMessage) {
                    completionMessage.remove();
                }
            };
        }
        
        if (saveGameBtn) {
            saveGameBtn.onclick = async () => {
                await this.saveGameState();
                alert('游戏已保存！');
            };
        }
        
        if (loadGameBtn) {
            loadGameBtn.onclick = async () => {
                const loaded = await this.loadGameState();
                if (loaded) {
                    this.refreshBoard();
                    alert('游戏已加载！');
                } else {
                    alert('没有找到保存的游戏！');
                }
            };
        }
        
        if (hintBtn) {
            hintBtn.onclick = () => {
                this.giveHint();
            };
        }
        
        if (difficultySelect) {
            difficultySelect.onchange = (e) => {
                this.difficulty = e.target.value;
            };
        }
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
