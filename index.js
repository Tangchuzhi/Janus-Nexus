jQuery(() => {
    console.log('[Janusの百宝箱] 开始加载扩展...');
    
    // 扩展信息
    const extensionName = 'Janus-Treasure-chest';
    let extensionVersion = 'v1.0.0';
    let currentActiveTab = 'dmss';
    
    // 获取百宝箱版本号
    async function getJanusVersion() {
        try {
            const manifestPath = `scripts/extensions/third-party/${extensionName}/manifest.json`;
            const response = await fetch(manifestPath);
            if (response.ok) {
                const manifest = await response.json();
                return `v${manifest.version}`;
            }
        } catch (error) {
            console.log('[Janusの百宝箱] 无法读取manifest版本信息');
        }
        return 'v1.0.0'; // 默认版本
    }
    
    // 从GitHub获取最新版本信息
    async function fetchLatestVersionFromGitHub() {
        try {
            const response = await fetch('https://raw.githubusercontent.com/chuzhitang/Janus-Treasure-chest/main/manifest.json');
            if (response.ok) {
                const manifest = await response.json();
                return manifest.version;
            }
            throw new Error('无法获取远程版本信息');
        } catch (error) {
            console.error('[Janusの百宝箱] 获取远程版本失败:', error);
            throw error;
        }
    }
    
    // 检查版本更新
    async function checkVersionUpdate() {
        try {
            const localVersion = extensionVersion.replace('v', '');
            const remoteVersion = await fetchLatestVersionFromGitHub();
            
            console.log(`[Janusの百宝箱] 版本比较: 本地 ${localVersion} vs 远程 ${remoteVersion}`);
            
            return {
                local: localVersion,
                remote: remoteVersion,
                hasUpdate: remoteVersion !== localVersion
            };
        } catch (error) {
            console.error('[Janusの百宝箱] 版本检查失败:', error);
            return {
                local: extensionVersion.replace('v', ''),
                remote: '未知',
                hasUpdate: false
            };
        }
    }
    
    // 从manifest.json获取版本信息
    async function getVersionFromManifest() {
        extensionVersion = await getJanusVersion();
        console.log(`[Janusの百宝箱] 获取版本号: ${extensionVersion}`);
        
        const versionElement = document.querySelector('.janus-version-display');
        if (versionElement) {
            versionElement.textContent = `版本: ${extensionVersion}`;
        }
    }
    
    // 更新版本显示
    async function updateVersionDisplay() {
        try {
            const versionInfo = await checkVersionUpdate();
            const versionDisplay = document.querySelector('.janus-version-display');
            
            if (versionDisplay) {
                const localText = `当前版: v${versionInfo.local}`;
                const remoteText = `最新版: v${versionInfo.remote}`;
                
                if (versionInfo.hasUpdate) {
                    versionDisplay.innerHTML = `
                        <span style="color: #ffc107;">当前版: v${versionInfo.local}</span>
                        <span style="margin: 0 8px;">|</span>
                        <span style="color: #ffc107;">最新版: v${versionInfo.remote}</span>
                    `;
                } else {
                    versionDisplay.innerHTML = `
                        <span style="color: #28a745;">当前版: v${versionInfo.local}</span>
                        <span style="margin: 0 8px;">|</span>
                        <span style="color: #28a745;">最新版: v${versionInfo.remote}</span>
                    `;
                }
            }
        } catch (error) {
            console.log('[Janusの百宝箱] 更新版本显示失败:', error);
        }
    }
    
    // 定期检查版本更新（每5分钟）
    function startVersionCheckInterval() {
        // 立即执行一次
        updateVersionDisplay();
        
        // 每1分钟检查一次
        setInterval(() => {
            updateVersionDisplay();
        }, 1 * 60 * 1000);
    }
    
    
    // 加载预设打包助手内容
    async function loadPresetHelperContent() {
        try {
            const response = await fetch('scripts/extensions/third-party/Janus-Treasure-chest/预设打包助手/index.html');
            if (response.ok) {
                const html = await response.text();
                const contentDiv = document.getElementById('preset-helper-content');
                if (contentDiv) {
                    contentDiv.innerHTML = html;
                    
                    // 加载JavaScript
                    const script = document.createElement('script');
                    script.src = 'scripts/extensions/third-party/Janus-Treasure-chest/预设打包助手/index.js';
                    script.onload = () => {
                        console.log('[Janusの百宝箱] 预设打包助手脚本加载完成');
                    };
                    script.onerror = () => {
                        console.error('[Janusの百宝箱] 预设打包助手脚本加载失败');
                    };
                    document.head.appendChild(script);
                }
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('[Janusの百宝箱] 加载预设打包助手失败:', error);
            const contentDiv = document.getElementById('preset-helper-content');
            if (contentDiv) {
                contentDiv.innerHTML = `
                    <div class="janus-tab-content">
                        <h4><i class="fa-solid fa-box"></i> 预设打包助手</h4>
                        <p style="color: #dc3545;">加载失败: ${error.message}</p>
                    </div>
                `;
            }
        }
    }
    
    // 加载游戏加载器
    async function loadGameLoader() {
        // 如果游戏加载器已经加载，直接返回
        if (window.gameLoader) {
            console.log('[Janusの百宝箱] 游戏加载器已存在');
            return;
        }
        
        try {
            const script = document.createElement('script');
            script.src = 'scripts/extensions/third-party/Janus-Treasure-chest/游戏/game-loader.js';
            script.onload = () => {
                console.log('[Janusの百宝箱] 游戏加载器脚本加载完成');
            };
            script.onerror = () => {
                console.error('[Janusの百宝箱] 游戏加载器脚本加载失败');
            };
            document.head.appendChild(script);
        } catch (error) {
            console.error('[Janusの百宝箱] 加载游戏加载器失败:', error);
        }
    }
    
    // 加载外接口游戏管理器
    async function loadExternalGameManager() {
        // 如果外接口游戏管理器已经加载，直接返回
        if (window.externalGameManager) {
            console.log('[Janusの百宝箱] 外接口游戏管理器已存在');
            // 刷新已导入游戏列表
            setTimeout(() => {
                refreshImportedGamesList();
            }, 100);
            return;
        }
        
        try {
            const script = document.createElement('script');
            script.src = 'scripts/extensions/third-party/Janus-Treasure-chest/游戏/external-game-manager.js';
            script.onload = () => {
                console.log('[Janusの百宝箱] 外接口游戏管理器脚本加载完成');
                // 刷新已导入游戏列表
                setTimeout(() => {
                    refreshImportedGamesList();
                }, 100);
            };
            script.onerror = () => {
                console.error('[Janusの百宝箱] 外接口游戏管理器脚本加载失败');
            };
            document.head.appendChild(script);
        } catch (error) {
            console.error('[Janusの百宝箱] 加载外接口游戏管理器失败:', error);
        }
    }
    
    // 切换标签页
    function switchTab(tabName) {
        currentActiveTab = tabName;
        
        document.querySelectorAll('.janus-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        const contentArea = document.querySelector('.janus-content-area');
        let content = '';
        
        switch(tabName) {
            case 'dmss':
                content = `
                    <div class="janus-tab-content">
                        <h4><i class="fa-solid fa-brain"></i> 动态记忆流系统 (DMSS)</h4>
                        <p>这里将显示DMSS功能界面...</p>
                    </div>
                `;
                break;
            case 'quickTools':
                content = `
                    <div class="janus-tab-content">
                        <h4><i class="fa-solid fa-bolt"></i> 快速交互工具</h4>
                        <p>这里将显示快速交互工具界面...</p>
                    </div>
                `;
                break;
            case 'presetHelper':
                content = `
                    <div class="janus-tab-content">
                        <div id="preset-helper-content">
                            <div style="text-align: center; padding: 20px;">
                                <i class="fa-solid fa-spinner fa-spin"></i>
                                <p>正在加载预设打包助手...</p>
                            </div>
                        </div>
                    </div>
                `;
                break;
            case 'games':
                content = `
                    <div class="janus-tab-content">
                        <h4><i class="fa-solid fa-gamepad"></i> 游戏中心</h4>
                        
                        <!-- 游戏分类标签 -->
                        <div class="game-category-tabs">
                            <button onclick="window.janusHandlers.switchGameCategory('builtin')" class="game-category-btn active" data-category="builtin">
                                <i class="fa-solid fa-cube"></i> 内置游戏
                            </button>
                            <button onclick="window.janusHandlers.switchGameCategory('external')" class="game-category-btn" data-category="external">
                                <i class="fa-solid fa-plug"></i> 外接口
                            </button>
                        </div>
                        
                        <!-- 内置游戏区域 -->
                        <div id="builtin-games" class="game-category-content active">
                            <div class="game-grid">
                                <div class="game-item" onclick="window.janusHandlers.launchGame('polly')">
                                    <div class="game-icon">🎮</div>
                                    <div class="game-name">波利大冒险</div>
                                    <div class="game-desc">桌宠游戏</div>
                                </div>
                                <div class="game-item" onclick="window.janusHandlers.launchGame('snake')">
                                    <div class="game-icon">🐍</div>
                                    <div class="game-name">贪吃蛇</div>
                                    <div class="game-desc">操作游戏</div>
                                </div>
                                <div class="game-item" onclick="window.janusHandlers.launchGame('2048')">
                                    <div class="game-icon">🔢</div>
                                    <div class="game-name">2048</div>
                                    <div class="game-desc">合并游戏</div>
                                </div>
                                <div class="game-item" onclick="window.janusHandlers.launchGame('cat')">
                                    <div class="game-icon">🐱</div>
                                    <div class="game-name">进击的小猫</div>
                                    <div class="game-desc">射击冒险</div>
                                </div>
                                <div class="game-item" onclick="window.janusHandlers.launchGame('flora')">
                                    <div class="game-icon">🏛️</div>
                                    <div class="game-name">芙罗拉的神庙</div>
                                    <div class="game-desc">迷宫探索</div>
                                </div>
                                <div class="game-item" onclick="window.janusHandlers.launchGame('sudoku')">
                                    <div class="game-icon">🧩</div>
                                    <div class="game-name">数独</div>
                                    <div class="game-desc">推理游戏</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 外接口区域 -->
                        <div id="external-games" class="game-category-content">
                            <div class="external-interface">
                                <h5><i class="fa-solid fa-info-circle"></i> 外接口说明</h5>
                                <div class="supported-formats">
                                    <p>通过外接口，您可以导入其他游戏插件到百宝箱中运行。</p>
                                        <strong>支持的导入文件/URL类型列表：</strong><br>
                                        Javascript（需包含startGame函数）/html（完整前端代码）/json（游戏配置）
                                </div>
                                
                                <div class="import-section">
                                    <h6><i class="fa-solid fa-upload"></i> 导入游戏</h6>
                                    <div class="import-controls">
                                        <input type="file" id="game-file-input" accept=".js,.json" style="display: none;" onchange="if(this.files[0]) window.janusHandlers.importGameFromFile(this.files[0])">
                                        <button onclick="document.getElementById('game-file-input').click()" class="import-btn">
                                            <i class="fa-solid fa-folder-open"></i> 选择游戏文件
                                        </button>
                                        <button onclick="window.janusHandlers.importGameFromUrl()" class="import-btn">
                                            <i class="fa-solid fa-link"></i> 从URL导入
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="imported-games">
                                    <h6><i class="fa-solid fa-list"></i> 已导入的游戏</h6>
                                    <div id="imported-games-list">
                                        <div class="no-games">暂无导入的游戏</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                break;
        }
        
        contentArea.innerHTML = content;
        console.log(`[Janusの百宝箱] 切换到标签页: ${tabName}`);
        
        // 如果是预设打包助手标签页，加载内容
        if (tabName === 'presetHelper') {
            setTimeout(() => {
                loadPresetHelperContent();
            }, 100);
        }
        
        // 如果是游戏标签页，加载游戏加载器和外接口管理器
        if (tabName === 'games') {
            setTimeout(() => {
                loadGameLoader();
                loadExternalGameManager();
            }, 100);
        }
    }
    
    // 游戏分类切换
    function switchGameCategory(category) {
        // 更新按钮状态
        document.querySelectorAll('.game-category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
        
        // 更新内容显示
        document.querySelectorAll('.game-category-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${category}-games`).classList.add('active');
        
        console.log(`[Janusの百宝箱] 切换到游戏分类: ${category}`);
    }
    
    // 启动游戏
    async function launchGame(gameType) {
        console.log(`[Janusの百宝箱] 启动游戏: ${gameType}`);
        
        try {
            // 使用游戏加载器启动游戏
            const result = await window.gameLoader.launchGame(gameType);
            
            // 如果游戏内容为空，说明游戏已经直接显示在屏幕上，不需要显示模态框
            if (result.content && result.content.trim() !== '') {
                showGameModal(result.content, result.title);
            }
            
        } catch (error) {
            console.error(`[Janusの百宝箱] 启动游戏失败:`, error);
            showGameModal(`
                <div style="text-align: center; padding: 40px; color: #dc3545;">
                    <h3>❌ 游戏启动失败</h3>
                    <p>错误信息: ${error.message}</p>
                </div>
            `, '错误');
        }
    }
    
    // 获取游戏名称
    function getGameName(gameType) {
        const gameNames = {
            'polly': '波利大冒险',
            'snake': '贪吃蛇',
            '2048': '2048',
            'cat': '进击的小猫',
            'flora': '芙罗拉的神庙',
            'sudoku': '数独'
        };
        return gameNames[gameType] || '未知游戏';
    }
    
    // 显示游戏模态框
    function showGameModal(content, title) {
        // 创建模态框
        const modal = document.createElement('div');
        modal.id = 'janus-game-modal';
        modal.innerHTML = `
            <div class="janus-modal-overlay">
                <div class="janus-modal-content">
                    <div class="janus-modal-header">
                        <h3>${title}</h3>
                        <button class="janus-modal-close" onclick="document.getElementById('janus-game-modal').remove()">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>
                    <div class="janus-modal-body">
                        ${content}
                    </div>
                </div>
            </div>
        `;
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            #janus-game-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
            }
            
            .janus-modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .janus-modal-content {
                background: var(--SmartThemeBackgroundColor, white);
                border-radius: 8px;
                max-width: 90vw;
                max-height: 90vh;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            }
            
            .janus-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                border-bottom: 1px solid var(--SmartThemeBorderColor, #ddd);
                background: var(--SmartThemeQuoteColor, #f8f9fa);
            }
            
            .janus-modal-header h3 {
                margin: 0;
                color: var(--SmartThemeTextColor);
            }
            
            .janus-modal-close {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: var(--SmartThemeTextColor);
                padding: 5px;
            }
            
            .janus-modal-body {
                padding: 20px;
                max-height: 70vh;
                overflow-y: auto;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(modal);
        
        // 点击背景关闭模态框
        modal.querySelector('.janus-modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                modal.remove();
                style.remove();
            }
        });
    }
    
    // 从URL导入游戏
    async function importGameFromUrl() {
        const url = prompt('请输入游戏文件的URL地址:');
        if (url) {
            try {
                console.log(`[Janusの百宝箱] 从URL导入游戏: ${url}`);
                const gameInfo = await window.externalGameManager.importGameFromUrl(url);
                alert(`游戏导入成功！\n名称: ${gameInfo.name}\n描述: ${gameInfo.description}`);
                
                // 刷新已导入游戏列表
                refreshImportedGamesList();
            } catch (error) {
                console.error('[Janusの百宝箱] 从URL导入游戏失败:', error);
                alert(`导入失败: ${error.message}`);
            }
        }
    }
    
    // 从文件导入游戏
    async function importGameFromFile(file) {
        try {
            console.log(`[Janusの百宝箱] 从文件导入游戏: ${file.name}`);
            const gameInfo = await window.externalGameManager.importGameFromFile(file);
            alert(`游戏导入成功！\n名称: ${gameInfo.name}\n描述: ${gameInfo.description}`);
            
            // 刷新已导入游戏列表
            refreshImportedGamesList();
        } catch (error) {
            console.error('[Janusの百宝箱] 从文件导入游戏失败:', error);
            alert(`导入失败: ${error.message}`);
        }
    }
    
    // 刷新已导入游戏列表
    function refreshImportedGamesList() {
        const listContainer = document.getElementById('imported-games-list');
        if (!listContainer) return;
        
        const games = window.externalGameManager.getAllImportedGames();
        
        if (games.length === 0) {
            listContainer.innerHTML = '<div class="no-games">暂无导入的游戏</div>';
            return;
        }
        
        const gamesHTML = games.map(game => `
            <div class="imported-game-item">
                <div class="game-info">
                    <div class="game-icon">${game.icon || '🎮'}</div>
                    <div class="game-details">
                        <div class="game-name">${game.name}</div>
                        <div class="game-desc">${game.description}</div>
                        <div class="game-meta">
                            <span class="game-source">来源: ${game.source === 'file' ? '文件' : 'URL'}</span>
                            <span class="game-date">导入时间: ${new Date(game.importedAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <div class="game-actions">
                    <button onclick="window.janusHandlers.launchExternalGame('${game.id}')" class="action-btn play-btn">
                        <i class="fa-solid fa-play"></i> 启动
                    </button>
                    <button onclick="window.janusHandlers.removeExternalGame('${game.id}')" class="action-btn delete-btn">
                        <i class="fa-solid fa-trash"></i> 删除
                    </button>
                </div>
            </div>
        `).join('');
        
        listContainer.innerHTML = gamesHTML;
    }
    
    // 启动外部游戏
    async function launchExternalGame(gameId) {
        try {
            const result = await window.externalGameManager.launchExternalGame(gameId);
            
            // 如果游戏内容为空，说明游戏已经直接显示在屏幕上，不需要显示模态框
            if (result.content && result.content.trim() !== '') {
                showGameModal(result.content, result.title);
            }
        } catch (error) {
            console.error('[Janusの百宝箱] 启动外部游戏失败:', error);
            showGameModal(`
                <div style="text-align: center; padding: 40px; color: #dc3545;">
                    <h3>❌ 游戏启动失败</h3>
                    <p>错误信息: ${error.message}</p>
                </div>
            `, '错误');
        }
    }
    
    // 删除外部游戏
    function removeExternalGame(gameId) {
        if (confirm('确定要删除这个游戏吗？')) {
            const removed = window.externalGameManager.removeGame(gameId);
            if (removed) {
                alert('游戏已删除');
                refreshImportedGamesList();
            } else {
                alert('删除失败');
            }
        }
    }
    
    // 模块功能处理函数
    window.janusHandlers = {
        switchTab: switchTab,
        switchGameCategory: switchGameCategory,
        launchGame: launchGame,
        importGameFromUrl: importGameFromUrl,
        importGameFromFile: importGameFromFile,
        launchExternalGame: launchExternalGame,
        removeExternalGame: removeExternalGame,
        refreshImportedGamesList: refreshImportedGamesList
    };
    
    // 菜单栏布局的HTML内容
    const html = `
        <div class="janus-simple-container">
            <!-- 版本信息行 -->
            <div class="janus-header-row">
                <div class="janus-version-display">版本: ${extensionVersion}</div>
            </div>
            
            <!-- 菜单栏标签页 -->
            <div class="janus-tab-bar">
                <button onclick="window.janusHandlers.switchTab('dmss')" class="menu_button janus-tab-btn active" data-tab="dmss" title="动态记忆流系统">
                    <i class="fa-solid fa-brain"></i> DMSS
                </button>
                <button onclick="window.janusHandlers.switchTab('quickTools')" class="menu_button janus-tab-btn" data-tab="quickTools" title="快速交互工具">
                    <i class="fa-solid fa-bolt"></i> 快速交互
                </button>
                <button onclick="window.janusHandlers.switchTab('presetHelper')" class="menu_button janus-tab-btn" data-tab="presetHelper" title="预设打包助手">
                    <i class="fa-solid fa-box"></i> 打包助手
                </button>
                <button onclick="window.janusHandlers.switchTab('games')" class="menu_button janus-tab-btn" data-tab="games" title="前端小游戏">
                    <i class="fa-solid fa-gamepad"></i> GAME
                </button>
            </div>
            
            <!-- 内容区域 -->
            <div class="janus-content-area">
                <div class="janus-tab-content">
                    <h4><i class="fa-solid fa-brain"></i> 动态记忆流系统 (DMSS)</h4>
                    <p>这里将显示DMSS功能界面...</p>
                </div>
            </div>
        </div>
        
        <style>
        .janus-simple-container {
            padding: 5px 0;
        }
        
        /* 版本信息行 */
        .janus-header-row {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 3px 0;
            margin-bottom: 5px;
            border-bottom: 1px solid var(--SmartThemeBorderColor, #ddd);
        }
        
        .janus-version-display {
            font-size: 11px;
            color: var(--SmartThemeTextColor);
            opacity: 0.8;
            text-align: center;
        }
        
        /* 菜单栏标签页 - 减小间距 */
        .janus-tab-bar {
            display: flex;
            gap: 3px;
            margin-bottom: 8px;
            border-bottom: 1px solid var(--SmartThemeBorderColor, #ccc);
            padding-bottom: 5px;
        }
        
        .janus-tab-btn {
            font-size: 12px;
            padding: 5px 10px;
            flex: 1;
            min-width: 0;
            border-bottom: 2px solid transparent;
            transition: all 0.3s ease;
        }
        
        .janus-tab-btn.active {
            border-bottom-color: var(--SmartThemeQuoteColor, #007bff);
            background-color: var(--SmartThemeQuoteColor, rgba(0, 123, 255, 0.1));
            font-weight: bold;
        }
        
        .janus-tab-btn:hover {
            background-color: var(--SmartThemeQuoteColor, rgba(0, 123, 255, 0.05));
        }
        
        /* 内容区域 */
        .janus-content-area {
            min-height: 180px;
            padding: 12px;
            background: var(--SmartThemeChatTintColor, rgba(0, 0, 0, 0.05));
            border-radius: 8px;
        }
        
        .janus-tab-content h4 {
            margin: 0 0 8px 0;
            color: var(--SmartThemeTextColor);
        }
        
        .janus-tab-content p {
            margin: 0;
            color: var(--SmartThemeTextColor);
            opacity: 0.8;
        }
        
        /* 减小整体内联抽屉的内边距 */
        #janus-treasure-chest-settings .inline-drawer-content {
            padding: 5px;
        }
        
        /* 游戏分类标签样式 */
        .game-category-tabs {
            display: flex;
            gap: 5px;
            margin-bottom: 15px;
            border-bottom: 1px solid var(--SmartThemeBorderColor, #ddd);
            padding-bottom: 8px;
        }
        
        .game-category-btn {
            flex: 1;
            padding: 8px 12px;
            border: none;
            background: transparent;
            color: var(--SmartThemeTextColor);
            cursor: pointer;
            border-radius: 4px;
            transition: all 0.3s ease;
            font-size: 12px;
        }
        
        .game-category-btn.active {
            background: var(--SmartThemeQuoteColor, rgba(0, 123, 255, 0.1));
            color: var(--SmartThemeQuoteColor, #007bff);
            font-weight: bold;
        }
        
        .game-category-btn:hover {
            background: var(--SmartThemeQuoteColor, rgba(0, 123, 255, 0.05));
        }
        
        /* 游戏分类内容 */
        .game-category-content {
            display: none;
        }
        
        .game-category-content.active {
            display: block;
        }
        
        /* 游戏网格布局 */
        .game-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 10px;
            margin-top: 10px;
        }
        
        .game-item {
            background: var(--SmartThemeBackgroundColor, white);
            border: 1px solid var(--SmartThemeBorderColor, #ddd);
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            min-height: 100px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        
        .game-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            border-color: var(--SmartThemeQuoteColor, #007bff);
        }
        
        .game-icon {
            font-size: 24px;
            margin-bottom: 8px;
        }
        
        .game-name {
            font-weight: bold;
            color: var(--SmartThemeTextColor);
            margin-bottom: 4px;
            font-size: 13px;
        }
        
        .game-desc {
            font-size: 11px;
            color: var(--SmartThemeTextColor);
            opacity: 0.7;
        }
        
        /* 外接口样式 */
        .external-interface {
            margin-top: 10px;
        }
        
        .supported-formats {
            background: rgba(52, 152, 219, 0.1);
            border-radius: 8px;
            padding: 12px;
            margin: 10px 0;
            border-left: 4px solid rgba(52, 152, 219, 0.8);
        }
        
        .supported-formats h6 {
            margin: 0 0 8px 0;
            color: rgba(52, 152, 219, 0.9);
            font-size: 13px;
        }
        
        .supported-formats ul {
            margin: 0;
            padding-left: 16px;
        }
        
        .supported-formats li {
            margin: 4px 0;
            font-size: 12px;
            color: var(--SmartThemeTextColor);
            opacity: 0.8;
        }
        
        .supported-formats p {
            margin: 0 0 4px 0;
            font-size: 12px;
            color: var(--SmartThemeTextColor);
            opacity: 0.8;
            line-height: 1.3;
        }
        
        .url-types {
            margin: 0;
            font-size: 12px;
            color: var(--SmartThemeTextColor);
            opacity: 0.8;
            line-height: 1.3;
        }
        
        .url-types strong {
            color: rgba(52, 152, 219, 0.9);
        }
        
        .external-interface h5 {
            margin: 0 0 8px 0;
            color: var(--SmartThemeTextColor);
            font-size: 14px;
        }
        
        .external-interface h6 {
            margin: 15px 0 8px 0;
            color: var(--SmartThemeTextColor);
            font-size: 13px;
        }
        
        .external-interface p {
            margin: 0 0 15px 0;
            color: var(--SmartThemeTextColor);
            opacity: 0.8;
            font-size: 12px;
        }
        
        .import-section {
            background: var(--SmartThemeBackgroundColor, #f8f9fa);
            border: 1px solid var(--SmartThemeBorderColor, #ddd);
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 15px;
        }
        
        .import-controls {
            display: flex;
            gap: 8px;
            margin-top: 8px;
        }
        
        .import-btn {
            flex: 1;
            padding: 8px 12px;
            border: 1px solid var(--SmartThemeBorderColor, #ddd);
            background: var(--SmartThemeBackgroundColor, white);
            color: var(--SmartThemeTextColor);
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
            transition: all 0.3s ease;
        }
        
        .import-btn:hover {
            background: var(--SmartThemeQuoteColor, rgba(0, 123, 255, 0.05));
            border-color: var(--SmartThemeQuoteColor, #007bff);
        }
        
        .imported-games {
            background: var(--SmartThemeBackgroundColor, #f8f9fa);
            border: 1px solid var(--SmartThemeBorderColor, #ddd);
            border-radius: 6px;
            padding: 12px;
        }
        
        .no-games {
            text-align: center;
            color: var(--SmartThemeTextColor);
            opacity: 0.6;
            font-size: 12px;
            padding: 20px;
        }
        
        /* 已导入游戏列表样式 */
        .imported-game-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            border: 1px solid var(--SmartThemeBorderColor, #ddd);
            border-radius: 6px;
            margin-bottom: 8px;
            background: var(--SmartThemeBackgroundColor, white);
            transition: all 0.3s ease;
        }
        
        .imported-game-item:hover {
            border-color: var(--SmartThemeQuoteColor, #007bff);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .game-info {
            display: flex;
            align-items: center;
            flex: 1;
        }
        
        .game-info .game-icon {
            font-size: 20px;
            margin-right: 10px;
        }
        
        .game-details {
            flex: 1;
        }
        
        .game-details .game-name {
            font-weight: bold;
            color: var(--SmartThemeTextColor);
            font-size: 13px;
            margin-bottom: 2px;
        }
        
        .game-details .game-desc {
            color: var(--SmartThemeTextColor);
            opacity: 0.8;
            font-size: 11px;
            margin-bottom: 4px;
        }
        
        .game-meta {
            display: flex;
            gap: 10px;
            font-size: 10px;
            color: var(--SmartThemeTextColor);
            opacity: 0.6;
        }
        
        .game-actions {
            display: flex;
            gap: 5px;
        }
        
        .action-btn {
            padding: 4px 8px;
            border: 1px solid var(--SmartThemeBorderColor, #ddd);
            background: var(--SmartThemeBackgroundColor, white);
            color: var(--SmartThemeTextColor);
            border-radius: 4px;
            cursor: pointer;
            font-size: 10px;
            transition: all 0.3s ease;
        }
        
        .action-btn:hover {
            background: var(--SmartThemeQuoteColor, rgba(0, 123, 255, 0.05));
            border-color: var(--SmartThemeQuoteColor, #007bff);
        }
        
        .play-btn:hover {
            background: rgba(40, 167, 69, 0.1);
            border-color: #28a745;
            color: #28a745;
        }
        
        .delete-btn:hover {
            background: rgba(220, 53, 69, 0.1);
            border-color: #dc3545;
            color: #dc3545;
        }
        </style>
    `;
    
    // 添加到扩展设置页面
    setTimeout(() => {
        $('#extensions_settings').append(`
            <div id="janus-treasure-chest-settings">
                <div class="inline-drawer">
                    <div class="inline-drawer-toggle inline-drawer-header">
                        <b>Janusの百宝箱</b>
                        <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                    </div>
                    <div class="inline-drawer-content">
                        ${html}
                    </div>
                </div>
            </div>
        `);
        console.log('[Janusの百宝箱] 扩展界面已加载完成');
        
        setTimeout(() => {
            getVersionFromManifest();
            setTimeout(() => {
                updateVersionDisplay();
                // 启动自动版本检查，每1分钟检查一次
                startVersionCheckInterval();
            }, 1000);
        }, 500);
        
        // 不显示加载成功通知
    }, 2000);
    

    window.getJanusVersion = getJanusVersion;
});
