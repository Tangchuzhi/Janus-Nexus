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
     * 通用弹窗容器包装器 - 为所有游戏提供统一的响应式支持
     */
    wrapGameInUniversalContainer(gameContent, gameTitle) {
        const container = document.createElement('div');
        container.id = 'universal-game-container';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            box-sizing: border-box;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 20px;
            max-width: 90vw;
            max-height: 90vh;
            overflow: auto;
            position: relative;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        `;
        
        // 添加标题栏
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        `;
        
        const title = document.createElement('h3');
        title.textContent = gameTitle || '游戏';
        title.style.cssText = `
            margin: 0;
            color: #333;
            font-size: 18px;
            font-weight: 600;
        `;
        
        // 添加关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
            background: #ff4757;
            color: white;
            border: none;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            cursor: pointer;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s;
        `;
        
        closeBtn.onmouseover = () => closeBtn.style.background = '#ff3742';
        closeBtn.onmouseout = () => closeBtn.style.background = '#ff4757';
        closeBtn.onclick = () => container.remove();
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        
        // 添加响应式样式
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                #universal-game-container {
                    align-items: center;
                    justify-content: center;
                    padding: 10px;
                }
                
                #universal-game-container > div {
                    width: 95%;
                    max-width: 95vw;
                    max-height: 95vh;
                    padding: 15px;
                }
            }
            
            @media (max-width: 480px) {
                #universal-game-container {
                    align-items: center;
                    justify-content: center;
                    padding: 5px;
                }
                
                #universal-game-container > div {
                    width: 98%;
                    max-width: 98vw;
                    max-height: 98vh;
                    padding: 10px;
                }
            }
        `;
        
        content.appendChild(header);
        content.appendChild(gameContent);
        container.appendChild(content);
        document.head.appendChild(style);
        document.body.appendChild(container);
        
        // 点击遮罩关闭
        container.onclick = (e) => {
            if (e.target === container) {
                container.remove();
                style.remove();
            }
        };
        
        // ESC键关闭
        const keyHandler = (e) => {
            if (e.key === 'Escape') {
                container.remove();
                style.remove();
                document.removeEventListener('keydown', keyHandler);
            }
        };
        document.addEventListener('keydown', keyHandler);
        
        return container;
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

            // 尝试从HTML文件中提取游戏信息
            if (fileName.endsWith('.html')) {
                return this.extractGameInfoFromHTML(content, fileName);
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
     * 从HTML文件中提取游戏信息
     */
    extractGameInfoFromHTML(content, fileName) {
        try {
            // 提取标题
            const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
            const gameName = titleMatch ? titleMatch[1].trim() : fileName.replace('.html', '');

            // 提取描述（从meta标签或注释中）
            const descMatch = content.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                             content.match(/<!--\s*description:\s*([^->]+)/i);
            const description = descMatch ? descMatch[1].trim() : 'HTML游戏';

            // 提取图标（从favicon或emoji）
            const iconMatch = content.match(/<link[^>]*rel=["']icon["'][^>]*>/i) ||
                             content.match(/<title[^>]*>([🌾🎮🎯🎲🎪🎨🎭🎸🎺🎻🎼🎵🎶🎤🎧🎬🎭🎨🎪🎯🎲🎮🌾🍀🌱🌿🌳🌲🌴🌵🌶️🌽🌾🌿🍀🍁🍂🍃🍄🍅🍆🍇🍈🍉🍊🍋🍌🍍🍎🍏🍐🍑🍒🍓🍔🍕🍖🍗🍘🍙🍚🍛🍜🍝🍞🍟🍠🍡🍢🍣🍤🍥🍦🍧🍨🍩🍪🍫🍬🍭🍮🍯🍰🍱🍲🍳🍴🍵🍶🍷🍸🍹🍺🍻🍼🍽️🍾🍿🎀🎁🎂🎃🎄🎅🎆🎇🎈🎉🎊🎋🎌🎍🎎🎏🎐🎑🎒🎓🎖🎗🎙🎚🎛🎜🎝🎞🎟🎠🎡🎢🎣🎤🎥🎦🎧🎨🎩🎪🎫🎬🎭🎮🎯🎰🎱🎲🎳🎴🎵🎶🎷🎸🎹🎺🎻🎼🎽🎾🎿🏀🏁🏂🏃🏄🏅🏆🏇🏈🏉🏊🏋🏌🏍🏎🏏🏐🏑🏒🏓🏔🏕🏖🏗🏘🏙🏚🏛🏜🏝🏞🏟🏠🏡🏢🏣🏤🏥🏦🏧🏨🏩🏪🏫🏬🏭🏮🏯🏰🏱🏲🏳🏴🏵🏶🏷🏸🏹🏺🏻🏼🏽🏾🏿])/i);
            const icon = iconMatch ? iconMatch[1] : '🎮';

            // 转换HTML为可在百宝箱中运行的格式
            const convertedContent = this.convertHTMLToRunnable(content);

            return {
                name: gameName,
                entryPoint: 'startGame', // 使用startGame作为入口点
                description: description,
                icon: icon,
                content: convertedContent,
                type: 'html',
                originalHTML: content
            };

        } catch (error) {
            console.error('[ExternalGameManager] 解析HTML文件失败:', error);
            return null;
        }
    }

    /**
     * 将HTML转换为可在百宝箱中运行的格式
     */
    convertHTMLToRunnable(htmlContent) {
        try {
            // 提取CSS样式
            const styleMatch = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
            const styles = styleMatch ? styleMatch[1] : '';

            // 提取JavaScript代码
            const scriptMatch = htmlContent.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
            const scripts = scriptMatch ? scriptMatch[1] : '';

            // 提取body内容
            const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
            const bodyContent = bodyMatch ? bodyMatch[1] : '';

            // 创建可运行的JavaScript代码
            const runnableCode = `
// HTML游戏转换器生成的代码
function startHTMLGame() {
    // 创建游戏容器
    const gameContainer = document.createElement('div');
    gameContainer.id = 'html-game-container';
    gameContainer.style.cssText = \`
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
    \`;

    // 创建游戏内容区域
    const gameContent = document.createElement('div');
    gameContent.id = 'html-game-content';
    gameContent.style.cssText = \`
        background: white;
        border-radius: 12px;
        padding: 20px;
        max-width: 90vw;
        max-height: 90vh;
        overflow: auto;
        position: relative;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    \`;

    // 添加关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = \`
        position: absolute;
        top: 10px;
        right: 10px;
        background: #ff4757;
        color: white;
        border: none;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        cursor: pointer;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
    \`;
    closeBtn.onclick = () => {
        document.body.removeChild(gameContainer);
        document.head.removeChild(styleElement);
    };

    // 添加游戏HTML内容
    gameContent.innerHTML = \`${bodyContent.replace(/`/g, '\\`')}\`;

    // 添加样式
    const styleElement = document.createElement('style');
    styleElement.textContent = \`${styles.replace(/`/g, '\\`')}\`;

    // 组装游戏容器
    gameContainer.appendChild(gameContent);
    gameContent.appendChild(closeBtn);
    document.head.appendChild(styleElement);
    document.body.appendChild(gameContainer);

    // 执行游戏脚本
    try {
        ${scripts.replace(/`/g, '\\`')}
    } catch (error) {
        console.error('游戏脚本执行失败:', error);
    }

    // 点击遮罩关闭
    gameContainer.onclick = (e) => {
        if (e.target === gameContainer) {
            document.body.removeChild(gameContainer);
            document.head.removeChild(styleElement);
        }
    };

    // ESC键关闭
    const keyHandler = (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(gameContainer);
            document.head.removeChild(styleElement);
            document.removeEventListener('keydown', keyHandler);
        }
    };
    document.addEventListener('keydown', keyHandler);

    return '';
}

