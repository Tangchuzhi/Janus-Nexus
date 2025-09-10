(function() {
    'use strict';

    const extensionName = 'janus-treasure-chest';
    const extensionFolderPath = `scripts/extensions/${extensionName}`;
    
    let settings = {};

    // 扩展初始化
    function init() {
        console.log('Janus Treasure Chest 扩展已加载');
        loadSettings();
        createUI();
    }

    // 加载设置
    function loadSettings() {
        settings = extension_settings[extensionName] || {};
    }

    // 保存设置
    function saveSettings() {
        extension_settings[extensionName] = settings;
        saveSettingsDebounced();
    }

    // 创建UI界面
    function createUI() {
        // 在这里添加你的UI代码
        const html = `
            <div id="janus-treasure-chest">
                <h3>Janus宝藏箱</h3>
                <div class="janus-controls">
                    <!-- 添加你的控件 -->
                </div>
            </div>
        `;
        
        $('#extensions_settings').append(html);
    }

    // 扩展注册
    jQuery(async () => {
        if (window.SillyTavern) {
            init();
        }
    });

})();
