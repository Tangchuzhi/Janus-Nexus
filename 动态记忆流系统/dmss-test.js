/**
 * DMSS测试文件
 * 用于测试动态记忆流系统的各项功能
 */

// 测试用的DMSS内容
const testDMSSContent = `
<DMSS>
[档案区 | Permanent Archive]
[C001_测试角色]: 
核心驱动: 测试驱动 → 因测试事件改变 → 新驱动
关系网: 朋友 → 因测试关系变化 → 挚友
人生履历:
- [ARC_测试章节]@2024-01-01: 测试事件摘要，包含地点、参与人物、起因、经过、关键转折、结局、深远影响
- [E001_测试事件]@2024-01-01: 测试事件详情，对用户及在场NPC即时影响

[G001_测试组织]: 测试组织构成 | 测试特征 | 测试理念 | 测试社会地位
[T001_测试物品]: C001_测试角色 | 测试物品事件摘要 | 测试意义与影响

[备用区 | Standby Roster]
[P001_并行事件]@测试地点: 测试并行事件摘要 | 潜在后续影响 | 与主线交集的激活条件
[C001_测试角色]@测试位置: 当前动向 | 激活条件
[G001_测试组织]@测试据点: 当前动向 | 激活条件
[T001_线索]@潜伏: 内容摘要 | 激活条件
</DMSS>
`;

// 测试正则表达式
function testRegex() {
    console.log('[DMSS Test] 开始测试正则表达式...');
    
    const regex = /<DMSS>([\s\S]*?)<\/DMSS>/g;
    const matches = [];
    let match;
    
    while ((match = regex.exec(testDMSSContent)) !== null) {
        matches.push({
            fullMatch: match[0],
            content: match[1].trim(),
            startIndex: match.index,
            endIndex: match.index + match[0].length
        });
    }
    
    console.log('[DMSS Test] 正则表达式测试结果:', matches.length, '个匹配');
    console.log('[DMSS Test] 匹配内容长度:', matches[0]?.content.length || 0);
    
    return matches;
}

// 测试聊天ID获取
function testChatId() {
    console.log('[DMSS Test] 开始测试聊天ID获取...');
    
    const methods = [
        { name: 'this_chid', value: typeof this_chid !== 'undefined' ? this_chid : null },
        { name: 'getCurrentChatId函数', value: typeof getCurrentChatId === 'function' ? getCurrentChatId() : null },
        { name: 'URL解析', value: window.location.pathname.match(/\/chat\/([^\/]+)/)?.[1] || null },
        { name: 'localStorage', value: localStorage.getItem('current_chat_id') },
        { name: '临时ID', value: 'temp_chat_' + Date.now() }
    ];
    
    console.log('[DMSS Test] 聊天ID获取方法测试:');
    methods.forEach(method => {
        console.log(`  ${method.name}:`, method.value || '未获取到');
    });
    
    const validChatId = methods.find(m => m.value)?.value;
    console.log('[DMSS Test] 推荐使用的聊天ID:', validChatId);
    
    return validChatId;
}

// 测试DMSS核心功能
function testDMSSCore() {
    console.log('[DMSS Test] 开始测试DMSS核心功能...');
    
    if (typeof DMSSCore === 'undefined') {
        console.error('[DMSS Test] DMSSCore未定义');
        return false;
    }
    
    try {
        const core = new DMSSCore();
        console.log('[DMSS Test] DMSSCore实例创建成功');
        
        // 测试聊天ID获取
        const chatId = core.getCurrentChatId();
        console.log('[DMSS Test] 聊天ID获取测试:', chatId || '无法获取');
        
        // 测试内容提取
        const matches = core.extractDMSSContent(testDMSSContent);
        console.log('[DMSS Test] 内容提取测试:', matches.length, '个匹配');
        
        // 测试内容解析
        const sections = core.parseDMSSSections(matches[0]?.content || '');
        console.log('[DMSS Test] 内容解析测试:', sections);
        
        // 测试内容处理（如果聊天ID可用）
        if (chatId) {
            console.log('[DMSS Test] 开始测试内容处理...');
            core.processText(testDMSSContent).then(result => {
                console.log('[DMSS Test] 内容处理测试完成:', result.length, '个匹配');
            }).catch(error => {
                console.error('[DMSS Test] 内容处理测试失败:', error);
            });
        } else {
            console.log('[DMSS Test] 跳过内容处理测试（无聊天ID）');
        }
        
        return true;
    } catch (error) {
        console.error('[DMSS Test] DMSSCore测试失败:', error);
        return false;
    }
}