// 导出函数 - 确保startGame函数存在
window.startHTMLGame = startHTMLGame;
window.startGame = startHTMLGame; // 添加这个别名以确保兼容性
            `;

            return runnableCode;

        } catch (error) {
            console.error('[ExternalGameManager] HTML转换失败:', error);
            return null;
        }
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
            } else if (gameInfo.type === 'html') {
                // 执行HTML游戏
                return await this.executeHTMLGame(gameInfo);
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

            // 如果游戏返回了内容，使用通用包装器包装
            if (gameContent && typeof gameContent === 'string') {
                const gameElement = document.createElement('div');
                gameElement.innerHTML = gameContent;
                this.wrapGameInUniversalContainer(gameElement, gameInfo.name);
            } else if (gameContent && gameContent.nodeType) {
                // 如果返回的是DOM元素，直接包装
                this.wrapGameInUniversalContainer(gameContent, gameInfo.name);
            }

            return {
                success: true,
                content: '', // 不再返回内容，因为已经直接显示
                title: gameInfo.name
            };

        } catch (error) {
            console.error('[ExternalGameManager] 执行JavaScript游戏失败:', error);
            throw error;
        }
    }

    /**
     * 执行HTML游戏
     */
    async executeHTMLGame(gameInfo) {
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

            // HTML游戏已经自己创建了容器，不需要额外包装
            return {
                success: true,
                content: '', // HTML游戏已经直接显示
                title: gameInfo.name
            };

        } catch (error) {
            console.error('[ExternalGameManager] 执行HTML游戏失败:', error);
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
                html: games.filter(g => g.type === 'html').length,
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
