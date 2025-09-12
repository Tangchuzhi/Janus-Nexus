/**
 * 外接口游戏管理器 - 管理外部游戏的导入和运行
 * 类似于酒馆助手的脚本库外接口功能
 */

class ExternalGameManager {
    constructor() {
        this.importedGames = new Map();
        this.gameStorageKey = 'janus_imported_games';
        this.loadImportedGames();
    }

    /**
     * 从本地存储加载已导入的游戏
     */
    loadImportedGames() {
        try {
            const stored = localStorage.getItem(this.gameStorageKey);
            if (stored) {
                const games = JSON.parse(stored);
                games.forEach(game => {
                    this.importedGames.set(game.id, game);
                });
                console.log(`[ExternalGameManager] 加载了 ${games.length} 个已导入的游戏`);
            }
        } catch (error) {
            console.error('[ExternalGameManager] 加载已导入游戏失败:', error);
        }
    }

    /**
     * 保存已导入的游戏到本地存储
     */
    saveImportedGames() {
        try {
            const games = Array.from(this.importedGames.values());
            localStorage.setItem(this.gameStorageKey, JSON.stringify(games));
            console.log(`[ExternalGameManager] 保存了 ${games.length} 个已导入的游戏`);
        } catch (error) {
            console.error('[ExternalGameManager] 保存已导入游戏失败:', error);
        }
    }

    /**
     * 从文件导入游戏
     */
    async importGameFromFile(file) {
        try {
            const content = await this.readFileContent(file);
            const gameInfo = this.parseGameFile(content, file.name);
            
            if (!gameInfo) {
                throw new Error('无法解析游戏文件');
            }

            // 生成唯一ID
            const gameId = this.generateGameId(gameInfo.name);
            gameInfo.id = gameId;
            gameInfo.importedAt = Date.now();
            gameInfo.source = 'file';
            gameInfo.fileName = file.name;

            // 保存游戏
            this.importedGames.set(gameId, gameInfo);
            this.saveImportedGames();

            console.log(`[ExternalGameManager] 成功导入游戏: ${gameInfo.name}`);
            return gameInfo;

        } catch (error) {
            console.error('[ExternalGameManager] 导入游戏失败:', error);
            throw error;
        }
    }

    /**
     * 从URL导入游戏
     */
    async importGameFromUrl(url) {
        try {
            console.log(`[ExternalGameManager] 开始从URL导入游戏: ${url}`);
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const content = await response.text();
            const fileName = url.split('/').pop() || 'unknown.js';
            const gameInfo = this.parseGameFile(content, fileName);

            if (!gameInfo) {
                throw new Error('无法解析游戏文件');
            }

            // 生成唯一ID
            const gameId = this.generateGameId(gameInfo.name);
            gameInfo.id = gameId;
            gameInfo.importedAt = Date.now();
            gameInfo.source = 'url';
            gameInfo.url = url;

            // 保存游戏
            this.importedGames.set(gameId, gameInfo);
            this.saveImportedGames();

            console.log(`[ExternalGameManager] 成功从URL导入游戏: ${gameInfo.name}`);
            return gameInfo;

        } catch (error) {
            console.error('[ExternalGameManager] 从URL导入游戏失败:', error);
            throw error;
        }
    }

