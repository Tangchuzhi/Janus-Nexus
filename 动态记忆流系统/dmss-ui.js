/**
 * DMSS UI 界面模块
 * 提供用户界面交互功能
 */

class DMSSUI {
    constructor() {
        this.core = null;
        this.isInitialized = false;
        this.memoryListContainer = null;
        this.settingsModal = null;
        
        console.log('[DMSS UI] UI模块已初始化');
    }

    /**
     * 初始化DMSS UI
     */
    init() {
        if (this.isInitialized) {
            console.log('[DMSS UI] UI已初始化');
            return;
        }

        // 创建核心实例
        this.core = new DMSSCore();
        
        // 设置事件监听
        this.setupEventListeners();
        
        this.isInitialized = true;
        console.log('[DMSS UI] UI初始化完成');
    }

    /**
     * 启动DMSS系统
     */
    async startDMSS() {
        if (!this.core) {
            this.init();
        }
        
        this.core.start();
        await this.refreshMemoryList();
        this.updateStatusDisplay();
        
        console.log('[DMSS UI] DMSS系统已启动');
    }

    /**
     * 停止DMSS系统
     */
    stopDMSS() {
        if (this.core) {
            this.core.stop();
        }
        this.updateStatusDisplay();
        
        console.log('[DMSS UI] DMSS系统已停止');
    }

