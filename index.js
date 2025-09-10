(function() {
    'use strict';
    
    console.log('🎉 Janus Treasure Chest 扩展已加载！');
    
    // 简单测试：添加一个按钮到扩展设置页面
    jQuery(() => {
        const html = `
            <div id="janus-treasure-chest" class="extension-settings">
                <h3>🎁 Janus宝藏箱</h3>
                <p>扩展已成功加载！</p>
                <button onclick="alert('Janus扩展工作正常！')">测试按钮</button>
            </div>
        `;
        
        $('#extensions_settings2').append(html);
    });
})();
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
