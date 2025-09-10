// Janus百宝箱 - SillyTavern扩展
(() => {
    'use strict';

    const extensionName = 'Janus-Treasure-chest';
    const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
    
    // 模块功能处理函数
    const moduleHandlers = {
        'dmss': () => {
            toastr.info('DMSS功能正在开发中，敬请期待！', 'Janus百宝箱');
            console.log('[Janus百宝箱] DMSS模块被点击');
        },
        
        'quick-tools': () => {
            toastr.info('快速交互工具功能正在开发中，敬请期待！', 'Janus百宝箱');
            console.log('[Janus百宝箱] 快速交互工具模块被点击');
        },
        
        'preset-helper': () => {
            toastr.info('预设打包助手功能正在开发中，敬请期待！', 'Janus百宝箱');
            console.log('[Janus百宝箱] 预设打包助手模块被点击');
        },
        
        'games': () => {
            toastr.info('前端游戏功能正在开发中，敬请期待！', 'Janus百宝箱');
            console.log('[Janus百宝箱] 前端游戏模块被点击');
        }
    };

    // 创建扩展HTML界面
    function getExtensionHtml() {
        return `
        <div class="janus-container">
            <div class="janus-header">
                <h2>🎁 Janus百宝箱</h2>
                <p class="janus-subtitle">多功能AI助手工具集</p>
            </div>
            
            <div class="janus-grid">
                <button class="janus-card" data-module="dmss">
                    <div class="card-icon">🧠</div>
                    <h3>DMSS</h3>
                    <p>动态记忆流系统</p>
                </button>
                
                <button class="janus-card" data-module="quick-tools">
                    <div class="card-icon">⚡</div>
                    <h3>快速交互工具</h3>
                    <p>高效交互助手</p>
                </button>
                
                <button class="janus-card" data-module="preset-helper">
                    <div class="card-icon">📦</div>
                    <h3>预设打包助手</h3>
                    <p>角色预设管理</p>
                </button>
                
                <button class="janus-card" data-module="games">
                    <div class="card-icon">🎮</div>
                    <h3>前端游戏</h3>
                    <p>波利大冒险等游戏</p>
                </button>
            </div>
            
            <div class="janus-status">
                <span>状态：就绪</span>
            </div>
        </div>
        `;
    }

    // 绑定按钮事件
    function bindEvents() {
        $(document).on('click', '.janus-card', function() {
            const module = $(this).data('module');
            if (moduleHandlers[module]) {
                moduleHandlers[module]();
            }
        });
    }

    // 扩展加载函数
    function loadExtension() {
        // 初始化设置
        const defaultSettings = {};
        if (!extension_settings[extensionName]) {
            extension_settings[extensionName] = defaultSettings;
        }

        // 添加扩展设置面板HTML
        const settingsHtml = getExtensionHtml();
        
        // 添加到扩展设置页面
        $('#extensions_settings2').append(`
            <div id="${extensionName}_container">
                <h3>🎁 Janus百宝箱</h3>
                ${settingsHtml}
            </div>
        `);

        // 绑定事件
        bindEvents();

        console.log('[Janus百宝箱] 扩展加载完成');
        toastr.success('Janus百宝箱扩展已加载！', 'Janus百宝箱');
    }

    // 当jQuery准备就绪时加载扩展
    jQuery(async () => {
        // 等待SillyTavern完全加载
        await new Promise(resolve => setTimeout(resolve, 1000));
        loadExtension();
    });

})();