    /**
     * 重置DMSS系统
     */
    async resetDMSS() {
        if (this.core) {
            await this.core.clearAllMemories();
            this.core.reset();
        }
        await this.refreshMemoryList();
        this.updateStatusDisplay();
        
        console.log('[DMSS UI] DMSS系统已重置');
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 监听消息事件（当有新消息时处理DMSS内容）
        if (window.addEventListener) {
            window.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'chat_message') {
                    this.handleNewMessage(event.data.content);
                }
            });
        }
    }

    /**
     * 处理新消息
     */
    async handleNewMessage(messageContent) {
        if (this.core && this.core.isEnabled) {
            await this.core.processMessage(messageContent);
            await this.refreshMemoryList();
            this.updateStatusDisplay();
        }
    }

    /**
     * 查看记忆内容
     */
    viewMemoryContent() {
        this.showMemoryModal();
    }

    /**
     * 显示记忆内容模态框
     */
    showMemoryModal() {
        const memories = this.core ? this.core.getAllMemories() : [];
        
        const modalHtml = `
            <div id="dmss-memory-modal" class="dmss-modal">
                <div class="dmss-modal-content">
                    <div class="dmss-modal-header">
                        <h3><i class="fa-solid fa-brain"></i> DMSS记忆库</h3>
                        <button class="dmss-modal-close" onclick="this.closest('.dmss-modal').remove()">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>
                    <div class="dmss-modal-body">
                        <div class="memory-stats">
                            <div class="stat-item">
                                <span class="stat-label">总记忆数:</span>
                                <span class="stat-value">${memories.length}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">最后更新:</span>
                                <span class="stat-value">${this.core ? new Date(this.core.stats.lastUpdate).toLocaleString() : '从未'}</span>
                            </div>
                        </div>
                        <div class="memory-list">
                            ${this.renderMemoryList(memories)}
                        </div>
                    </div>
                    <div class="dmss-modal-footer">
                        <button class="dmss-btn secondary" onclick="window.dmssUI.refreshMemoryList()">
                            <i class="fa-solid fa-refresh"></i> 刷新
                        </button>
                        <button class="dmss-btn warning" onclick="window.dmssUI.clearAllMemories()">
                            <i class="fa-solid fa-trash"></i> 清空所有
                        </button>
                        <button class="dmss-btn primary" onclick="this.closest('.dmss-modal').remove()">
                            <i class="fa-solid fa-check"></i> 关闭
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // 移除已存在的模态框
        const existingModal = document.getElementById('dmss-memory-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // 添加新模态框
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    /**
     * 渲染记忆列表
     */
    renderMemoryList(memories) {
        if (memories.length === 0) {
            return `
                <div class="no-memories">
                    <i class="fa-solid fa-brain"></i>
                    <p>暂无记忆内容</p>
                </div>
            `;
        }

        return memories.map(memory => `
            <div class="memory-item" data-key="${memory.key}">
                <div class="memory-header">
                    <div class="memory-key">${memory.key}</div>
                    <div class="memory-timestamp">${new Date(memory.timestamp).toLocaleString()}</div>
                    <button class="memory-delete-btn" onclick="window.dmssUI.deleteMemory('${memory.key}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
                <div class="memory-content">
                    <div class="memory-summary">
                        <strong>摘要:</strong> ${memory.summary}
                    </div>
                    <div class="memory-full-content" style="display: none;">
                        <strong>完整内容:</strong>
                        <div class="memory-text">${memory.content}</div>
                    </div>
                </div>
                <div class="memory-actions">
                    <button class="memory-toggle-btn" onclick="window.dmssUI.toggleMemoryContent('${memory.key}')">
                        <i class="fa-solid fa-eye"></i> 查看详情
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * 切换记忆内容显示
     */
    toggleMemoryContent(memoryKey) {
        const memoryItem = document.querySelector(`[data-key="${memoryKey}"]`);
        if (!memoryItem) return;

        const fullContent = memoryItem.querySelector('.memory-full-content');
        const toggleBtn = memoryItem.querySelector('.memory-toggle-btn');
        const icon = toggleBtn.querySelector('i');

        if (fullContent.style.display === 'none') {
            fullContent.style.display = 'block';
            icon.className = 'fa-solid fa-eye-slash';
            toggleBtn.innerHTML = '<i class="fa-solid fa-eye-slash"></i> 隐藏详情';
        } else {
            fullContent.style.display = 'none';
            icon.className = 'fa-solid fa-eye';
            toggleBtn.innerHTML = '<i class="fa-solid fa-eye"></i> 查看详情';
        }
    }

    /**
     * 删除单个记忆
     */
    async deleteMemory(memoryKey) {
        if (confirm(`确定要删除记忆 "${memoryKey}" 吗？`)) {
            if (this.core) {
                await this.core.deleteMemoryEntry(memoryKey);
                await this.refreshMemoryList();
                this.updateStatusDisplay();
            }
        }
    }

    /**
     * 清空所有记忆
     */
    async clearAllMemories() {
        if (confirm('确定要清空所有记忆吗？此操作不可恢复！')) {
            if (this.core) {
                await this.core.clearAllMemories();
                await this.refreshMemoryList();
                this.updateStatusDisplay();
            }
        }
    }

    /**
     * 刷新记忆列表
     */
    async refreshMemoryList() {
        if (this.core) {
            await this.core.loadMemoryEntries();
            this.updateStatusDisplay();
        }
    }

    /**
     * 打开设置
     */
    openSettings() {
        this.showSettingsModal();
    }

    /**
     * 显示设置模态框
     */
    showSettingsModal() {
        const settingsHtml = `
            <div id="dmss-settings-modal" class="dmss-modal">
                <div class="dmss-modal-content">
                    <div class="dmss-modal-header">
                        <h3><i class="fa-solid fa-gear"></i> DMSS系统设置</h3>
                        <button class="dmss-modal-close" onclick="this.closest('.dmss-modal').remove()">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>
                    <div class="dmss-modal-body">
                        <div class="settings-section">
                            <h4>记忆管理</h4>
                            <div class="setting-item">
                                <label>自动处理消息:</label>
                                <input type="checkbox" id="auto-process" checked>
                            </div>
                            <div class="setting-item">
                                <label>最大记忆数量:</label>
                                <input type="number" id="max-memories" value="100" min="10" max="1000">
                            </div>
                        </div>
                        <div class="settings-section">
                            <h4>相关性匹配</h4>
                            <div class="setting-item">
                                <label>匹配阈值:</label>
                                <input type="range" id="match-threshold" min="0.1" max="1" step="0.1" value="0.3">
                                <span id="threshold-value">0.3</span>
                            </div>
                        </div>
                    </div>
                    <div class="dmss-modal-footer">
                        <button class="dmss-btn secondary" onclick="this.closest('.dmss-modal').remove()">
                            <i class="fa-solid fa-times"></i> 取消
                        </button>
                        <button class="dmss-btn primary" onclick="window.dmssUI.saveSettings()">
                            <i class="fa-solid fa-save"></i> 保存设置
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // 移除已存在的模态框
        const existingModal = document.getElementById('dmss-settings-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // 添加新模态框
        document.body.insertAdjacentHTML('beforeend', settingsHtml);
        
        // 设置滑块事件
        const thresholdSlider = document.getElementById('match-threshold');
        const thresholdValue = document.getElementById('threshold-value');
        if (thresholdSlider && thresholdValue) {
            thresholdSlider.addEventListener('input', (e) => {
                thresholdValue.textContent = e.target.value;
            });
        }
    }

    /**
     * 保存设置
     */
    saveSettings() {
        // 这里可以保存设置到本地存储
        console.log('[DMSS UI] 设置已保存');
        
        // 关闭模态框
        const modal = document.getElementById('dmss-settings-modal');
        if (modal) {
            modal.remove();
        }
    }

    /**
     * 更新状态显示
     */
    updateStatusDisplay() {
        const statusElement = document.getElementById('dmss-status');
        const lastUpdateElement = document.getElementById('dmss-last-update');
        
        if (statusElement) {
            const isEnabled = this.core ? this.core.isEnabled : false;
            statusElement.textContent = isEnabled ? '运行中' : '已停止';
            statusElement.style.color = isEnabled ? '#28a745' : '#dc3545';
        }
        
        if (lastUpdateElement && this.core) {
            const stats = this.core.getStats();
            lastUpdateElement.textContent = stats.lastUpdate ? 
                new Date(stats.lastUpdate).toLocaleString() : '从未';
        }
    }

    /**
     * 手动处理当前消息
     */
    async processCurrentMessage() {
        if (!this.core || !this.core.isEnabled) {
            console.log('[DMSS UI] 系统未启用');
            return;
        }

        try {
            // 获取最后一条消息
            const lastMessage = await this.getLastMessage();
            if (lastMessage) {
                await this.core.processMessage(lastMessage);
                await this.refreshMemoryList();
                this.updateStatusDisplay();
                console.log('[DMSS UI] 已处理当前消息');
            }
        } catch (error) {
            console.error('[DMSS UI] 处理消息失败:', error);
        }
    }

    /**
     * 获取最后一条消息
     */
    async getLastMessage() {
        try {
            // 这里需要与酒馆的消息系统集成
            // 目前返回模拟数据
            return null;
        } catch (error) {
            console.error('[DMSS UI] 获取最后消息失败:', error);
            return null;
        }
    }
}

// 导出UI类
window.DMSSUI = DMSSUI;
