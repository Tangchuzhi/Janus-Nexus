/**
 * DMSS (Dynamic Memory Stream System) UI模块
 * 动态记忆流系统用户界面 - 提供用户交互和显示功能
 */

class DMSSUI {
    constructor() {
        this.core = null;
        this.isInitialized = false;
        this.memoryViewerModal = null;
        this.settingsModal = null;
    }

    /**
     * 初始化DMSS UI
     */
    init() {
        if (this.isInitialized) {
            console.log('[DMSS UI] UI已初始化');
            return;
        }

        console.log('[DMSS UI] 初始化DMSS UI模块');
        
            // 初始化核心模块
            if (!window.DMSSCore) {
            console.error('[DMSS UI] DMSSCore未找到，请先加载核心模块');
            return;
            }

            this.core = new window.DMSSCore();
        this.setupUI();
            this.isInitialized = true;
            
        console.log('[DMSS UI] DMSS UI模块初始化完成');
    }

    /**
     * 设置UI界面
     */
    setupUI() {
        this.createMemoryViewerModal();
        this.createSettingsModal();
        this.setupEventListeners();
    }

    /**
     * 创建记忆查看器模态框
     */
    createMemoryViewerModal() {
        const modalHtml = `
            <div id="dmss-memory-viewer-modal" class="dmss-modal" style="display: none; position: fixed; z-index: 10000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5);">
                <div class="dmss-modal-content" style="background-color: var(--SmartThemeBodyColor, #fff); margin: 5% auto; padding: 0; border-radius: 8px; max-width: 800px; max-height: 80vh; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                    <div class="dmss-modal-header" style="padding: 15px 20px; border-bottom: 1px solid var(--SmartThemeBorderColor, #ddd); display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0; color: var(--SmartThemeTextColor, #333);"><i class="fa-solid fa-brain"></i> DMSS 记忆查看器</h3>
                        <span class="dmss-close" onclick="document.getElementById('dmss-memory-viewer-modal').style.display='none'" style="font-size: 24px; font-weight: bold; cursor: pointer; color: var(--SmartThemeTextColor, #333);">&times;</span>
                    </div>
                    <div class="dmss-modal-body" style="padding: 20px; max-height: calc(80vh - 120px); overflow-y: auto;">
                        <div class="memory-stats" style="margin-bottom: 15px; padding: 10px; background: var(--SmartThemeChatTintColor, rgba(0,0,0,0.05)); border-radius: 6px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                                <span style="color: var(--SmartThemeTextColor, #333);"><strong>当前聊天记忆:</strong> <span id="current-memory-count">0</span> 条</span>
                                <span style="color: var(--SmartThemeTextColor, #333);"><strong>总聊天数:</strong> <span id="total-chats-count">0</span></span>
                                <span style="color: var(--SmartThemeTextColor, #333);"><strong>总记忆数:</strong> <span id="total-memory-count">0</span></span>
                            </div>
                        </div>
                        
                        <div class="memory-controls" style="margin-bottom: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
                            <button onclick="window.dmssUI.refreshMemoryView()" class="dmss-btn dmss-btn-primary" style="padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; background: #007bff; color: white;">
                                <i class="fa-solid fa-refresh"></i> 刷新
                            </button>
                            <button onclick="window.dmssUI.clearCurrentMemory()" class="dmss-btn dmss-btn-warning" style="padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; background: #ffc107; color: #333;">
                                <i class="fa-solid fa-trash"></i> 清空当前聊天
                            </button>
                            <button onclick="window.dmssUI.clearAllMemory()" class="dmss-btn dmss-btn-danger" style="padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; background: #dc3545; color: white;">
                                <i class="fa-solid fa-trash-alt"></i> 清空所有记忆
                            </button>
                        </div>
                        
                        <div class="memory-list" id="memory-list" style="max-height: 400px; overflow-y: auto;">
                            <div class="no-memory" style="text-align: center; padding: 40px; color: var(--SmartThemeTextColor, #666);">
                                <i class="fa-solid fa-brain" style="font-size: 48px; opacity: 0.3; margin-bottom: 15px;"></i>
                                <p>暂无记忆内容</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 添加到页面
        if (!document.getElementById('dmss-memory-viewer-modal')) {
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }
    }

    /**
     * 创建设置模态框
     */
    createSettingsModal() {
        const modalHtml = `
            <div id="dmss-settings-modal" class="dmss-modal" style="display: none; position: fixed; z-index: 10000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5);">
                <div class="dmss-modal-content" style="background-color: var(--SmartThemeBodyColor, #fff); margin: 10% auto; padding: 0; border-radius: 8px; max-width: 600px; max-height: 70vh; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                    <div class="dmss-modal-header" style="padding: 15px 20px; border-bottom: 1px solid var(--SmartThemeBorderColor, #ddd); display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0; color: var(--SmartThemeTextColor, #333);"><i class="fa-solid fa-gear"></i> DMSS 系统设置</h3>
                        <span class="dmss-close" onclick="document.getElementById('dmss-settings-modal').style.display='none'" style="font-size: 24px; font-weight: bold; cursor: pointer; color: var(--SmartThemeTextColor, #333);">&times;</span>
                    </div>
                    <div class="dmss-modal-body" style="padding: 20px; max-height: calc(70vh - 120px); overflow-y: auto;">
                        <div class="settings-section" style="margin-bottom: 20px;">
                            <h4 style="margin: 0 0 15px 0; color: var(--SmartThemeTextColor, #333);">基本设置</h4>
                            <div class="setting-item" style="margin-bottom: 10px;">
                                <label style="display: flex; align-items: center; gap: 8px; color: var(--SmartThemeTextColor, #333); cursor: pointer;">
                                    <input type="checkbox" id="dmss-auto-enable" checked>
                                    自动启用DMSS
                                </label>
                            </div>
                            <div class="setting-item" style="margin-bottom: 10px;">
                                <label style="display: flex; align-items: center; gap: 8px; color: var(--SmartThemeTextColor, #333); cursor: pointer;">
                                    <input type="checkbox" id="dmss-notifications" checked>
                                    显示通知
                                </label>
                            </div>
                        </div>
                        
                        <div class="settings-section" style="margin-bottom: 20px;">
                            <h4 style="margin: 0 0 15px 0; color: var(--SmartThemeTextColor, #333);">记忆管理</h4>
                            <div class="setting-item" style="margin-bottom: 10px;">
                                <label style="display: block; margin-bottom: 5px; color: var(--SmartThemeTextColor, #333);">最大记忆条数:</label>
                                <input type="number" id="dmss-max-memories" value="100" min="1" max="1000" style="width: 100px; padding: 5px; border: 1px solid var(--SmartThemeBorderColor, #ddd); border-radius: 4px;">
                            </div>
                            <div class="setting-item" style="margin-bottom: 10px;">
                                <label style="display: block; margin-bottom: 5px; color: var(--SmartThemeTextColor, #333);">记忆保留天数:</label>
                                <input type="number" id="dmss-retention-days" value="30" min="1" max="365" style="width: 100px; padding: 5px; border: 1px solid var(--SmartThemeBorderColor, #ddd); border-radius: 4px;">
                            </div>
                        </div>
                        
                        <div class="settings-section" style="margin-bottom: 20px;">
                            <h4 style="margin: 0 0 15px 0; color: var(--SmartThemeTextColor, #333);">高级设置</h4>
                            <div class="setting-item" style="margin-bottom: 10px;">
                                <label style="display: flex; align-items: center; gap: 8px; color: var(--SmartThemeTextColor, #333); cursor: pointer;">
                                    <input type="checkbox" id="dmss-debug-mode">
                                    调试模式
                                </label>
                            </div>
                        </div>
                        
                        <div class="settings-actions" style="margin-top: 20px; text-align: right; display: flex; gap: 10px; justify-content: flex-end;">
                            <button onclick="window.dmssUI.saveSettings()" class="dmss-btn dmss-btn-primary" style="padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; background: #007bff; color: white;">
                                <i class="fa-solid fa-save"></i> 保存设置
                            </button>
                            <button onclick="window.dmssUI.resetSettings()" class="dmss-btn dmss-btn-secondary" style="padding: 8px 16px; border: 1px solid var(--SmartThemeBorderColor, #ddd); border-radius: 4px; cursor: pointer; background: transparent; color: var(--SmartThemeTextColor, #333);">
                                <i class="fa-solid fa-undo"></i> 重置
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 添加到页面
        if (!document.getElementById('dmss-settings-modal')) {
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 监听记忆更新事件
        if (window.eventSource && window.event_types) {
            window.eventSource.on(window.event_types.DMSS_MEMORY_UPDATED, (data) => {
                this.handleMemoryUpdate(data);
            });
        }
    }

    /**
     * 处理记忆更新事件
     * @param {Object} data - 更新数据
     */
    handleMemoryUpdate(data) {
        console.log('[DMSS UI] 记忆更新事件:', data);
        
        // 更新UI显示
        this.updateMemoryStats();
        
        // 如果记忆查看器打开，刷新显示
        if (document.getElementById('dmss-memory-viewer-modal').style.display !== 'none') {
            this.refreshMemoryView();
        }
        
        // 显示通知
        if (window.toastr) {
            toastr.success('新的记忆已保存', 'DMSS', { timeOut: 2000 });
        }
    }

    /**
     * 启动DMSS
     */
    startDMSS() {
        if (!this.core) {
            console.error('[DMSS UI] 核心模块未初始化');
            return;
        }

        this.core.enable();
                this.updateStatusDisplay();
        console.log('[DMSS UI] DMSS已启动');
    }

    /**
     * 停止DMSS
     */
    stopDMSS() {
        if (!this.core) {
            console.error('[DMSS UI] 核心模块未初始化');
            return;
        }

        this.core.disable();
                this.updateStatusDisplay();
        console.log('[DMSS UI] DMSS已停止');
    }

    /**
     * 重置DMSS
     */
    resetDMSS() {
        if (!this.core) {
            console.error('[DMSS UI] 核心模块未初始化');
            return;
        }

        this.core.clearAllMemory();
                this.updateStatusDisplay();
        this.updateMemoryStats();
        console.log('[DMSS UI] DMSS已重置');
    }

    /**
     * 查看记忆内容
     */
    viewMemoryContent() {
        const modal = document.getElementById('dmss-memory-viewer-modal');
        if (modal) {
            this.refreshMemoryView();
            modal.style.display = 'block';
        } else {
            console.error('[DMSS UI] 记忆查看器模态框未找到');
            if (window.toastr) {
                toastr.error('记忆查看器加载失败', 'DMSS', { timeOut: 3000 });
            }
        }
    }

    /**
     * 打开设置
     */
    openSettings() {
        const modal = document.getElementById('dmss-settings-modal');
        if (modal) {
            this.loadSettings();
            modal.style.display = 'block';
        } else {
            console.error('[DMSS UI] 设置模态框未找到');
            if (window.toastr) {
                toastr.error('设置面板加载失败', 'DMSS', { timeOut: 3000 });
            }
        }
    }

    /**
     * 刷新记忆视图
     */
    refreshMemoryView() {
        if (!this.core) return;

        const memoryList = document.getElementById('memory-list');
        if (!memoryList) return;

        const currentMemory = this.core.getCurrentMemory();
        
        if (currentMemory.length === 0) {
            memoryList.innerHTML = `
                <div class="no-memory" style="text-align: center; padding: 40px; color: var(--SmartThemeTextColor, #666);">
                    <i class="fa-solid fa-brain" style="font-size: 48px; opacity: 0.3; margin-bottom: 15px;"></i>
                    <p>当前聊天暂无记忆内容</p>
                </div>
            `;
        } else {
            const memoryHtml = currentMemory.map((entry, index) => `
                <div class="memory-entry" style="border: 1px solid var(--SmartThemeBorderColor, #ddd); border-radius: 6px; padding: 12px; margin-bottom: 10px; background: var(--SmartThemeChatTintColor, rgba(0,0,0,0.02));">
                    <div class="memory-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span class="memory-index" style="font-weight: bold; color: var(--SmartThemeQuoteColor, #007bff);">#${index + 1}</span>
                        <span class="memory-timestamp" style="font-size: 12px; color: var(--SmartThemeTextColor, #666);">${new Date(entry.timestamp).toLocaleString()}</span>
                        </div>
                    <div class="memory-content" style="color: var(--SmartThemeTextColor); line-height: 1.4;">
                        ${this.escapeHtml(entry.content)}
                        </div>
                    </div>
            `).join('');
            
            memoryList.innerHTML = memoryHtml;
        }

        this.updateMemoryStats();
    }

    /**
     * 更新记忆统计信息
     */
    updateMemoryStats() {
        if (!this.core) return;

        const stats = this.core.getMemoryStats();
        
        const currentCount = document.getElementById('current-memory-count');
        const totalChatsCount = document.getElementById('total-chats-count');
        const totalMemoryCount = document.getElementById('total-memory-count');
        
        if (currentCount) currentCount.textContent = this.core.getCurrentMemory().length;
        if (totalChatsCount) totalChatsCount.textContent = stats.totalChats;
        if (totalMemoryCount) totalMemoryCount.textContent = stats.totalEntries;
    }

    /**
     * 更新状态显示
     */
    updateStatusDisplay() {
        if (!this.core) return;

            const statusElement = document.getElementById('dmss-status');
        const toggle = document.getElementById('dmss-main-toggle');
            
            if (statusElement) {
            statusElement.textContent = this.core.getStatus() ? '运行中' : '已停止';
            statusElement.style.color = this.core.getStatus() ? '#28a745' : '#dc3545';
        }
        
        if (toggle) {
            toggle.checked = this.core.getStatus();
        }
    }

    /**
     * 清空当前聊天记忆
     */
    clearCurrentMemory() {
        if (!this.core) return;
        
        if (confirm('确定要清空当前聊天的所有记忆吗？')) {
            this.core.clearMemoryForChat(this.core.currentChatId);
            this.refreshMemoryView();
            
            if (window.toastr) {
                toastr.success('当前聊天记忆已清空', 'DMSS', { timeOut: 2000 });
            }
        }
    }

    /**
     * 清空所有记忆
     */
    clearAllMemory() {
        if (!this.core) return;
        
        if (confirm('确定要清空所有记忆吗？此操作不可恢复！')) {
            this.core.clearAllMemory();
            this.refreshMemoryView();
            
            if (window.toastr) {
                toastr.success('所有记忆已清空', 'DMSS', { timeOut: 2000 });
            }
        }
    }

    /**
     * 加载设置
     */
    loadSettings() {
        // 从extension_settings加载设置
        if (window.extension_settings && window.extension_settings.dmss) {
            const settings = window.extension_settings.dmss.settings || {};
            
            const autoEnable = document.getElementById('dmss-auto-enable');
            const notifications = document.getElementById('dmss-notifications');
            const maxMemories = document.getElementById('dmss-max-memories');
            const retentionDays = document.getElementById('dmss-retention-days');
            const debugMode = document.getElementById('dmss-debug-mode');
            
            if (autoEnable) autoEnable.checked = settings.autoEnable !== false;
            if (notifications) notifications.checked = settings.notifications !== false;
            if (maxMemories) maxMemories.value = settings.maxMemories || 100;
            if (retentionDays) retentionDays.value = settings.retentionDays || 30;
            if (debugMode) debugMode.checked = settings.debugMode || false;
        }
    }

    /**
     * 保存设置
     */
    saveSettings() {
        if (!window.extension_settings) {
            window.extension_settings = {};
        }
        
        if (!window.extension_settings.dmss) {
            window.extension_settings.dmss = {};
        }
        
        const settings = {
            autoEnable: document.getElementById('dmss-auto-enable')?.checked || false,
            notifications: document.getElementById('dmss-notifications')?.checked || false,
            maxMemories: parseInt(document.getElementById('dmss-max-memories')?.value) || 100,
            retentionDays: parseInt(document.getElementById('dmss-retention-days')?.value) || 30,
            debugMode: document.getElementById('dmss-debug-mode')?.checked || false
        };
        
        window.extension_settings.dmss.settings = settings;
        
        // 触发保存
        if (window.saveMetadataDebounced) {
            window.saveMetadataDebounced();
        }

            // 关闭模态框
        document.getElementById('dmss-settings-modal').style.display = 'none';
        
        if (window.toastr) {
            toastr.success('设置已保存', 'DMSS', { timeOut: 2000 });
        }
    }

    /**
     * 重置设置
     */
    resetSettings() {
        if (confirm('确定要重置所有设置为默认值吗？')) {
            const autoEnable = document.getElementById('dmss-auto-enable');
            const notifications = document.getElementById('dmss-notifications');
            const maxMemories = document.getElementById('dmss-max-memories');
            const retentionDays = document.getElementById('dmss-retention-days');
            const debugMode = document.getElementById('dmss-debug-mode');
            
            if (autoEnable) autoEnable.checked = true;
            if (notifications) notifications.checked = true;
            if (maxMemories) maxMemories.value = 100;
            if (retentionDays) retentionDays.value = 30;
            if (debugMode) debugMode.checked = false;
        }
    }

    /**
     * HTML转义
     * @param {string} text - 要转义的文本
     * @returns {string} - 转义后的文本
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 导出DMSS UI类
window.DMSSUI = DMSSUI;

// 创建全局实例引用
window.dmssUI = null;

console.log('[DMSS UI] DMSS UI模块已加载');
