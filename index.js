jQuery(() => {
    console.log('[Janusの百宝箱] 开始加载扩展...');
    
    // 扩展信息
    const extensionName = 'Janus-Treasure-chest';
    let extensionVersion = 'v1.0.0'; // 默认版本号
    
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
    
    // 模块功能处理函数
    window.janusHandlers = {
        dmss: () => {
            toastr.info('DMSS功能正在开发中，敬请期待！', 'Janusの百宝箱');
            console.log('[Janusの百宝箱] DMSS模块被点击');
        },
        
        quickTools: () => {
            toastr.info('快速交互工具功能正在开发中，敬请期待！', 'Janusの百宝箱');
            console.log('[Janusの百宝箱] 快速交互工具模块被点击');
        },
        
        presetHelper: () => {
            toastr.info('预设打包助手功能正在开发中，敬请期待！', 'Janusの百宝箱');
            console.log('[Janusの百宝箱] 预设打包助手模块被点击');
        },
        
        games: () => {
            toastr.info('前端游戏功能正在开发中，敬请期待！', 'Janusの百宝箱');
            console.log('[Janusの百宝箱] 前端游戏模块被点击');
        },
        
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
                
                // 2. 执行更新
                const updateResponse = await fetch('/api/extensions/update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        url: 'https://github.com/chuzhitang/Janus-Treasure-chest.git'
                    })
                });
                
                if (updateResponse.ok) {
                    toastr.success('更新成功！正在刷新页面...', 'Janusの百宝箱');
                    setTimeout(() => {
                        location.reload(); // 刷新页面
                    }, 1500);
                } else {
                    throw new Error('更新失败');
                }
                
            } catch (error) {
                console.error('[Janusの百宝箱] 更新失败:', error);
                toastr.error('更新失败，请手动更新', 'Janusの百宝箱');
                
                // 恢复按钮状态
                const updateBtn = document.querySelector('.janus-update-btn');
                updateBtn.innerHTML = '<i class="fa-solid fa-sync-alt"></i> 更新';
                updateBtn.disabled = false;
            }
        }
    };
    
    // 简洁的HTML内容 - 符合SillyTavern原生风格
    const html = `
        <div class="janus-simple-container">
            <!-- 功能按钮区域 -->
            <div class="janus-button-row">
                <button onclick="window.janusHandlers.dmss()" class="menu_button" title="动态记忆流系统">
                    <i class="fa-solid fa-brain"></i> 动态记忆流系统
                </button>
                <button onclick="window.janusHandlers.quickTools()" class="menu_button" title="快速交互工具">
                    <i class="fa-solid fa-bolt"></i> 快速交互工具
                </button>
                <button onclick="window.janusHandlers.presetHelper()" class="menu_button" title="预设打包助手">
                    <i class="fa-solid fa-box"></i> 预设打包助手
                </button>
                <button onclick="window.janusHandlers.games()" class="menu_button" title="前端游戏">
                    <i class="fa-solid fa-gamepad"></i> 前端游戏
                </button>
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
        
        /* 功能按钮布局 - 所有设备都4个一行 */
        .janus-button-row {
            display: grid;
            gap: 8px;
            margin-bottom: 15px;
            grid-template-columns: repeat(4, 1fr); 
        }
        
        .janus-button-row .menu_button {
            font-size: 12px;
            padding: 8px 6px;
            white-space: nowrap;
            min-width: 0;
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