    /**
     * 读取文件内容
     */
    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('文件读取失败'));
            reader.readAsText(file);
        });
    }

    /**
     * 解析游戏文件
     */
    parseGameFile(content, fileName) {
        try {
            // 尝试解析为JSON格式的游戏描述文件
            if (fileName.endsWith('.json')) {
                const gameInfo = JSON.parse(content);
                if (gameInfo.name && gameInfo.entryPoint) {
                    return gameInfo;
                }
            }

            // 尝试从JavaScript文件中提取游戏信息
            if (fileName.endsWith('.js')) {
                return this.extractGameInfoFromJS(content, fileName);
            }

            throw new Error('不支持的文件格式');

        } catch (error) {
            console.error('[ExternalGameManager] 解析游戏文件失败:', error);
            return null;
        }
    }

    /**
     * 从JavaScript文件中提取游戏信息
     */
    extractGameInfoFromJS(content, fileName) {
        // 尝试提取游戏信息
        const nameMatch = content.match(/name\s*[:=]\s*['"`]([^'"`]+)['"`]/i);
        const entryMatch = content.match(/entryPoint\s*[:=]\s*['"`]([^'"`]+)['"`]/i);
        const descMatch = content.match(/description\s*[:=]\s*['"`]([^'"`]+)['"`]/i);

        const gameName = nameMatch ? nameMatch[1] : fileName.replace('.js', '');
        const entryPoint = entryMatch ? entryMatch[1] : 'startGame';
        const description = descMatch ? descMatch[1] : '导入的游戏';

        return {
            name: gameName,
            entryPoint: entryPoint,
            description: description,
            icon: '🎮',
            content: content,
            type: 'javascript'
        };
    }

    /**
     * 生成游戏ID
     */
    generateGameId(name) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 5);
        return `external_${name.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}_${random}`;
    }

    /**
     * 获取所有已导入的游戏
     */
    getAllImportedGames() {
        return Array.from(this.importedGames.values());
    }

    /**
     * 根据ID获取游戏信息
     */
    getGameById(gameId) {
        return this.importedGames.get(gameId);
    }

    /**
     * 启动外部游戏
     */
    async launchExternalGame(gameId) {
        try {
            const gameInfo = this.getGameById(gameId);
            if (!gameInfo) {
                throw new Error('游戏不存在');
            }

            console.log(`[ExternalGameManager] 启动外部游戏: ${gameInfo.name}`);

            if (gameInfo.type === 'javascript') {
                // 执行JavaScript游戏
                return await this.executeJSGame(gameInfo);
            } else {
                throw new Error('不支持的游戏类型');
            }

        } catch (error) {
            console.error('[ExternalGameManager] 启动外部游戏失败:', error);
            throw error;
        }
    }

    /**
     * 执行JavaScript游戏
     */
    async executeJSGame(gameInfo) {
        try {
            // 创建临时脚本元素
            const script = document.createElement('script');
            script.textContent = gameInfo.content;
            
            // 临时添加到页面
            const tempContainer = document.createElement('div');
            tempContainer.style.display = 'none';
            tempContainer.appendChild(script);
            document.body.appendChild(tempContainer);

            // 等待脚本执行
            await new Promise(resolve => setTimeout(resolve, 100));

            // 检查入口函数是否存在
            if (typeof window[gameInfo.entryPoint] !== 'function') {
                throw new Error(`游戏入口函数不存在: ${gameInfo.entryPoint}`);
            }

            // 启动游戏
            const gameContent = await window[gameInfo.entryPoint]();

            // 清理临时元素
            document.body.removeChild(tempContainer);

            return {
                success: true,
                content: gameContent,
                title: gameInfo.name
            };

        } catch (error) {
            console.error('[ExternalGameManager] 执行JavaScript游戏失败:', error);
            throw error;
        }
    }

    /**
     * 删除已导入的游戏
     */
    removeGame(gameId) {
        if (this.importedGames.has(gameId)) {
            this.importedGames.delete(gameId);
            this.saveImportedGames();
            console.log(`[ExternalGameManager] 删除游戏: ${gameId}`);
            return true;
        }
        return false;
    }

    /**
     * 清空所有已导入的游戏
     */
    clearAllGames() {
        this.importedGames.clear();
        this.saveImportedGames();
        console.log('[ExternalGameManager] 清空所有已导入的游戏');
    }

    /**
     * 获取游戏统计信息
     */
    getStats() {
        const games = this.getAllImportedGames();
        return {
            total: games.length,
            bySource: {
                file: games.filter(g => g.source === 'file').length,
                url: games.filter(g => g.source === 'url').length
            },
            byType: {
                javascript: games.filter(g => g.type === 'javascript').length,
                json: games.filter(g => g.type === 'json').length
            }
        };
    }
}

// 创建全局外接口游戏管理器实例
window.externalGameManager = new ExternalGameManager();

// 导出外接口游戏管理器
window.ExternalGameManager = ExternalGameManager;

console.log('[ExternalGameManager] 外接口游戏管理器已初始化');
