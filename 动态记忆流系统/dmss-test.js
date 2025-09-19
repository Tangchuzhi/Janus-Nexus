/**
 * DMSS 系统测试文件
 * 用于验证DMSS系统的基本功能
 */

// 测试DMSS指令
const testDMSSCommands = [
    {
        action: "CREATE",
        target: "C_001_测试角色",
        payload: {
            "核心驱动": "探索未知世界",
            "关系网": {
                "NPC_A": "朋友",
                "NPC_B": "敌人"
            },
            "人生履历": {
                "ARC_第一章_初入世界": "角色初次进入游戏世界，学习基本技能，结识第一个朋友NPC_A"
            }
        }
    },
    {
        action: "APPEND",
        target: "C_001_测试角色.人生履历.E_001_酒馆冲突",
        payload: {
            "content": "在酒馆中与NPC_B发生冲突",
            "timestamp": "2025-01-15",
            "location": "酒馆"
        }
    },
    {
        action: "COMPRESS",
        target: "C_001_测试角色.人生履历",
        payload: {
            "arc_id": "ARC_第二章_冒险开始",
            "arc_summary": "角色完成了初期的技能学习，开始真正的冒险之旅，与NPC_A建立了深厚的友谊，与NPC_B的冲突也进一步升级",
            "events_to_delete": ["E_001_酒馆冲突"]
        }
    }
];

// 测试函数
function testDMSSSystem() {
    console.log('[DMSS测试] 开始测试DMSS系统...');
    
    if (typeof window.DMSS === 'undefined') {
        console.error('[DMSS测试] DMSS系统未加载');
        return;
    }
    
    // 测试1: 检查系统状态
    window.DMSS.getStatus().then(status => {
        console.log('[DMSS测试] 系统状态:', status);
        
        // 测试2: 处理测试指令
        const testMessage = `<DMSS>
${JSON.stringify(testDMSSCommands)}
</DMSS>`;
        
        console.log('[DMSS测试] 测试消息:', testMessage);
        
        // 模拟处理消息
        if (window.DMSS._debug && window.DMSS._debug.processor) {
            window.DMSS._debug.processor.processMessage(testMessage).then(result => {
                console.log('[DMSS测试] 处理结果:', result);
                
                // 测试3: 获取记忆快照
                return window.DMSS.getSnapshot();
            }).then(snapshot => {
                console.log('[DMSS测试] 记忆快照:', snapshot);
                
                // 测试4: 格式化上下文
                const contextText = window.DMSS._debug.injector.formatContext(snapshot);
                console.log('[DMSS测试] 上下文文本:', contextText);
                
                console.log('[DMSS测试] 所有测试完成');
            }).catch(error => {
                console.error('[DMSS测试] 测试失败:', error);
            });
        } else {
            console.log('[DMSS测试] 调试API不可用，跳过详细测试');
        }
    }).catch(error => {
        console.error('[DMSS测试] 获取状态失败:', error);
    });
}

// 在页面加载完成后运行测试
$(document).ready(() => {
    setTimeout(() => {
        testDMSSSystem();
    }, 3000);
});

// 暴露测试函数到全局
window.testDMSS = testDMSSSystem;
