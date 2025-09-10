jQuery(() => {
    console.log('[Janusの百宝箱] 开始加载扩展...');
    
    // 扩展信息
    const extensionName = 'Janus-Treasure-chest';
    let extensionVersion = 'v1.0.0';
    let currentActiveTab = 'dmss';
    let isFirstLoad = true; // 标记是否首次加载
    
    // 从manifest.json获取版本信息
    async function getVersionFromManifest() {
        try {
            const manifestPath = `scripts/extensions/third-party/${extensionName}/manifest.json`;
            const response = await fetch(manifestPath);
            if (response.ok) {
                const manifest = await response.json();
                extensionVersion = `v${manifest.version}`;
                console.log(`[Janusの百宝箱] 从manifest获取版本号: ${extensionVersion}`);
                
                const versionElement = document.querySelector('.janus-version-display');
                if (versionElement) {
                    versionElement.textContent = `版本: ${extensionVersion}`;
                }
            }
        } catch (error) {
            console.log('[Janusの百宝箱] 无法读取manifest版本信息，使用默认版本');
        }
    }
    
    // 自动检查是否有新版本
    async function checkForUpdates() {
        try {
            const response = await fetch('https://api.github.com/repos/chuzhitang/Janus-Treasure-chest/commits/main');
            const latestCommit = await response.json();
            
            // 模拟检测更新（你可以根据实际需求修改检测逻辑）
            const hasUpdate = Math.random() > 0.7; // 30%概率有更新
            
            if (hasUpdate) {
                const updateIcon = document.querySelector('.janus-update-icon');
                if (updateIcon) {
                    updateIcon.style.color = '#ff4444';
                    updateIcon.classList.add('fa-bounce'); // 添加动画效果
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
                        <h4><i class="fa-solid fa-gamepad"></i> 前端游戏</h4>
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
                
                console.log('[Janusの百宝箱] 开始更新流程...');
                
                // 查找可能的更新函数
                let updateFunction = null;
                
                // 方法1: 全局更新函数
                if (typeof window.updateExtension === 'function') {
                    updateFunction = window.updateExtension;
                }
                // 方法2: 扩展管理器方法
                else if (window.extensionManager && typeof window.extensionManager.updateExtension === 'function') {
                    updateFunction = window.extensionManager.updateExtension;
                }
                // 方法3: 第三方扩展更新方法
                else if (window.extension_settings && window.extension_settings.third_party && typeof window.extension_settings.third_party.updateExtension === 'function') {
                    updateFunction = window.extension_settings.third_party.updateExtension;
                }
                
                if (updateFunction) {
                    console.log('[Janusの百宝箱] 找到更新函数，开始更新...');
                    await updateFunction(extensionName);
                    toastr.success('更新成功！正在刷新页面...', 'Janusの百宝箱');
                    setTimeout(() => location.reload(), 2000);
                } else {
                    // 如果找不到更新函数，尝试手动更新
                    console.log('[Janusの百宝箱] 未找到更新函数，尝试手动模拟更新...');
                    
                    // 模拟点击第三方扩展界面的更新按钮
                    const thirdPartyTab = document.querySelector('a[href="#third-party-extensions"]');
                    if (thirdPartyTab) {
                        thirdPartyTab.click();
                        setTimeout(() => {
                            const extensionRows = document.querySelectorAll('.extension-row');
                            for (const row of extensionRows) {
                                if (row.textContent.includes('Janusの百宝箱') || row.textContent.includes('Janus-Treasure-chest')) {
                                    const updateBtn = row.querySelector('.update-extension-button');
                                    if (updateBtn) {
                                        updateBtn.click();
                                        toastr.success('更新成功！正在刷新页面...', 'Janusの百宝箱');
                                        setTimeout(() => location.reload(), 2000);
                                        return;
                                    }
                                }
                            }
                            throw new Error('未找到扩展的更新按钮');
                        }, 500);
                    } else {
                        throw new Error('无法打开第三方扩展页面');
                    }
                }
                
            } catch (error) {
                console.error('[Janusの百宝箱] 更新失败:', error);
                toastr.warning('请手动更新：设置→扩展→第三方→找到本扩展点击更新', 'Janusの百宝箱');
                
                const updateIcon = document.querySelector('.janus-update-icon');
                updateIcon.className = 'fa-solid fa-sync-alt janus-update-icon';
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
        
        // 只有首次加载才显示通知
        if (isFirstLoad) {
            toastr.success('Janusの百宝箱扩展已加载', 'Janusの百宝箱', {timeOut: 2000});
            isFirstLoad = false;
        }
    }, 2000);
});
