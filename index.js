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
            toastr.info('正在检查更新...', 'Janusの百宝箱');
            console.log('[Janusの百宝箱] 检查更新中...');
            
            // 模拟检查更新
            setTimeout(() => {
                // 这里可以实际检查GitHub的最新版本
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
    
    // 简洁的HTML内容 - 符合SillyTavern原生风格
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
                <button onclick="window.janusHandlers.games()" class="menu_button" title="前端游戏">
                    前端游戏
                </button>
            </div>
            
            <!-- 底部信息区域：更新按钮 + 版本信息 -->
            <div class="janus-bottom-row">
                <button onclick="window.janusHandlers.update()" class="menu_button menu_button_icon" title="检查更新">
                    <i class="fa-solid fa-sync-alt"></i> 更新
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
        
        /* 功能按钮布局 */
        .janus-button-row {
            display: grid;
            gap: 8px;
            margin-bottom: 15px;
            grid-template-columns: repeat(4, 1fr); /* 电脑端：4个一排 */
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
        
        /* 平板端适配 */
        @media (max-width: 768px) and (min-width: 481px) {
            .janus-button-row {
                grid-template-columns: repeat(2, 1fr); /* 平板端：2个一排 */
            }
        }
        
        /* 手机端适配 */
        @media (max-width: 480px) {
            .janus-button-row {
                grid-template-columns: repeat(2, 1fr); /* 手机端：2个一排 */
            }
            
            .janus-button-row .menu_button {
                font-size: 11px;
                padding: 6px 4px;
            }
            
            .janus-bottom-row {
                flex-direction: column;
                align-items: center;
                gap: 8px;
            }
            
            .janus-version-info {
                text-align: center;
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
