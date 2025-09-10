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
    
    // 使用SillyTavern的扩展更新API
    async function updateExtensionViaAPI() {
        try {
            // 检查是否在SillyTavern环境中
            if (typeof fetch === 'undefined') {
                throw new Error('当前环境不支持fetch API');
            }
            
            // 使用SillyTavern内置的扩展更新API
            const response = await fetch('/api/extensions/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                body: JSON.stringify({ 
                    extensionName: extensionName, 
                    global: false 
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('[Janusの百宝箱] API更新响应:', result);
                return result;
            } else {
                const errorText = await response.text();
                console.error('[Janusの百宝箱] API更新失败:', response.status, errorText);
                throw new Error(`更新失败: ${response.status} ${errorText}`);
            }
        } catch (error) {
            console.error('[Janusの百宝箱] API更新过程出错:', error);
            throw error;
        }
    }
    
    // 备用更新方法：通过重新安装扩展
    async function fallbackUpdateMethod() {
        try {
            console.log('[Janusの百宝箱] 尝试备用更新方法...');
            
            // 尝试通过重新安装来更新
            const installResponse = await fetch('/api/extensions/install', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                body: JSON.stringify({ 
                    url: 'https://github.com/chuzhitang/Janus-Treasure-chest', 
                    global: false 
                })
            });
            
            if (installResponse.ok) {
                console.log('[Janusの百宝箱] 备用更新方法成功');
                return { success: true, isUpToDate: false };
            } else {
                const errorText = await installResponse.text();
                throw new Error(`备用更新失败: ${installResponse.status} ${errorText}`);
            }
        } catch (error) {
            console.error('[Janusの百宝箱] 备用更新方法失败:', error);
            throw error;
        }
    }
    
    // 更新百宝箱扩展
    async function updateJanus() {
        try {
            console.log('[Janusの百宝箱] 开始更新流程...');
            
            // 首先检查是否有新版本
            const localVersion = extensionVersion.replace('v', '');
            const remoteVersion = await fetchLatestVersionFromGitHub();
            
            console.log(`[Janusの百宝箱] 版本比较: 本地 ${localVersion} vs 远程 ${remoteVersion}`);
            
            if (remoteVersion === localVersion) {
                console.log('[Janusの百宝箱] 已是最新版本，无需更新');
                return { success: true, isUpToDate: true };
            }
            
            try {
                // 首先尝试使用SillyTavern的扩展更新API
                const updateResult = await updateExtensionViaAPI();
                
                if (updateResult.isUpToDate) {
                    console.log('[Janusの百宝箱] 已是最新版本');
                    return { success: true, isUpToDate: true };
                } else {
                    console.log('[Janusの百宝箱] 更新成功，准备刷新页面');
                    return { success: true, isUpToDate: false };
                }
            } catch (apiError) {
                console.log('[Janusの百宝箱] API更新失败，尝试备用方法:', apiError.message);
                
                // 如果API更新失败，尝试备用方法
                const fallbackResult = await fallbackUpdateMethod();
                return fallbackResult;
            }
            
        } catch (error) {
            console.error('[Janusの百宝箱] 更新失败:', error);
            return { success: false, error: error.message };
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
    
    // 自动检查是否有新版本
    async function checkForUpdates() {
        try {
            // 获取当前本地版本号（去掉v前缀以便比较）
            const localVersion = extensionVersion.replace('v', '');
            
            // 使用新的GitHub版本获取函数
            const remoteVersion = await fetchLatestVersionFromGitHub();
            
            console.log(`[Janusの百宝箱] 检查更新: 远程版本 ${remoteVersion}, 本地版本 ${localVersion}`);
            
            // 比较版本号，如果不同则表示有更新
            if (remoteVersion !== localVersion) {
                const updateIcon = document.querySelector('.janus-update-icon');
                if (updateIcon) {
                    updateIcon.style.color = '#ff4444';
                    updateIcon.classList.add('fa-bounce'); // 添加动画效果
                    updateIcon.title = `发现新版本 ${remoteVersion}，点击更新`;
                }
                console.log('[Janusの百宝箱] 发现新版本！');
            } else {
                const updateIcon = document.querySelector('.janus-update-icon');
                if (updateIcon) {
                    updateIcon.title = '已是最新版本';
                }
                console.log('[Janusの百宝箱] 已是最新版本');
            }
        } catch (error) {
            console.log('[Janusの百宝箱] 检查更新失败:', error);
            const updateIcon = document.querySelector('.janus-update-icon');
            if (updateIcon) {
                updateIcon.title = '检查更新失败';
            }
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
                        <p>这里将显示预设打包助手界面...</p>
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
        
        update: async () => {
            try {
                const updateIcon = document.querySelector('.janus-update-icon');
                updateIcon.className = 'fa-solid fa-spinner fa-spin janus-update-icon';
                
                // 使用我们自定义的更新函数
                const result = await updateJanus();
                
                if (result.success) {
                    if (result.isUpToDate) {
                        console.log('[Janusの百宝箱] 已是最新版本');
                        // 显示已是最新版本的消息
                        if (typeof toastr !== 'undefined') {
                            toastr.success('Janusの百宝箱已是最新版本');
                        }
                        updateIcon.className = 'fa-solid fa-check janus-update-icon';
                        updateIcon.style.color = '#28a745';
                        // 3秒后恢复原样
                        setTimeout(() => {
                            updateIcon.className = 'fa-solid fa-sync-alt janus-update-icon';
                            updateIcon.style.color = '';
                        }, 3000);
                    } else {
                        console.log('[Janusの百宝箱] 更新成功，准备刷新页面...');
                        // 显示更新成功消息
                        if (typeof toastr !== 'undefined') {
                            toastr.success('Janusの百宝箱更新成功，页面即将刷新...');
                        }
                        updateIcon.className = 'fa-solid fa-check janus-update-icon';
                        updateIcon.style.color = '#28a745';
                        // 2秒后刷新页面
                        setTimeout(() => location.reload(), 2000);
                    }
                } else {
                    console.log('[Janusの百宝箱] 更新失败:', result.error);
                    // 显示更新失败消息
                    if (typeof toastr !== 'undefined') {
                        toastr.error(`更新失败: ${result.error}`);
                    }
                    updateIcon.className = 'fa-solid fa-exclamation-triangle janus-update-icon';
                    updateIcon.style.color = '#dc3545';
                    // 3秒后恢复原样
                    setTimeout(() => {
                        updateIcon.className = 'fa-solid fa-sync-alt janus-update-icon';
                        updateIcon.style.color = '';
                    }, 3000);
                }
            } catch (error) {
                console.error('[Janusの百宝箱] 更新过程出错:', error);
                const updateIcon = document.querySelector('.janus-update-icon');
                updateIcon.className = 'fa-solid fa-exclamation-triangle janus-update-icon';
                updateIcon.style.color = '#dc3545';
                // 显示错误消息
                if (typeof toastr !== 'undefined') {
                    toastr.error(`更新过程出错: ${error.message}`);
                }
                // 3秒后恢复原样
                setTimeout(() => {
                    updateIcon.className = 'fa-solid fa-sync-alt janus-update-icon';
                    updateIcon.style.color = '';
                }, 3000);
            }
        }
    };
    
    // 菜单栏布局的HTML内容
    const html = `
        <div class="janus-simple-container">
            <!-- 版本和更新信息行 -->
            <div class="janus-header-row">
                <div class="janus-version-display">版本: ${extensionVersion}</div>
                <div class="janus-update-btn" onclick="window.janusHandlers.update()" title="检查并更新到最新版本">
                    <i class="fa-solid fa-sync-alt janus-update-icon"></i>
                </div>
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
        
        /* 版本和更新信息行 - 减小间距 */
        .janus-header-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 3px 0;
            margin-bottom: 5px;
            border-bottom: 1px solid var(--SmartThemeBorderColor, #ddd);
        }
        
        .janus-version-display {
            font-size: 11px;
            color: var(--SmartThemeTextColor);
            opacity: 0.8;
        }
        
        .janus-update-btn {
            cursor: pointer;
            padding: 2px;
            border-radius: 4px;
            transition: all 0.3s ease;
        }
        
        .janus-update-btn:hover {
            background-color: var(--SmartThemeQuoteColor, rgba(0, 123, 255, 0.1));
        }
        
        .janus-update-icon {
            font-size: 12px;
            color: var(--SmartThemeTextColor, #666);
            transition: all 0.3s ease;
        }
        
        .janus-update-icon:hover {
            color: var(--SmartThemeQuoteColor, #007bff);
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
                checkForUpdates();
            }, 1000);
        }, 500);
        
        // 不显示加载成功通知
    }, 2000);
    
    // 暴露API方法（类似酒馆助手）
    // 这些方法只供内部使用，不是给其他扩展调用的
    window.getJanusVersion = getJanusVersion;
    window.updateJanus = updateJanus;
});
