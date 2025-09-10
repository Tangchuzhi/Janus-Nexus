jQuery(() => {
    console.log('[Janusの百宝箱] 开始加载扩展...');
    
    // 扩展信息
    const extensionName = 'Janus-Treasure-chest';
    let extensionVersion = 'v1.0.0'; // 默认版本号
    let currentActiveTab = 'dmss'; // 当前激活的标签页
    
    // 从manifest.json获取版本信息
    async function getVersionFromManifest() {
        try {
            const manifestPath = `scripts/extensions/third-party/${extensionName}/manifest.json`;
            const response = await fetch(manifestPath);
            if (response.ok) {
                const manifest = await response.json();
                extensionVersion = `v${manifest.version}`;
                console.log(`[Janusの百宝箱] 从manifest获取版本号: ${extensionVersion}`);
                
                // 更新版本显示
                const versionElement = document.querySelector('.janus-version-text');
                if (versionElement) {
                    versionElement.textContent = `版本: ${extensionVersion} | 状态: 就绪`;
                }
            }
        } catch (error) {
            console.log('[Janusの百宝箱] 无法读取manifest版本信息，使用默认版本');
        }
    }
    
    // 自动检查是否有新版本
    async function checkForUpdates() {
        try {
            const response = await fetch('https://api.github.com/repos/chuzhitang/Janus-Treasure-chest/releases/latest');
            const latestRelease = await response.json();
            const latestVersion = latestRelease.tag_name || latestRelease.name;
            
            console.log(`[Janusの百宝箱] 检查更新: 最新版本 ${latestVersion}, 当前版本 ${extensionVersion}`);
            
            if (latestVersion !== extensionVersion) {
                // 显示NEW标识
                const newBadge = document.querySelector('.janus-new-badge');
                if (newBadge) {
                    newBadge.style.display = 'inline';
                    newBadge.style.color = '#ff4444';
                    newBadge.style.fontWeight = 'bold';
                }
                console.log('[Janusの百宝箱] 发现新版本！');
            }
        } catch (error) {
            console.log('[Janusの百宝箱] 检查更新失败:', error);
        }
    }
    
    // 切换标签页
    function switchTab(tabName) {
        currentActiveTab = tabName;
        
        // 更新标签按钮状态
        document.querySelectorAll('.janus-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // 更新内容区域
        const contentArea = document.querySelector('.janus-content-area');
        let content = '';
        
        switch(tabName) {
            case 'dmss':
                content = `
                    <div class="janus-tab-content">
                        <h4><i class="fa-solid fa-brain"></i> 动态记忆流系统 (DMSS)</h4>
                        <p>这里将显示DMSS功能界面...</p>
                        <!-- 在这里添加DMSS的具体功能 -->
                    </div>
                `;
                break;
            case 'quickTools':
                content = `
                    <div class="janus-tab-content">
                        <h4><i class="fa-solid fa-bolt"></i> 快速交互工具</h4>
                        <p>这里将显示快速交互工具界面...</p>
                        <!-- 在这里添加快速交互工具的具体功能 -->
                    </div>
                `;
                break;
            case 'presetHelper':
                content = `
                    <div class="janus-tab-content">
                        <h4><i class="fa-solid fa-box"></i> 预设打包助手</h4>
                        <p>这里将显示预设打包助手界面...</p>
                        <!-- 在这里添加预设打包助手的具体功能 -->
                    </div>
                `;
                break;
            case 'games':
                content = `
                    <div class="janus-tab-content">
                        <h4><i class="fa-solid fa-gamepad"></i> 前端游戏</h4>
                        <p>这里将显示前端游戏界面...</p>
                        <!-- 在这里添加前端游戏的具体功能 -->
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
                // 显示更新按钮为加载状态
                const updateBtn = document.querySelector('.janus-update-btn');
                const originalText = updateBtn.innerHTML;
                updateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 更新中...';
                updateBtn.disabled = true;
                
                console.log('[Janusの百宝箱] 开始更新流程...');
                
                // 1. 检查GitHub最新版本
                const response = await fetch('https://api.github.com/repos/chuzhitang/Janus-Treasure-chest/releases/latest');
                const latestRelease = await response.json();
                const latestVersion = latestRelease.tag_name || latestRelease.name;
                
                console.log(`[Janusの百宝箱] 最新版本: ${latestVersion}, 当前版本: ${extensionVersion}`);
                
                if (latestVersion === extensionVersion) {
                    toastr.info('已是最新版本', 'Janusの百宝箱');
                    updateBtn.innerHTML = originalText;
                    updateBtn.disabled = false;
                    return;
                }
                
                // 2. 触发SillyTavern原生的更新按钮
                console.log('[Janusの百宝箱] 尝试触发原生更新按钮...');
                
                // 尝试找到并点击原生更新按钮
                const nativeUpdateBtn = document.querySelector("body > dialog > div.popup-body > div.popup-content > div > div:nth-child(3) > div:nth-child(3) > div.extension_actions.flex-container.alignItemsCenter > button.btn_update.menu_button.interactable");
                
                if (nativeUpdateBtn) {
                    console.log('[Janusの百宝箱] 找到原生更新按钮，正在触发...');
                    nativeUpdateBtn.click();
                    
                    toastr.success('已触发更新，请等待完成...', 'Janusの百宝箱');
                    
                    // 等待一段时间后刷新页面
                    setTimeout(() => {
                        location.reload();
                    }, 3000);
                } else {
                    console.log('[Janusの百宝箱] 未找到原生更新按钮，尝试其他方法...');
                    
                    // 备用方案：尝试通过更通用的选择器
                    const alternativeBtn = document.querySelector(".btn_update.menu_button.interactable");
                    if (alternativeBtn) {
                        alternativeBtn.click();
                        toastr.success('已触发更新，请等待完成...', 'Janusの百宝箱');
                        setTimeout(() => {
                            location.reload();
                        }, 3000);
                    } else {
                        throw new Error('无法找到更新按钮');
                    }
                }
                
            } catch (error) {
                console.error('[Janusの百宝箱] 更新失败:', error);
                toastr.error('自动更新失败，请手动更新扩展', 'Janusの百宝箱');
                
                // 恢复按钮状态
                const updateBtn = document.querySelector('.janus-update-btn');
                updateBtn.innerHTML = '<i class="fa-solid fa-sync-alt"></i> 更新';
                updateBtn.disabled = false;
            }
        }
    };
    
    // 菜单栏布局的HTML内容
    const html = `
        <div class="janus-simple-container">
            <!-- 菜单栏标签页 -->
            <div class="janus-tab-bar">
                <button onclick="window.janusHandlers.switchTab('dmss')" class="menu_button janus-tab-btn active" data-tab="dmss" title="动态记忆流系统">
                    <i class="fa-solid fa-brain"></i> DMSS
                </button>
                <button onclick="window.janusHandlers.switchTab('quickTools')" class="menu_button janus-tab-btn" data-tab="quickTools" title="快速交互工具">
                    <i class="fa-solid fa-bolt"></i> 快速工具
                </button>
                <button onclick="window.janusHandlers.switchTab('presetHelper')" class="menu_button janus-tab-btn" data-tab="presetHelper" title="预设打包助手">
                    <i class="fa-solid fa-box"></i> 预设助手
                </button>
                <button onclick="window.janusHandlers.switchTab('games')" class="menu_button janus-tab-btn" data-tab="games" title="前端游戏">
                    <i class="fa-solid fa-gamepad"></i> 游戏
                </button>
            </div>
            
            <!-- 内容区域 -->
            <div class="janus-content-area">
                <div class="janus-tab-content">
                    <h4><i class="fa-solid fa-brain"></i> 动态记忆流系统 (DMSS)</h4>
                    <p>这里将显示DMSS功能界面...</p>
                    <!-- 在这里添加DMSS的具体功能 -->
                </div>
            </div>
            
            <!-- 底部信息区域：更新按钮 + 版本信息 -->
            <div class="janus-bottom-row">
                <button onclick="window.janusHandlers.update()" class="menu_button menu_button_icon janus-update-btn" title="检查并更新到最新版本">
                    <i class="fa-solid fa-sync-alt"></i> 更新<span class="janus-new-badge" style="display: none;"> NEW!</span>
                </button>
                <div class="janus-version-info">
                    <small class="janus-version-text">版本: ${extensionVersion} | 状态: 加载中...</small>
                </div>
            </div>
        </div>
        
        <style>
        .janus-simple-container {
            padding: 10px 0;
        }
        
        /* 菜单栏标签页布局 */
        .janus-tab-bar {
            display: flex;
            gap: 4px;
            margin-bottom: 15px;
            border-bottom: 1px solid var(--SmartThemeBorderColor, #ccc);
            padding-bottom: 8px;
        }
        
        .janus-tab-btn {
            font-size: 12px;
            padding: 6px 12px;
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
            min-height: 200px;
            padding: 15px;
            background: var(--SmartThemeChatTintColor, rgba(0, 0, 0, 0.05));
            border-radius: 8px;
            margin-bottom: 15px;
        }
        
        .janus-tab-content h4 {
            margin: 0 0 10px 0;
            color: var(--SmartThemeTextColor);
        }
        
        .janus-tab-content p {
            margin: 0;
            color: var(--SmartThemeTextColor);
            opacity: 0.8;
        }
        
        /* 底部信息区域 */
        .janus-bottom-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
        }
        
        .janus-bottom-row .menu_button {
            font-size: 12px;
            padding: 6px 12px;
            flex-shrink: 0;
        }
        
        .janus-version-info {
            text-align: right;
            opacity: 0.7;
            font-size: 11px;
            flex-grow: 1;
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
        
        // 加载完成后获取版本信息并检查更新
        setTimeout(() => {
            getVersionFromManifest();
            // 再延迟一点检查更新
            setTimeout(() => {
                checkForUpdates();
            }, 1000);
        }, 500);
        
        toastr.success('Janusの百宝箱扩展已成功加载！', 'Janusの百宝箱');
    }, 2000);
});
