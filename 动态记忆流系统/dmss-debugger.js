/**
 * DMSS 调试和状态检查工具
 * 用于诊断DMSS系统的问题
 */

class DMSSDebugger {
    constructor() {
        this.isEnabled = false;
    }

    /**
     * 启用调试模式
     */
    enable() {
        this.isEnabled = true;
        console.log('[DMSS Debugger] 调试模式已启用');
    }

    /**
     * 禁用调试模式
     */
    disable() {
        this.isEnabled = false;
        console.log('[DMSS Debugger] 调试模式已禁用');
    }

    /**
     * 检查DMSS系统状态
     */
    checkSystemStatus() {
        console.log('[DMSS Debugger] ========== DMSS系统状态检查 ==========');
        
        // 检查核心模块
        console.log('[DMSS Debugger] 检查核心模块...');
        if (window.DMSSCore) {
            console.log('✅ DMSSCore类已加载');
        } else {
            console.error('❌ DMSSCore类未找到');
        }

        // 检查UI模块
        console.log('[DMSS Debugger] 检查UI模块...');
        if (window.DMSSUI) {
            console.log('✅ DMSSUI类已加载');
        } else {
            console.error('❌ DMSSUI类未找到');
        }

        // 检查全局实例
        console.log('[DMSS Debugger] 检查全局实例...');
        if (window.dmssUI) {
            console.log('✅ dmssUI全局实例存在');
            if (window.dmssUI.core) {
                console.log('✅ dmssUI.core存在');
                console.log('📊 DMSS状态:', window.dmssUI.core.getStatus() ? '启用' : '禁用');
                console.log('📊 当前聊天ID:', window.dmssUI.core.currentChatId);
                console.log('📊 记忆统计:', window.dmssUI.core.getMemoryStats());
            } else {
                console.error('❌ dmssUI.core不存在');
            }
        } else {
            console.error('❌ dmssUI全局实例不存在');
        }

        // 检查模态框
        console.log('[DMSS Debugger] 检查模态框...');
        const memoryModal = document.getElementById('dmss-memory-viewer-modal');
        const settingsModal = document.getElementById('dmss-settings-modal');
        
        if (memoryModal) {
            console.log('✅ 记忆查看器模态框存在');
        } else {
            console.error('❌ 记忆查看器模态框不存在');
        }
        
        if (settingsModal) {
            console.log('✅ 设置模态框存在');
        } else {
            console.error('❌ 设置模态框不存在');
        }

        // 检查extension_settings
        console.log('[DMSS Debugger] 检查存储设置...');
        if (window.extension_settings) {
            console.log('✅ extension_settings存在');
            if (window.extension_settings.dmss) {
                console.log('✅ DMSS设置存在');
                console.log('📊 DMSS设置:', window.extension_settings.dmss);
            } else {
                console.log('⚠️ DMSS设置不存在，将使用默认设置');
            }
        } else {
            console.error('❌ extension_settings不存在');
        }

        // 检查事件系统
        console.log('[DMSS Debugger] 检查事件系统...');
        if (window.eventSource) {
            console.log('✅ eventSource存在');
        } else {
            console.log('⚠️ eventSource不存在，将使用轮询模式');
        }

        if (window.event_types) {
            console.log('✅ event_types存在');
        } else {
            console.log('⚠️ event_types不存在');
        }

        // 检查聊天数据
        console.log('[DMSS Debugger] 检查聊天数据...');
        if (window.chat) {
            console.log('✅ chat数组存在，长度:', window.chat.length);
        } else {
            console.log('⚠️ chat数组不存在');
        }

        if (window.getCurrentChatId) {
            console.log('✅ getCurrentChatId函数存在');
            console.log('📊 当前聊天ID:', window.getCurrentChatId());
        } else if (window.this_chid) {
            console.log('✅ this_chid存在');
            console.log('📊 当前聊天ID:', window.this_chid);
        } else {
            console.log('⚠️ 无法获取当前聊天ID');
        }

        console.log('[DMSS Debugger] ========== 状态检查完成 ==========');
    }

    /**
     * 测试模态框显示
     */
    testModals() {
        console.log('[DMSS Debugger] 测试模态框显示...');
        
        // 测试记忆查看器
        const memoryModal = document.getElementById('dmss-memory-viewer-modal');
        if (memoryModal) {
            memoryModal.style.display = 'block';
            console.log('✅ 记忆查看器模态框已显示');
            setTimeout(() => {
                memoryModal.style.display = 'none';
                console.log('✅ 记忆查看器模态框已隐藏');
            }, 3000);
        } else {
            console.error('❌ 记忆查看器模态框不存在');
        }

        // 测试设置模态框
        setTimeout(() => {
            const settingsModal = document.getElementById('dmss-settings-modal');
            if (settingsModal) {
                settingsModal.style.display = 'block';
                console.log('✅ 设置模态框已显示');
                setTimeout(() => {
                    settingsModal.style.display = 'none';
                    console.log('✅ 设置模态框已隐藏');
                }, 3000);
            } else {
                console.error('❌ 设置模态框不存在');
            }
        }, 4000);
    }

    /**
     * 测试DMSS功能
     */
    testDMSSFunction() {
        console.log('[DMSS Debugger] 测试DMSS功能...');
        
        if (window.dmssUI) {
            // 测试查看记忆
            console.log('测试查看记忆功能...');
            window.dmssUI.viewMemoryContent();
            
            setTimeout(() => {
                // 测试设置
                console.log('测试设置功能...');
                window.dmssUI.openSettings();
            }, 2000);
        } else {
            console.error('❌ dmssUI不存在，无法测试功能');
        }
    }

    /**
     * 创建测试记忆
     */
    createTestMemory() {
        console.log('[DMSS Debugger] 创建测试记忆...');
        
        if (window.dmssUI && window.dmssUI.core) {
            const testContent = '这是一条测试记忆内容，用于验证DMSS系统功能。';
            window.dmssUI.core.saveDMSSContent(testContent, {
                messageId: 'test-' + Date.now(),
                characterId: 'test-character',
                userId: 'test-user'
            });
            console.log('✅ 测试记忆已创建');
        } else {
            console.error('❌ DMSS核心模块不存在，无法创建测试记忆');
        }
    }

    /**
     * 运行完整诊断
     */
    runFullDiagnosis() {
        console.log('[DMSS Debugger] ========== 开始完整诊断 ==========');
        
        this.checkSystemStatus();
        
        setTimeout(() => {
            this.testModals();
        }, 1000);
        
        setTimeout(() => {
            this.testDMSSFunction();
        }, 8000);
        
        setTimeout(() => {
            this.createTestMemory();
        }, 12000);
        
        setTimeout(() => {
            console.log('[DMSS Debugger] ========== 完整诊断完成 ==========');
        }, 15000);
    }
}

// 创建全局调试器实例
window.dmssDebugger = new DMSSDebugger();

// 导出调试器类
window.DMSSDebugger = DMSSDebugger;

console.log('[DMSS Debugger] DMSS调试器已加载');
console.log('[DMSS Debugger] 使用方法:');
console.log('[DMSS Debugger] - window.dmssDebugger.checkSystemStatus() - 检查系统状态');
console.log('[DMSS Debugger] - window.dmssDebugger.testModals() - 测试模态框');
console.log('[DMSS Debugger] - window.dmssDebugger.testDMSSFunction() - 测试DMSS功能');
console.log('[DMSS Debugger] - window.dmssDebugger.createTestMemory() - 创建测试记忆');
console.log('[DMSS Debugger] - window.dmssDebugger.runFullDiagnosis() - 运行完整诊断');
