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
                        <span style="color: #dc3545;">${localText}</span>
                        <span style="margin: 0 8px;">|</span>
                        <span style="color: #28a745;">${remoteText}</span>
                    `;
                } else {
                    versionDisplay.innerHTML = `
                        <span style="color: #28a745;">${localText}</span>
                        <span style="margin: 0 8px;">|</span>
                        <span style="color: #6c757d;">${remoteText}</span>
                    `;
                }
            }
        } catch (error) {
            console.log('[Janusの百宝箱] 更新版本显示失败:', error);
        }
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
    
    // 打开打包弹窗
    function openPackModal() {
        // 创建模态框
        const modal = document.createElement('div');
        modal.id = 'preset-pack-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;
        
        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 8px;
                padding: 20px;
                max-width: 90%;
                max-height: 90%;
                overflow: auto;
                position: relative;
            ">
                <button onclick="closePackModal()" style="
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                ">×</button>
                <div id="pack-modal-content">
                    <div style="text-align: center; padding: 20px;">
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        <p>正在加载打包界面...</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 加载打包内容
        loadPackContent();
    }
    
    // 打开导入弹窗
    function openImportModal() {
        // 创建模态框
        const modal = document.createElement('div');
        modal.id = 'preset-import-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;
        
        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 8px;
                padding: 20px;
                max-width: 90%;
                max-height: 90%;
                overflow: auto;
                position: relative;
            ">
                <button onclick="closeImportModal()" style="
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                ">×</button>
                <div id="import-modal-content">
                    <div style="text-align: center; padding: 20px;">
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        <p>正在加载导入界面...</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 加载导入内容
        loadImportContent();
    }
    
    // 关闭弹窗
    function closePackModal() {
        const modal = document.getElementById('preset-pack-modal');
        if (modal) {
            modal.remove();
        }
    }
    
    function closeImportModal() {
        const modal = document.getElementById('preset-import-modal');
        if (modal) {
            modal.remove();
        }
    }
    
    // 加载打包内容
    async function loadPackContent() {
        try {
            const response = await fetch('scripts/extensions/third-party/Janus-Treasure-chest/预设打包助手/index.html');
            if (response.ok) {
                const html = await response.text();
                const contentDiv = document.getElementById('pack-modal-content');
                if (contentDiv) {
                    // 只显示打包部分
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const packTab = doc.querySelector('#pack-tab');
                    if (packTab) {
                        contentDiv.innerHTML = packTab.innerHTML;
                        
                        // 加载JavaScript
                        const script = document.createElement('script');
                        script.src = 'scripts/extensions/third-party/Janus-Treasure-chest/预设打包助手/index.js';
                        script.onload = () => {
                            console.log('[Janusの百宝箱] 打包界面脚本加载完成');
                        };
                        document.head.appendChild(script);
                    }
                }
            }
        } catch (error) {
            console.error('[Janusの百宝箱] 加载打包界面失败:', error);
        }
    }
    
    // 加载导入内容
    async function loadImportContent() {
        try {
            const response = await fetch('scripts/extensions/third-party/Janus-Treasure-chest/预设打包助手/index.html');
            if (response.ok) {
                const html = await response.text();
                const contentDiv = document.getElementById('import-modal-content');
                if (contentDiv) {
                    // 只显示导入部分
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const importTab = doc.querySelector('#import-tab');
                    if (importTab) {
                        contentDiv.innerHTML = importTab.innerHTML;
                        
                        // 加载JavaScript
                        const script = document.createElement('script');
                        script.src = 'scripts/extensions/third-party/Janus-Treasure-chest/预设打包助手/index.js';
                        script.onload = () => {
                            console.log('[Janusの百宝箱] 导入界面脚本加载完成');
                        };
                        document.head.appendChild(script);
                    }
                }
            }
        } catch (error) {
            console.error('[Janusの百宝箱] 加载导入界面失败:', error);
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
                        <h4><i class="fa-solid fa-box"></i> 预设打包助手</h4>
                        <div style="display: flex; gap: 15px; justify-content: center; margin-top: 20px;">
                            <button onclick="openPackModal()" class="preset-helper-btn preset-helper-btn-pack">
                                <i class="fa-solid fa-box"></i> 打包
                            </button>
                            <button onclick="openImportModal()" class="preset-helper-btn preset-helper-btn-import">
                                <i class="fa-solid fa-download"></i> 导入
                            </button>
                        </div>
                    </div>
                `;
                break;
            case 'games':
                content = `
                    <div class="janus-tab-content">
                        <h4><i class="fa-solid fa-gamepad"></i> 前端小游戏</h4>
                        <p>这里将显示前端游戏界面...</p>
                    </div>
                `;
                break;
        }
        
        contentArea.innerHTML = content;
        console.log(`[Janusの百宝箱] 切换到标签页: ${tabName}`);
    }
    
    // 模块功能处理函数
    window.janusHandlers = {
        switchTab: switchTab,
        openPackModal: openPackModal,
        openImportModal: openImportModal,
        closePackModal: closePackModal,
        closeImportModal: closeImportModal
    };
    
    // 将函数暴露到全局作用域
    window.openPackModal = openPackModal;
    window.openImportModal = openImportModal;
    window.closePackModal = closePackModal;
    window.closeImportModal = closeImportModal;
    
    // 菜单栏布局的HTML内容
    const html = `
        <div class="janus-simple-container">
            <!-- 版本信息行 -->
            <div class="janus-header-row">
                <div class="janus-version-display">当前版: v${extensionVersion.replace('v', '')} | 最新版: 检查中...</div>
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
        }
        
        /* 菜单栏标签页 */
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
        
        /* 预设打包助手按钮样式 */
        .preset-helper-btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 120px;
            justify-content: center;
        }
        
        .preset-helper-btn-pack {
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
            color: white;
        }
        
        .preset-helper-btn-pack:hover {
            background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
        }
        
        .preset-helper-btn-import {
            background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);
            color: white;
        }
        
        .preset-helper-btn-import:hover {
            background: linear-gradient(135deg, #1e7e34 0%, #155724 100%);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
        }
        
        /* 减小整体内联抽屉的内边距 */
        #janus-treasure-chest-settings .inline-drawer-content {
            padding: 5px;
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
            }, 1000);
        }, 500);
        
        // 不显示加载成功通知
    }, 2000);
    

    window.getJanusVersion = getJanusVersion;
    window.updateJanus = updateJanus;
});
