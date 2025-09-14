/**
 * DMSS UI模块
 * 动态记忆流系统用户界面
 */

class DMSSUI {
    constructor() {
        this.core = null;
        this.isInitialized = false;
        this.currentModal = null;
        this.settings = {
            autoCapture: true,
            showNotifications: true,
            debugMode: false
        };
        
        this.init();
    }

    /**
     * 初始化DMSS UI
     */
    init() {
        console.log('[DMSS UI] 初始化用户界面');
        this.loadSettings();
        this.setupEventListeners();
        this.isInitialized = true;
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 监听DMSS核心更新事件
        document.addEventListener('dmssUpdate', (event) => {
            this.updateStatusDisplay(event.detail);
        });

        // 监听聊天切换
        document.addEventListener('chatChanged', () => {
            this.refreshMemoryDisplay();
        });
    }

    /**
     * 启动DMSS
     */
    startDMSS() {
        if (!this.core) {
            this.core = new DMSSCore();
        }
        
        this.core.start();
        this.updateStatusDisplay({
            enabled: true,
            chatId: this.core.getCurrentChatId()
        });
        
        console.log('[DMSS UI] DMSS已启动');
    }

    /**
     * 停止DMSS
     */
    stopDMSS() {
        if (this.core) {
            this.core.stop();
        }
        
        this.updateStatusDisplay({
            enabled: false,
            chatId: null
        });
        
        console.log('[DMSS UI] DMSS已停止');
    }

    /**
     * 重置DMSS
     */
    async resetDMSS() {
        if (this.core) {
            await this.core.reset();
        }
        
        this.updateStatusDisplay({
            enabled: false,
            chatId: null
        });
        
        console.log('[DMSS UI] DMSS已重置');
    }

    /**
     * 查看记忆内容
     */
    async viewMemoryContent() {
        if (!this.core) {
            this.showNotification('请先启用DMSS系统', 'warning');
            return;
        }

        try {
            const memoryContent = await this.core.getCurrentMemory();
            const stats = await this.core.getMemoryStats();
            
            this.showMemoryModal(memoryContent, stats);
        } catch (error) {
            console.error('[DMSS UI] 获取记忆内容失败:', error);
            this.showNotification('获取记忆内容失败', 'error');
        }
    }