// 测试DMSS UI功能
function testDMSSUI() {
    console.log('[DMSS Test] 开始测试DMSS UI功能...');
    
    if (typeof DMSSUI === 'undefined') {
        console.error('[DMSS Test] DMSSUI未定义');
        return false;
    }
    
    try {
        const ui = new DMSSUI();
        console.log('[DMSS Test] DMSSUI实例创建成功');
        
        // 测试设置加载
        console.log('[DMSS Test] UI设置:', ui.settings);
        
        return true;
    } catch (error) {
        console.error('[DMSS Test] DMSSUI测试失败:', error);
        return false;
    }
}

// 测试DMSS调试器功能
function testDMSSDebugger() {
    console.log('[DMSS Test] 开始测试DMSS调试器功能...');
    
    if (typeof DMSSDebugger === 'undefined') {
        console.error('[DMSS Test] DMSSDebugger未定义');
        return false;
    }
    
    try {
        const dmssDebugger = new DMSSDebugger();
        console.log('[DMSS Test] DMSSDebugger实例创建成功');
        
        // 测试日志记录
        dmssDebugger.log('info', '测试日志消息');
        console.log('[DMSS Test] 日志记录测试完成');
        
        return true;
    } catch (error) {
        console.error('[DMSS Test] DMSSDebugger测试失败:', error);
        return false;
    }
}

// 运行所有测试
function runAllTests() {
    console.log('[DMSS Test] ========== 开始DMSS系统测试 ==========');
    
    const results = {
        chatId: testChatId(),
        regex: testRegex(),
        core: testDMSSCore(),
        ui: testDMSSUI(),
        debugger: testDMSSDebugger()
    };
    
    console.log('[DMSS Test] ========== 测试结果汇总 ==========');
    console.log('[DMSS Test] 聊天ID获取测试:', results.chatId ? '通过' : '失败');
    console.log('[DMSS Test] 正则表达式测试:', results.regex ? '通过' : '失败');
    console.log('[DMSS Test] 核心模块测试:', results.core ? '通过' : '失败');
    console.log('[DMSS Test] UI模块测试:', results.ui ? '通过' : '失败');
    console.log('[DMSS Test] 调试器测试:', results.debugger ? '通过' : '失败');
    
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`[DMSS Test] 总体结果: ${passedTests}/${totalTests} 测试通过`);
    
    if (passedTests === totalTests) {
        console.log('[DMSS Test] 🎉 所有测试通过！DMSS系统运行正常');
    } else {
        console.log('[DMSS Test] ⚠️ 部分测试失败，请检查相关模块');
        
        // 提供具体的解决建议
        if (!results.chatId) {
            console.log('[DMSS Test] 💡 建议: 在SillyTavern聊天页面中运行测试，或手动设置聊天ID');
        }
        if (!results.core) {
            console.log('[DMSS Test] 💡 建议: 检查DMSSCore模块是否正确加载');
        }
    }
    
    return results;
}

// 导出测试函数
if (typeof window !== 'undefined') {
    window.dmssTest = {
        runAllTests,
        testChatId,
        testRegex,
        testDMSSCore,
        testDMSSUI,
        testDMSSDebugger,
        testDMSSContent
    };
}

console.log('[DMSS Test] DMSS测试模块已加载');
