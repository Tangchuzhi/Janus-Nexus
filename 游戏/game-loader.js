
class GameLoader {
    constructor() {
        this.loadedGames = new Map();
        this.gameRegistry = {
            'sudoku': {
                name: '数独',
                path: '游戏/数独/sudoku.js',
                entryPoint: 'startSudokuGame',
                description: '逻辑推理游戏',
                icon: '🧩',
                status: 'ready'
            },
            'polly': {
                name: '波利大冒险',
                path: '游戏/波利大冒险/polly.js',
                entryPoint: 'startPollyGame',
                description: '经典冒险游戏',
                icon: '🎮',
                status: 'development'
            },
            'snake': {
                name: '贪吃蛇',
                path: '游戏/贪吃蛇/snake.js',
                entryPoint: 'startSnakeGame',
                description: '经典贪吃蛇游戏',
                icon: '🐍',
                status: 'development'
            },
            '2048': {
                name: '2048',
                path: '游戏/2048/game2048.js',
                entryPoint: 'start2048Game',
                description: '数字合并游戏',
                icon: '🔢',
                status: 'development'
            },
            'cat': {
                name: '进击的小猫',
                path: '游戏/进击的小猫/cat.js',
                entryPoint: 'startCatGame',
                description: '可爱小猫冒险',
                icon: '🐱',
                status: 'development'
            },
            'flora': {
                name: '芙罗拉的神庙',
                path: '游戏/芙罗拉的神庙/flora.js',
                entryPoint: 'startFloraGame',
                description: '神秘神庙探索',
                icon: '🏛️',
                status: 'development'
            }
        };
    }

    /**
     * 获取游戏信息
     */
    getGameInfo(gameId) {
        return this.gameRegistry[gameId] || null;
    }

    /**
     * 获取所有游戏信息
     */
    getAllGames() {
        return Object.keys(this.gameRegistry).map(id => ({
            id,
            ...this.gameRegistry[id]
        }));
    }

    /**
     * 检查游戏是否已加载
     */
    isGameLoaded(gameId) {
        return this.loadedGames.has(gameId);
    }

    /**
     * 动态加载游戏脚本
     */
    async loadGameScript(gameId) {
        const gameInfo = this.getGameInfo(gameId);
        if (!gameInfo) {
            throw new Error(`游戏不存在: ${gameId}`);
        }

        if (this.isGameLoaded(gameId)) {
            console.log(`[GameLoader] 游戏 ${gameId} 已加载`);
            return true;
        }

        try {
            console.log(`[GameLoader] 开始加载游戏: ${gameInfo.name}`);
            
            const scriptPath = `scripts/extensions/third-party/Janus-Treasure-chest/${gameInfo.path}`;
            const script = document.createElement('script');
            script.src = scriptPath;
            
            return new Promise((resolve, reject) => {
                script.onload = () => {
                    console.log(`[GameLoader] 游戏脚本加载成功: ${gameInfo.name}`);
                    this.loadedGames.set(gameId, {
                        ...gameInfo,
                        loadedAt: Date.now()
                    });
                    resolve(true);
                };
                
                script.onerror = (error) => {
                    console.error(`[GameLoader] 游戏脚本加载失败: ${gameInfo.name}`, error);
                    reject(new Error(`加载游戏脚本失败: ${gameInfo.name}`));
                };
                
                document.head.appendChild(script);
            });
        } catch (error) {
            console.error(`[GameLoader] 加载游戏失败:`, error);
            throw error;
        }
    }

    /**
     * 启动游戏
     */
    async launchGame(gameId) {
        try {
            const gameInfo = this.getGameInfo(gameId);
            if (!gameInfo) {
                throw new Error(`游戏不存在: ${gameId}`);
            }

            // 检查游戏状态
            if (gameInfo.status === 'development') {
                return {
                    success: false,
                    content: `
                        <div style="text-align: center; padding: 40px;">
                            <h3>${gameInfo.icon} ${gameInfo.name}</h3>
                            <p>游戏正在开发中...</p>
                            <p>敬请期待！</p>
                        </div>
                    `,
                    title: gameInfo.name
                };
            }

            // 加载游戏脚本
            await this.loadGameScript(gameId);

            // 检查入口函数是否存在
            if (typeof window[gameInfo.entryPoint] !== 'function') {
                throw new Error(`游戏入口函数不存在: ${gameInfo.entryPoint}`);
            }

            // 启动游戏
            console.log(`[GameLoader] 启动游戏: ${gameInfo.name}`);
            const gameContent = await window[gameInfo.entryPoint]();

            return {
                success: true,
                content: gameContent,
                title: gameInfo.name
            };

        } catch (error) {
            console.error(`[GameLoader] 启动游戏失败:`, error);
            return {
                success: false,
                content: `
                    <div style="text-align: center; padding: 40px; color: #dc3545;">
                        <h3>❌ 游戏启动失败</h3>
                        <p>错误信息: ${error.message}</p>
                        <p>请检查游戏文件是否存在或联系开发者</p>
                    </div>
                `,
                title: '错误'
            };
        }
    }

    /**
     * 预加载游戏（后台加载）
     */
    async preloadGame(gameId) {
        try {
            await this.loadGameScript(gameId);
            console.log(`[GameLoader] 游戏预加载完成: ${gameId}`);
            return true;
        } catch (error) {
            console.error(`[GameLoader] 游戏预加载失败: ${gameId}`, error);
            return false;
        }
    }

    /**
     * 预加载所有可用游戏
     */
    async preloadAllGames() {
        const games = this.getAllGames().filter(game => game.status === 'ready');
        const promises = games.map(game => this.preloadGame(game.id));
        
        try {
            await Promise.all(promises);
            console.log('[GameLoader] 所有游戏预加载完成');
        } catch (error) {
            console.error('[GameLoader] 游戏预加载过程中出现错误:', error);
        }
    }

    /**
     * 获取游戏状态统计
     */
    getGameStats() {
        const allGames = this.getAllGames();
        const loadedGames = Array.from(this.loadedGames.keys());
        
        return {
            total: allGames.length,
            ready: allGames.filter(g => g.status === 'ready').length,
            development: allGames.filter(g => g.status === 'development').length,
            loaded: loadedGames.length,
            games: allGames.map(game => ({
                ...game,
                loaded: loadedGames.includes(game.id)
            }))
        };
    }

    /**
     * 清理已加载的游戏
     */
    clearLoadedGames() {
        this.loadedGames.clear();
        console.log('[GameLoader] 已清理所有游戏缓存');
    }
}

// 创建全局游戏加载器实例
window.gameLoader = new GameLoader();

// 导出游戏加载器
window.GameLoader = GameLoader;

console.log('[GameLoader] 游戏加载器已初始化');
