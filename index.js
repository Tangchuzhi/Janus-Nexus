jQuery(() => {
    console.log('[Janus百宝箱] 开始加载扩展...');
    
    // 模块功能处理函数
    window.janusHandlers = {
        dmss: () => {
            toastr.info('DMSS功能正在开发中，敬请期待！', 'Janus百宝箱');
            console.log('[Janus百宝箱] DMSS模块被点击');
        },
        
        quickTools: () => {
            toastr.info('快速交互工具功能正在开发中，敬请期待！', 'Janus百宝箱');
            console.log('[Janus百宝箱] 快速交互工具模块被点击');
        },
        
        presetHelper: () => {
            toastr.info('预设打包助手功能正在开发中，敬请期待！', 'Janus百宝箱');
            console.log('[Janus百宝箱] 预设打包助手模块被点击');
        },
        
        games: () => {
            toastr.info('前端游戏功能正在开发中，敬请期待！', 'Janus百宝箱');
            console.log('[Janus百宝箱] 前端游戏模块被点击');
        }
    };
    
    // 带样式的HTML内容
    const html = `
        <div class="janus-container">
            <div class="janus-header">
                <h2 style="color: #667eea; margin-bottom: 10px;">🎁 Janus百宝箱</h2>
                <p style="color: #666; margin-bottom: 20px;">多功能AI助手工具集</p>
            </div>
            
            <div class="janus-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
                <button onclick="window.janusHandlers.dmss()" class="janus-card" style="padding: 20px; border: 2px solid #667eea; border-radius: 10px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; cursor: pointer; transition: all 0.3s ease;">
                    <div style="font-size: 2em; margin-bottom: 10px;">🧠</div>
                    <h3 style="margin: 5px 0; font-size: 1.1em;">DMSS</h3>
                    <p style="margin: 0; font-size: 0.9em; opacity: 0.8;">动态记忆流系统</p>
                </button>
                
                <button onclick="window.janusHandlers.quickTools()" class="janus-card" style="padding: 20px; border: 2px solid #667eea; border-radius: 10px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; cursor: pointer; transition: all 0.3s ease;">
                    <div style="font-size: 2em; margin-bottom: 10px;">⚡</div>
                    <h3 style="margin: 5px 0; font-size: 1.1em;">快速交互工具</h3>
                    <p style="margin: 0; font-size: 0.9em; opacity: 0.8;">高效交互助手</p>
                </button>
                
                <button onclick="window.janusHandlers.presetHelper()" class="janus-card" style="padding: 20px; border: 2px solid #667eea; border-radius: 10px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; cursor: pointer; transition: all 0.3s ease;">
                    <div style="font-size: 2em; margin-bottom: 10px;">📦</div>
                    <h3 style="margin: 5px 0; font-size: 1.1em;">预设打包助手</h3>
                    <p style="margin: 0; font-size: 0.9em; opacity: 0.8;">角色预设管理</p>
                </button>
                
                <button onclick="window.janusHandlers.games()" class="janus-card" style="padding: 20px; border: 2px solid #667eea; border-radius: 10px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; cursor: pointer; transition: all 0.3s ease;">
                    <div style="font-size: 2em; margin-bottom: 10px;">🎮</div>
                    <h3 style="margin: 5px 0; font-size: 1.1em;">前端游戏</h3>
                    <p style="margin: 0; font-size: 0.9em; opacity: 0.8;">波利大冒险等游戏</p>
                </button>
            </div>
            
            <div style="text-align: center; padding: 10px; background: rgba(102, 126, 234, 0.1); border-radius: 5px; font-size: 0.9em; color: #666;">
                状态：就绪 | 版本：v1.0.0
            </div>
        </div>
        
        <style>
        .janus-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        
        @media (max-width: 600px) {
            .janus-grid {
                grid-template-columns: 1fr !important;
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
                        <b>🎁 Janus百宝箱</b>
                        <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                    </div>
                    <div class="inline-drawer-content">
                        ${html}
                    </div>
                </div>
            </div>
        `);
        console.log('[Janus百宝箱] 扩展界面已加载完成');
        toastr.success('Janus百宝箱扩展已成功加载！', 'Janus百宝箱');
    }, 2000);
});
