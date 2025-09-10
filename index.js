jQuery(() => {
    console.log('[Janus百宝箱] 开始加载扩展...');
    
    // 简单的HTML内容
    const html = `
        <div style="padding: 20px; text-align: center;">
            <h2>🎁 Janus百宝箱测试</h2>
            <button onclick="alert('DMSS点击测试')" style="margin: 10px; padding: 15px; font-size: 16px;">🧠 DMSS</button>
            <button onclick="alert('快速工具点击测试')" style="margin: 10px; padding: 15px; font-size: 16px;">⚡ 快速交互工具</button>
            <button onclick="alert('预设助手点击测试')" style="margin: 10px; padding: 15px; font-size: 16px;">📦 预设打包助手</button>
            <button onclick="alert('游戏点击测试')" style="margin: 10px; padding: 15px; font-size: 16px;">🎮 前端游戏</button>
        </div>
    `;
    
    // 尝试添加到扩展设置页面
    setTimeout(() => {
        $('#extensions_settings').append(`
            <div id="janus-treasure-chest-settings">
                <div class="inline-drawer">
                    <div class="inline-drawer-toggle inline-drawer-header">
                        <b>🎁 Janus百宝箱</b>
                        <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                    </div>
                    <div class="inline-drawer-content">
                        ${html}
                    </div>
                </div>
            </div>
        `);
        console.log('[Janus百宝箱] HTML已添加到页面');
    }, 2000);
});
