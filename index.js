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
    
    // 加载打包助手内容
    async function loadPresetHelperContent() {
        try {
            const response = await fetch('scripts/extensions/third-party/Janus-Treasure-chest/打包助手/index.html');
            if (response.ok) {
                const html = await response.text();
                const contentDiv = document.getElementById('preset-helper-content');
                if (contentDiv) {
                    contentDiv.innerHTML = html;
                    
                    // 加载JavaScript
                    const script = document.createElement('script');
                    script.src = 'scripts/extensions/third-party/Janus-Treasure-chest/打包助手/index.js';
                    script.onload = () => {
                        console.log('[Janusの百宝箱] 打包助手脚本加载完成');
                    };
                    script.onerror = () => {
                        console.error('[Janusの百宝箱] 打包助手脚本加载失败');
                    };
                    document.head.appendChild(script);
                }
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('[Janusの百宝箱] 加载打包助手失败:', error);
            const contentDiv = document.getElementById('preset-helper-content');
            if (contentDiv) {
                contentDiv.innerHTML = `
                    <div class="janus-tab-content">
                        <h4><i class="fa-solid fa-box"></i> 打包助手</h4>
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
    
    // 加载DMSS核心模块
    async function loadDMSSCore() {
        // 如果DMSS核心已经加载，直接返回
        if (window.DMSSCore && window.DMSSUI) {
            console.log('[Janusの百宝箱] DMSS核心模块已存在');
            return;
        }
        
        try {
            // 加载DMSS核心
            const coreScript = document.createElement('script');
            coreScript.src = 'scripts/extensions/third-party/Janus-Treasure-chest/动态记忆流系统/dmss-core.js';
            coreScript.onload = () => {
                console.log('[Janusの百宝箱] DMSS核心脚本加载完成');
                
                // 加载DMSS UI
                const uiScript = document.createElement('script');
                uiScript.src = 'scripts/extensions/third-party/Janus-Treasure-chest/动态记忆流系统/dmss-ui.js';
                uiScript.onload = () => {
                    console.log('[Janusの百宝箱] DMSS UI脚本加载完成');
                    
                    // 加载DMSS调试器
                    const debuggerScript = document.createElement('script');
                    debuggerScript.src = 'scripts/extensions/third-party/Janus-Treasure-chest/动态记忆流系统/dmss-debugger.js';
                    debuggerScript.onload = () => {
                        console.log('[Janusの百宝箱] DMSS调试器脚本加载完成');
                    };
                    debuggerScript.onerror = () => {
                        console.error('[Janusの百宝箱] DMSS调试器脚本加载失败');
                    };
                    document.head.appendChild(debuggerScript);
                };
                uiScript.onerror = () => {
                    console.error('[Janusの百宝箱] DMSS UI脚本加载失败');
                };
                document.head.appendChild(uiScript);
            };
            coreScript.onerror = () => {
                console.error('[Janusの百宝箱] DMSS核心脚本加载失败');
            };
            document.head.appendChild(coreScript);
        } catch (error) {
            console.error('[Janusの百宝箱] 加载DMSS核心模块失败:', error);
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
                        <h4 style="text-align: center;"><i class="fa-solid fa-brain"></i> 动态记忆流系统 (DMSS)</h4>
                        
                        <!-- DMSS 功能说明 -->
                        <div class="dmss-info-section">
                            <h5><i class="fa-solid fa-info-circle"></i> 系统说明</h5>
                            <div class="workflow-step">
                                <div class="step-number">1</div>
                                <div class="step-content">
                                    <strong>自动捕获:</strong> 系统会自动捕获AI生成的<code>&lt;DMSS&gt;内容&lt;/DMSS&gt;</code>标签内容
                                </div>
                            </div>
                            <div class="workflow-step">
                                <div class="step-number">2</div>
                                <div class="step-content">
                                    <strong>智能存储:</strong> 记忆内容按聊天分类存储，支持多聊天并行管理
                                </div>
                            </div>
                            <div class="workflow-step">
                                <div class="step-number">3</div>
                                <div class="step-content">
                                    <strong>内容管理:</strong> 提供记忆查看、编辑、删除等完整管理功能
                                </div>
                            </div>
                        </div>
                        
                        <!-- DMSS 状态面板 -->
                        <div class="dmss-status-panel">
                            <div class="status-item">
                                <span class="status-label">系统状态:</span>
                                <span id="dmss-status" class="status-value">未启动</span>
                            </div>
                            <div class="status-item">
                                <span class="status-label">当前聊天:</span>
                                <span id="dmss-current-chat" class="status-value">-</span>
                            </div>
                            <div class="status-item">
                                <span class="status-label">记忆条数:</span>
                                <span id="dmss-memory-count" class="status-value">0</span>
                            </div>
                        </div>
                        
                        <!-- DMSS 主控制面板 -->
                        <div class="dmss-main-control">
                            <div class="main-toggle-section">
                                <div class="toggle-container">
                                    <label class="dmss-toggle-label">
                                        <input type="checkbox" id="dmss-main-toggle" onchange="window.janusHandlers.toggleDMSS()">
                                        <span class="toggle-slider"></span>
                                        <span class="toggle-text">启用DMSS</span>
                                    </label>
                                </div>
                                <div class="toggle-description">
                                    <p>启用后，系统将自动捕获AI生成的DMSS记忆内容并存储到当前聊天中</p>
                                </div>
                            </div>
                            
                            <div class="action-buttons">
                                <button onclick="window.janusHandlers.viewMemoryContent()" class="dmss-action-btn primary-btn">
                                    <i class="fa-solid fa-eye"></i> 查看记忆
                                </button>
                                <button onclick="window.janusHandlers.openSettings()" class="dmss-action-btn secondary-btn">
                                    <i class="fa-solid fa-gear"></i> 系统设置
                                </button>
                                <button onclick="window.janusHandlers.resetDMSS()" class="dmss-action-btn warning-btn">
                                    <i class="fa-solid fa-refresh"></i> 重置系统
                                </button>
                            </div>
                        </div>
                        
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
                                <p>正在加载打包助手...</p>
                            </div>
                        </div>
                    </div>
                `;
                break;
            case 'games':
                content = `
                    <div class="janus-tab-content">
                        <h4 style="text-align: center;"><i class="fa-solid fa-gamepad"></i> 游戏中心</h4>
                        
                        <!-- 游戏分类标签 -->
                        <div class="game-category-tabs">
                            <button onclick="window.janusHandlers.switchGameCategory('builtin')" class="game-category-btn active" data-category="builtin">
                                <i class="fa-solid fa-cube"></i> 内置游戏
                            </button>
                            <button onclick="window.janusHandlers.switchGameCategory('external')" class="game-category-btn" data-category="external">
                                <i class="fa-solid fa-plug"></i> 外接游戏
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
                                <h5><i class="fa-solid fa-info-circle"></i> 外接游戏说明</h5>
                                <div class="supported-formats">
                                    <div class="url-types" style="color: var(--SmartThemeTextColor, inherit);">
                                        <strong>支持导入的游戏文件/URL：</strong><br>
                                        - Javascript（需包含startGame函数）<br>
                                        - Html（完整前端代码）<br>
                                        - Json（游戏配置）<br>
                                    </div>
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
        
        // 如果是打包助手标签页，加载内容
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
        
        // 如果是DMSS标签页，加载DMSS模块
        if (tabName === 'dmss') {
            setTimeout(() => {
                loadDMSSCore();
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
            
            // 内置游戏简化逻辑：直接显示toastr提示
            if (result.success) {
                toastr.success('游戏已启动', '启动成功', { timeOut: 2000 });
            } else {
                // 如果游戏启动失败，可能是待施工的游戏
                toastr.info('该游戏正在施工中', '施工中', { timeOut: 2000 });
            }
            
        } catch (error) {
            console.error(`[Janusの百宝箱] 启动游戏失败:`, error);
            toastr.info('该游戏正在施工中', '施工中', { timeOut: 2000 });
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
    
    // 从URL导入游戏
    async function importGameFromUrl() {
        const url = prompt('请输入游戏文件的URL地址:');
        if (url) {
            try {
                console.log(`[Janusの百宝箱] 从URL导入游戏: ${url}`);
                const gameInfo = await window.externalGameManager.importGameFromUrl(url);
                toastr.success(`游戏导入成功！\n名称: ${gameInfo.name}`, '导入成功', { timeOut: 3000 });
                
                // 刷新已导入游戏列表
                refreshImportedGamesList();
            } catch (error) {
                console.error('[Janusの百宝箱] 从URL导入游戏失败:', error);
                toastr.error(`导入失败: ${error.message}`, '导入失败', { timeOut: 3000 });
            }
        }
    }
    
    // 从文件导入游戏
    async function importGameFromFile(file) {
        try {
            console.log(`[Janusの百宝箱] 从文件导入游戏: ${file.name}`);
            const gameInfo = await window.externalGameManager.importGameFromFile(file);
            toastr.success(`游戏导入成功！\n名称: ${gameInfo.name}`, '导入成功', { timeOut: 3000 });
            
            // 刷新已导入游戏列表
            refreshImportedGamesList();
        } catch (error) {
            console.error('[Janusの百宝箱] 从文件导入游戏失败:', error);
            toastr.error(`导入失败: ${error.message}`, '导入失败', { timeOut: 3000 });
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
                        <div class="game-meta" style="font-size: 0.8em; opacity: 0.8; line-height: 1.1; display: block;">
                            <span>${game.source === 'file' ? '[文件]' : '[URL]'}${game.type || ''}</span><br>
                            <span>${new Date(game.importedAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <div class="game-actions">
                    <button onclick="event.stopPropagation(); window.janusHandlers.launchExternalGame('${game.id}')" class="action-btn play-btn">
                        <i class="fa-solid fa-play"></i> 启动
                    </button>
                    <button onclick="event.stopPropagation(); window.janusHandlers.removeExternalGame('${game.id}')" class="action-btn delete-btn">
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
            
            // 外接口游戏只有启动成功/失败两种情况
            if (result.success) {
                toastr.success('游戏已启动', '启动成功', { timeOut: 2000 });
            } else {
                toastr.error('游戏启动失败', '启动失败', { timeOut: 3000 });
            }
        } catch (error) {
            console.error('[Janusの百宝箱] 启动外部游戏失败:', error);
            toastr.error(`游戏启动失败: ${error.message}`, '启动失败', { timeOut: 3000 });
        }
    }
    
    // 删除外部游戏
    function removeExternalGame(gameId) {
        if (confirm('确定要删除这个游戏吗？')) {
            const removed = window.externalGameManager.removeGame(gameId);
            if (removed) {
                toastr.success('游戏已删除', '删除成功', { timeOut: 2000 });
                refreshImportedGamesList();
            } else {
                toastr.error('删除失败', '删除失败', { timeOut: 2000 });
            }
        }
    }
    
    // DMSS 相关处理函数
    let dmssUI = null;
    let dmssEnabled = false;
    
    // 切换DMSS开关
    function toggleDMSS() {
        const toggle = document.getElementById('dmss-main-toggle');
        if (!toggle) return;
        
        dmssEnabled = toggle.checked;
        
        if (dmssEnabled) {
            startDMSS();
        } else {
            stopDMSS();
        }
        
        updateDMSSStatus();
    }
    
    function startDMSS() {
        if (!dmssUI) {
            console.log('[Janusの百宝箱] 初始化DMSS UI');
            // 确保DMSS模块已加载
            if (window.DMSSUI) {
                dmssUI = new window.DMSSUI();
                dmssUI.init();
                // 设置全局引用
                window.dmssUI = dmssUI;
            } else {
                console.error('[Janusの百宝箱] DMSS UI模块未加载');
                toastr.error('DMSS模块加载失败', '错误', { timeOut: 3000 });
                return;
            }
        }
        dmssUI.startDMSS();
        dmssEnabled = true;
        updateDMSSStatus();
    }
    
    function stopDMSS() {
        if (dmssUI) {
            dmssUI.stopDMSS();
        }
        dmssEnabled = false;
        updateDMSSStatus();
    }
    
    function resetDMSS() {
        if (confirm('确定要重置DMSS系统吗？这将清除所有记忆内容。')) {
            if (dmssUI) {
                dmssUI.resetDMSS();
            }
            dmssEnabled = false;
            const toggle = document.getElementById('dmss-main-toggle');
            if (toggle) {
                toggle.checked = false;
            }
            updateDMSSStatus();
            toastr.success('DMSS系统已重置', '重置完成', { timeOut: 2000 });
        }
    }
    
    // 查看记忆内容
    function viewMemoryContent() {
        if (dmssUI) {
            dmssUI.viewMemoryContent();
        } else {
            toastr.info('请先启用DMSS系统', '提示', { timeOut: 2000 });
        }
    }
    
    // 打开设置
    function openSettings() {
        if (dmssUI) {
            dmssUI.openSettings();
        } else {
            toastr.info('请先启用DMSS系统', '提示', { timeOut: 2000 });
        }
    }
    
    // 更新DMSS状态显示
    function updateDMSSStatus() {
        const statusElement = document.getElementById('dmss-status');
        const toggle = document.getElementById('dmss-main-toggle');
        const currentChatElement = document.getElementById('dmss-current-chat');
        const memoryCountElement = document.getElementById('dmss-memory-count');
        
        if (statusElement) {
            statusElement.textContent = dmssEnabled ? '运行中' : '已停止';
            statusElement.style.color = dmssEnabled ? '#28a745' : '#dc3545';
        }
        
        if (toggle) {
            toggle.checked = dmssEnabled;
        }
        
        // 更新当前聊天信息
        if (currentChatElement && dmssUI && dmssUI.core) {
            const chatId = dmssUI.core.currentChatId;
            currentChatElement.textContent = chatId ? chatId.substring(0, 8) + '...' : '-';
        }
        
        // 更新记忆条数
        if (memoryCountElement && dmssUI && dmssUI.core) {
            const memoryCount = dmssUI.core.getCurrentMemory().length;
            memoryCountElement.textContent = memoryCount;
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
        refreshImportedGamesList: refreshImportedGamesList,
        // DMSS 相关函数
        toggleDMSS: toggleDMSS,
        startDMSS: startDMSS,
        stopDMSS: stopDMSS,
        resetDMSS: resetDMSS,
        viewMemoryContent: viewMemoryContent,
        openSettings: openSettings,
        updateDMSSStatus: updateDMSSStatus
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
                <button onclick="window.janusHandlers.switchTab('presetHelper')" class="menu_button janus-tab-btn" data-tab="presetHelper" title="打包助手">
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
            color: var(--SmartThemeTextColor, white);
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
            background: var(--SmartThemeChatTintColor, rgba(255, 255, 255, 0.1));
            border: 1px solid var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.2));
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            min-height: 100px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            color: var(--SmartThemeTextColor);
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
            background: var(--SmartThemeChatTintColor, rgba(255, 255, 255, 0.1));
            border: 1px solid var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.2));
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
            border: 1px solid var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.2));
            background: var(--SmartThemeChatTintColor, rgba(255, 255, 255, 0.1));
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
            background: var(--SmartThemeChatTintColor, rgba(255, 255, 255, 0.1));
            border: 1px solid var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.2));
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
            border: 1px solid var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.2));
            border-radius: 6px;
            margin-bottom: 8px;
            background: transparent;
            transition: all 0.3s ease;
            color: var(--SmartThemeTextColor);
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
            border: 1px solid var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.2));
            background: var(--SmartThemeChatTintColor, rgba(255, 255, 255, 0.1));
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
        
        /* DMSS 样式 */
        .dmss-status-panel {
            background: var(--SmartThemeChatTintColor, rgba(255, 255, 255, 0.1));
            border: 1px solid var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.2));
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 15px;
            display: flex;
            justify-content: space-around;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .status-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            min-width: 100px;
        }
        
        .status-label {
            font-size: 11px;
            color: var(--SmartThemeTextColor);
            opacity: 0.7;
            margin-bottom: 4px;
        }
        
        .status-value {
            font-size: 12px;
            font-weight: bold;
            color: var(--SmartThemeTextColor);
        }
        
        /* DMSS 主控制面板 */
        .dmss-main-control {
            background: var(--SmartThemeChatTintColor, rgba(255, 255, 255, 0.1));
            border: 1px solid var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.2));
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
        }
        
        .main-toggle-section {
            margin-bottom: 15px;
        }
        
        .toggle-container {
            display: flex;
            justify-content: center;
            margin-bottom: 10px;
        }
        
        .dmss-toggle-label {
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            color: var(--SmartThemeTextColor);
        }
        
        .dmss-toggle-label input[type="checkbox"] {
            display: none;
        }
        
        .toggle-slider {
            position: relative;
            width: 50px;
            height: 24px;
            background: var(--SmartThemeBorderColor, #ccc);
            border-radius: 12px;
            transition: all 0.3s ease;
        }
        
        .toggle-slider::before {
            content: '';
            position: absolute;
            top: 2px;
            left: 2px;
            width: 20px;
            height: 20px;
            background: white;
            border-radius: 50%;
            transition: all 0.3s ease;
        }
        
        .dmss-toggle-label input[type="checkbox"]:checked + .toggle-slider {
            background: #28a745;
        }
        
        .dmss-toggle-label input[type="checkbox"]:checked + .toggle-slider::before {
            transform: translateX(26px);
        }
        
        .toggle-description {
            text-align: center;
            margin-top: 8px;
        }
        
        .toggle-description p {
            margin: 0;
            font-size: 12px;
            color: var(--SmartThemeTextColor);
            opacity: 0.8;
            line-height: 1.4;
        }
        
        .action-buttons {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        
        .dmss-action-btn {
            flex: 1;
            min-width: 120px;
            padding: 10px 12px;
            border: 1px solid var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.2));
            background: var(--SmartThemeChatTintColor, rgba(255, 255, 255, 0.1));
            color: var(--SmartThemeTextColor);
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }
        
        .dmss-action-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .dmss-action-btn.primary-btn {
            background: rgba(40, 167, 69, 0.1);
            border-color: #28a745;
            color: #28a745;
        }
        
        .dmss-action-btn.primary-btn:hover {
            background: rgba(40, 167, 69, 0.2);
        }
        
        .dmss-action-btn.secondary-btn {
            background: rgba(108, 117, 125, 0.1);
            border-color: #6c757d;
            color: #6c757d;
        }
        
        .dmss-action-btn.secondary-btn:hover {
            background: rgba(108, 117, 125, 0.2);
        }
        
        .dmss-action-btn.warning-btn {
            background: rgba(255, 193, 7, 0.1);
            border-color: #ffc107;
            color: #ffc107;
        }
        
        .dmss-action-btn.warning-btn:hover {
            background: rgba(255, 193, 7, 0.2);
        }
        
        /* DMSS 功能说明 */
        .dmss-info-section {
            background: rgba(52, 152, 219, 0.1);
            border: 1px solid rgba(52, 152, 219, 0.2);
            border-radius: 8px;
            padding: 15px;
            border-left: 4px solid rgba(52, 152, 219, 0.8);
        }
        
        .dmss-info-section h5 {
            margin: 0 0 12px 0;
            color: rgba(52, 152, 219, 0.9);
            font-size: 14px;
            font-weight: bold;
        }
        
        .workflow-step {
            display: flex;
            align-items: flex-start;
            margin-bottom: 12px;
            gap: 10px;
        }
        
        .step-number {
            width: 24px;
            height: 24px;
            background: rgba(52, 152, 219, 0.8);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            flex-shrink: 0;
        }
        
        .step-content {
            flex: 1;
            color: var(--SmartThemeTextColor);
            font-size: 12px;
            line-height: 1.4;
        }
        
        .step-content strong {
            color: rgba(52, 152, 219, 0.9);
            font-size: 13px;
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
