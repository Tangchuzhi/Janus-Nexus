jQuery(() => {
    console.log('[Janusの百宝箱] 开始加载扩展...');
    
    // 扩展信息
    const extensionName = 'Janus-Treasure-chest';
    let extensionVersion = 'v1.0.0';
    
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
                const versionElement = document.querySelector('.janus-version-info small');
                if (versionElement) {
                    versionElement.textContent = `版本: ${extensionVersion} | 状态: 就绪`;
                }
            }
        } catch (error) {
            console.log('[Janusの百宝箱] 无法读取manifest版本信息，使用默认版本');
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
            toastr.info('前端小游戏功能正在开发中，敬请期待！', 'Janusの百宝箱');
            console.log('[Janusの百宝箱] 前端小游戏模块被点击');
        },
        
        update: async () => {
            toastr.info('正在检查更新...', 'Janusの百宝箱');
            console.log('[Janus百宝箱] 检查更新中...');
            
            // 模拟检查更新
            setTimeout(() => {
                const hasUpdate = Math.random() > 0.7; // 30%概率有更新
                
                if (hasUpdate) {
                    toastr.success('发现新版本！NEW!', 'Janusの百宝箱');
                    // 这里可以添加实际的更新逻辑
                } else {
                    toastr.info('已是最新版本', 'Janusの百宝箱');
                }
            }, 1500);
        }
    };
    
    const html = `
        <div class="janus-simple-container">
            <!-- 功能按钮区域 -->
            <div class="janus-button-row">
                <button onclick="window.janusHandlers.dmss()" class="menu_button" title="动态记忆流系统">
                    DMSS
                </button>
                <button onclick="window.janusHandlers.quickTools()" class="menu_button" title="快速交互工具">
                    快速交互工具
                </button>
                <button onclick="window.janusHandlers.presetHelper()" class="menu_button" title="预设打包助手">
                    预设打包助手
                </button>
                <button onclick="window.janusHandlers.games()" class="menu_button" title="前端小游戏">
                    前端小游戏
                </button>
            </div>
            
            <!-- 更新按钮区域 -->
            <div class="janus-update-row">
                <button onclick="window.janusHandlers.update()" class="menu_button menu_button_icon" title="检查更新">
                    <i class="fa-solid fa-sync-alt"></i> 更新
                </button>
            </div>
            
            <!-- 版本信息 -->
            <div class="janus-version-info">
                <small>版本: ${extensionVersion} | 状态: 加载中...</small>
            </div>
        </div>
        
        <style>
        .janus-simple-container {
            padding: 10px 0;
        }
        
        .janus-button-row {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 15px;
        }
        
        .janus-button-row .menu_button {
            flex: 1;
            min-width: 120px;
            font-size: 12px;
            padding: 8px 12px;
            white-space: nowrap;
        }
        
        .janus-update-row {
            display: flex;
            justify-content: center;
            margin-bottom: 10px;
        }
        
        .janus-update-row .menu_button {
            min-width: 100px;
            font-size: 12px;
        }
        
        .janus-version-info {
            text-align: center;
            opacity: 0.7;
            font-size: 11px;
            margin-top: 5px;
        }
        
        /* 移动端适配 */
        @media (max-width: 768px) {
            .janus-button-row {
                flex-direction: column;
            }
            
            .janus-button-row .menu_button {
                flex: none;
                width: 100%;
                min-width: auto;
            }
        }
        
        /* 小屏幕适配 */
        @media (max-width: 480px) {
            .janus-button-row .menu_button {
                font-size: 11px;
                padding: 6px 8px;
            }
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
        
        // 加载完成后获取版本信息
        setTimeout(() => {
            getVersionFromManifest();
        }, 500);
        
        toastr.success('Janusの百宝箱扩展已成功加载！', 'Janusの百宝箱');
    }, 2000);
});