    /**
     * 显示记忆内容模态框
     */
    showMemoryModal(content, stats) {
        const modalId = 'dmss-memory-modal';
        this.closeModal(modalId);

        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'dmss-modal';
        modal.innerHTML = `
            <div class="dmss-modal-content">
                <div class="dmss-modal-header">
                    <h3><i class="fa-solid fa-brain"></i> DMSS记忆内容</h3>
                    <button class="dmss-modal-close" onclick="window.dmssUI.closeModal('${modalId}')">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </div>
                
                <div class="dmss-modal-body">
                    <div class="dmss-stats-panel">
                        <div class="stat-item">
                            <span class="stat-label">总行数:</span>
                            <span class="stat-value">${stats.totalLines}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">档案条目:</span>
                            <span class="stat-value">${stats.archiveCount}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">备用条目:</span>
                            <span class="stat-value">${stats.standbyCount}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">最后更新:</span>
                            <span class="stat-value">${stats.lastUpdated ? stats.lastUpdated.toLocaleString() : '无'}</span>
                        </div>
                    </div>
                    
                    <div class="dmss-content-editor">
                        <div class="editor-toolbar">
                            <button onclick="window.dmssUI.saveMemoryContent()" class="dmss-btn primary">
                                <i class="fa-solid fa-save"></i> 保存
                            </button>
                            <button onclick="window.dmssUI.exportMemoryContent()" class="dmss-btn secondary">
                                <i class="fa-solid fa-download"></i> 导出
                            </button>
                            <button onclick="window.dmssUI.clearMemoryContent()" class="dmss-btn warning">
                                <i class="fa-solid fa-trash"></i> 清空
                            </button>
                        </div>
                        
                        <textarea id="dmss-content-textarea" class="dmss-content-textarea" placeholder="DMSS记忆内容将显示在这里...">${content}</textarea>
                    </div>
                </div>
                
                <div class="dmss-modal-footer">
                    <button onclick="window.dmssUI.closeModal('${modalId}')" class="dmss-btn">
                        <i class="fa-solid fa-times"></i> 关闭
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.currentModal = modalId;
        
        // 添加样式
        this.addModalStyles();
    }

    /**
     * 保存记忆内容
     */
    async saveMemoryContent() {
        const textarea = document.getElementById('dmss-content-textarea');
        if (!textarea || !this.core) return;

        const content = textarea.value.trim();
        if (!content) {
            this.showNotification('内容不能为空', 'warning');
            return;
        }

        try {
            // 验证DMSS格式
            if (!content.includes('<DMSS>') || !content.includes('</DMSS>')) {
                this.showNotification('内容必须包含DMSS标签', 'warning');
                return;
            }

            // 手动处理内容
            await this.core.processText(content);
            
            this.showNotification('记忆内容已保存', 'success');
            this.closeModal('dmss-memory-modal');
        } catch (error) {
            console.error('[DMSS UI] 保存记忆内容失败:', error);
            this.showNotification('保存失败', 'error');
        }
    }

    /**
     * 导出记忆内容
     */
    exportMemoryContent() {
        const textarea = document.getElementById('dmss-content-textarea');
        if (!textarea) return;

        const content = textarea.value;
        const chatId = this.core ? this.core.getCurrentChatId() : 'unknown';
        const filename = `dmss_memory_${chatId}_${new Date().toISOString().split('T')[0]}.txt`;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        this.showNotification('记忆内容已导出', 'success');
    }

    /**
     * 清空记忆内容
     */
    async clearMemoryContent() {
        if (!confirm('确定要清空所有记忆内容吗？此操作不可撤销。')) {
            return;
        }

        try {
            if (this.core) {
                await this.core.reset();
            }
            
            const textarea = document.getElementById('dmss-content-textarea');
            if (textarea) {
                textarea.value = '';
            }
            
            this.showNotification('记忆内容已清空', 'success');
        } catch (error) {
            console.error('[DMSS UI] 清空记忆内容失败:', error);
            this.showNotification('清空失败', 'error');
        }
    }

    /**
     * 打开设置
     */
    openSettings() {
        const modalId = 'dmss-settings-modal';
        this.closeModal(modalId);

        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'dmss-modal';
        modal.innerHTML = `
            <div class="dmss-modal-content">
                <div class="dmss-modal-header">
                    <h3><i class="fa-solid fa-gear"></i> DMSS设置</h3>
                    <button class="dmss-modal-close" onclick="window.dmssUI.closeModal('${modalId}')">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </div>
                
                <div class="dmss-modal-body">
                    <div class="dmss-settings-panel">
                        <div class="setting-item">
                            <label class="dmss-toggle-label">
                                <input type="checkbox" id="auto-capture-setting" ${this.settings.autoCapture ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                                <span class="toggle-text">自动捕获DMSS内容</span>
                            </label>
                            <p class="setting-description">启用后，系统会自动捕获AI生成的DMSS标签内容</p>
                        </div>
                        
                        <div class="setting-item">
                            <label class="dmss-toggle-label">
                                <input type="checkbox" id="show-notifications-setting" ${this.settings.showNotifications ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                                <span class="toggle-text">显示通知</span>
                            </label>
                            <p class="setting-description">启用后，系统操作会显示通知消息</p>
                        </div>
                        
                        <div class="setting-item">
                            <label class="dmss-toggle-label">
                                <input type="checkbox" id="debug-mode-setting" ${this.settings.debugMode ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                                <span class="toggle-text">调试模式</span>
                            </label>
                            <p class="setting-description">启用后，会在控制台显示详细的调试信息</p>
                        </div>
                    </div>
                </div>
                
                <div class="dmss-modal-footer">
                    <button onclick="window.dmssUI.saveSettings()" class="dmss-btn primary">
                        <i class="fa-solid fa-save"></i> 保存设置
                    </button>
                    <button onclick="window.dmssUI.closeModal('${modalId}')" class="dmss-btn">
                        <i class="fa-solid fa-times"></i> 取消
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.currentModal = modalId;
        
        // 添加样式
        this.addModalStyles();
    }

    /**
     * 保存设置
     */
    saveSettings() {
        const autoCapture = document.getElementById('auto-capture-setting').checked;
        const showNotifications = document.getElementById('show-notifications-setting').checked;
        const debugMode = document.getElementById('debug-mode-setting').checked;

        this.settings = {
            autoCapture,
            showNotifications,
            debugMode
        };

        this.saveSettingsToStorage();
        
        if (this.core) {
            this.core.setDebugMode(debugMode);
        }

        this.showNotification('设置已保存', 'success');
        this.closeModal('dmss-settings-modal');
    }

    /**
     * 关闭模态框
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
        }
        
        if (this.currentModal === modalId) {
            this.currentModal = null;
        }
    }

    /**
     * 更新状态显示
     */
    updateStatusDisplay(detail) {
        const statusElement = document.getElementById('dmss-status');
        const currentChatElement = document.getElementById('dmss-current-chat');
        const memoryCountElement = document.getElementById('dmss-memory-count');

        if (statusElement) {
            statusElement.textContent = detail.enabled ? '运行中' : '已停止';
            statusElement.style.color = detail.enabled ? '#28a745' : '#dc3545';
        }

        if (currentChatElement) {
            const chatId = detail.chatId;
            currentChatElement.textContent = chatId ? chatId.substring(0, 8) + '...' : '-';
        }

        // 异步更新记忆条数
        this.updateMemoryCount();
    }

    /**
     * 更新记忆条数
     */
    async updateMemoryCount() {
        const memoryCountElement = document.getElementById('dmss-memory-count');
        if (!memoryCountElement || !this.core) return;

        try {
            const stats = await this.core.getMemoryStats();
            memoryCountElement.textContent = stats.archiveCount + stats.standbyCount;
        } catch (error) {
            memoryCountElement.textContent = '0';
        }
    }

    /**
     * 刷新记忆显示
     */
    async refreshMemoryDisplay() {
        await this.updateMemoryCount();
    }

    /**
     * 显示通知
     */
    showNotification(message, type = 'info') {
        if (!this.settings.showNotifications) return;

        // 使用toastr或自定义通知
        if (typeof toastr !== 'undefined') {
            toastr[type](message);
        } else {
            console.log(`[DMSS UI] ${type.toUpperCase()}: ${message}`);
        }
    }

    /**
     * 加载设置
     */
    loadSettings() {
        try {
            const settings = localStorage.getItem('dmss_ui_settings');
            if (settings) {
                this.settings = { ...this.settings, ...JSON.parse(settings) };
            }
        } catch (error) {
            console.error('[DMSS UI] 加载设置失败:', error);
        }
    }

    /**
     * 保存设置到存储
     */
    saveSettingsToStorage() {
        try {
            localStorage.setItem('dmss_ui_settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('[DMSS UI] 保存设置失败:', error);
        }
    }

    /**
     * 添加模态框样式
     */
    addModalStyles() {
        if (document.getElementById('dmss-modal-styles')) return;

        const style = document.createElement('style');
        style.id = 'dmss-modal-styles';
        style.textContent = `
            .dmss-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .dmss-modal-content {
                background: var(--SmartThemeBodyColor, #fff);
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                max-width: 90vw;
                max-height: 90vh;
                width: 800px;
                display: flex;
                flex-direction: column;
            }

            .dmss-modal-header {
                padding: 20px;
                border-bottom: 1px solid var(--SmartThemeBorderColor, #ddd);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .dmss-modal-header h3 {
                margin: 0;
                color: var(--SmartThemeTextColor, #333);
            }

            .dmss-modal-close {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: var(--SmartThemeTextColor, #666);
                padding: 5px;
            }

            .dmss-modal-body {
                padding: 20px;
                flex: 1;
                overflow-y: auto;
            }

            .dmss-modal-footer {
                padding: 20px;
                border-top: 1px solid var(--SmartThemeBorderColor, #ddd);
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }

            .dmss-stats-panel {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
                padding: 15px;
                background: var(--SmartThemeChatTintColor, rgba(0, 0, 0, 0.05));
                border-radius: 6px;
            }

            .stat-item {
                text-align: center;
            }

            .stat-label {
                display: block;
                font-size: 12px;
                color: var(--SmartThemeTextColor, #666);
                margin-bottom: 5px;
            }

            .stat-value {
                display: block;
                font-size: 16px;
                font-weight: bold;
                color: var(--SmartThemeTextColor, #333);
            }

            .dmss-content-editor {
                margin-top: 20px;
            }

            .editor-toolbar {
                display: flex;
                gap: 10px;
                margin-bottom: 10px;
                padding: 10px;
                background: var(--SmartThemeChatTintColor, rgba(0, 0, 0, 0.05));
                border-radius: 6px;
            }

            .dmss-content-textarea {
                width: 100%;
                height: 400px;
                padding: 15px;
                border: 1px solid var(--SmartThemeBorderColor, #ddd);
                border-radius: 6px;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.4;
                resize: vertical;
                background: var(--SmartThemeBodyColor, #fff);
                color: var(--SmartThemeTextColor, #333);
            }

            .dmss-settings-panel {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }

            .setting-item {
                padding: 15px;
                border: 1px solid var(--SmartThemeBorderColor, #ddd);
                border-radius: 6px;
                background: var(--SmartThemeChatTintColor, rgba(0, 0, 0, 0.05));
            }

            .setting-description {
                margin: 8px 0 0 0;
                font-size: 12px;
                color: var(--SmartThemeTextColor, #666);
                opacity: 0.8;
            }

            .dmss-btn {
                padding: 8px 16px;
                border: 1px solid var(--SmartThemeBorderColor, #ddd);
                border-radius: 4px;
                background: var(--SmartThemeBodyColor, #fff);
                color: var(--SmartThemeTextColor, #333);
                cursor: pointer;
                font-size: 12px;
                transition: all 0.3s ease;
                display: inline-flex;
                align-items: center;
                gap: 5px;
            }

            .dmss-btn:hover {
                background: var(--SmartThemeChatTintColor, rgba(0, 0, 0, 0.1));
            }

            .dmss-btn.primary {
                background: #007bff;
                color: white;
                border-color: #007bff;
            }

            .dmss-btn.primary:hover {
                background: #0056b3;
            }

            .dmss-btn.secondary {
                background: #6c757d;
                color: white;
                border-color: #6c757d;
            }

            .dmss-btn.secondary:hover {
                background: #545b62;
            }

            .dmss-btn.warning {
                background: #ffc107;
                color: #212529;
                border-color: #ffc107;
            }

            .dmss-btn.warning:hover {
                background: #e0a800;
            }
        `;

        document.head.appendChild(style);
    }
}

// 导出到全局
if (typeof window !== 'undefined') {
    window.DMSSUI = DMSSUI;
}

console.log('[DMSS UI] 动态记忆流系统用户界面模块已加载');
