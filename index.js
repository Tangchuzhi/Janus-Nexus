// Janus百宝箱 - SillyTavern扩展
(() => {
    'use strict';

    const MODULE_NAME = 'janus-treasure-chest';
    
    // 模块状态
    let isInitialized = false;
    
    // 更新状态显示
    function updateStatus(message) {
        const statusElement = document.getElementById('status-text');
        if (statusElement) {
            statusElement.textContent = message;
        }
        console.log(`[Janus百宝箱] ${message}`);
    }
    
    // 模块功能处理函数
    const moduleHandlers = {
        'dmss': () => {
            updateStatus('启动DMSS动态记忆流系统...');
            toastr.info('DMSS功能正在开发中，敬请期待！', 'Janus百宝箱');
            // TODO: 实现DMSS功能
        },
        
        'quick-tools': () => {
            updateStatus('启动快速交互工具...');
            toastr.info('快速交互工具功能正在开发中，敬请期待！', 'Janus百宝箱');
            // TODO: 实现快速交互工具
        },
        
        'preset-helper': () => {
            updateStatus('启动预设打包助手...');
            toastr.info('预设打包助手功能正在开发中，敬请期待！', 'Janus百宝箱');
            // TODO: 实现预设打包助手
        },
        
        'games': () => {
            updateStatus('启动前端游戏...');
            toastr.info('前端游戏功能正在开发中，敬请期待！', 'Janus百宝箱');
            // TODO: 实现前端游戏
        }
    };
    
    // 绑定按钮事件
    function bindEvents() {
        const cards = document.querySelectorAll('.janus-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const module = card.dataset.module;
                if (moduleHandlers[module]) {
                    moduleHandlers[module]();
                }
            });
        });
    }
    
    // 初始化扩展
    function initializeExtension() {
        if (isInitialized) return;
        
        console.log('[Janus百宝箱] 正在初始化...');
        
        // 绑定事件
        bindEvents();
        
        // 更新状态
        updateStatus('Janus百宝箱已就绪');
        
        isInitialized = true;
        
        // 显示欢迎消息
        toastr.success('Janus百宝箱扩展已成功加载！', 'Janus百宝箱');
        
        console.log('[Janus百宝箱] 初始化完成');
    }
    
    // 创建设置面板
    function createSettingsPanel() {
        const settingsHtml = `
            <div class="janus-container">
                <div class="janus-header">
                    <h2>🎁 Janusの百宝箱</h2>
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
                        <p>一键打包，一次导入</p>
                    </button>
                    
                    <button class="janus-card" data-module="games">
                        <div class="card-icon">🎮</div>
                        <h3>复古小游戏</h3>
                        <p>波利大冒险</p>
                    </button>
                </div>
                
                <div class="janus-status">
                    <span id="status-text">就绪</span>
                </div>
            </div>
        `;
        
        return settingsHtml;
    }
    
    // SillyTavern 扩展注册
    jQuery(() => {
        const extensionName = 'janus-treasure-chest';
        const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
        
        // 注册扩展设置
        const defaultSettings = {};
        
        // 加载设置
        if (!extension_settings[extensionName]) {
            extension_settings[extensionName] = defaultSettings;
        }
        
        // 创建设置面板HTML
        const settingsHtml = createSettingsPanel();
        
        // 添加到扩展设置页面
        $('#extensions_settings').append(`
            <div id="${extensionName}_settings">
                <div class="inline-drawer">
                    <div class="inline-drawer-toggle inline-drawer-header">
                        <b>🎁 Janusの百宝箱</b>
                        <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                    </div>
                    <div class="inline-drawer-content">
                        ${settingsHtml}
                    </div>
                </div>
            </div>
        `);
        
        // 初始化扩展
        setTimeout(() => {
            initializeExtension();
        }, 1000);
    });
    
})();
