/**
 * DMSS (Dynamic Memory Stream System) UI模块
 * 负责显示和管理动态记忆流的用户界面
 */

class DMSSUI {
    constructor() {
        this.core = null;
        this.isInitialized = false;
        this.memoryViewerModal = null;
        
        console.log('[DMSS UI] 初始化完成');
    }

    /**
     * 初始化DMSS UI
     */
    init() {
        if (this.isInitialized) return;
        
        this.core = new DMSSCore();
        this.core.init();
        
        this.setupEventListeners();
        this.isInitialized = true;
        
        console.log('[DMSS UI] UI初始化完成');
    }

    /**
     * 启动DMSS系统
     */
    startDMSS() {
        if (!this.core) {
            this.init();
        }
        
        this.core.start();
        this.updateStatusDisplay();
        
        console.log('[DMSS UI] DMSS系统已启动');
    }

    /**
     * 停止DMSS系统
     */
    stopDMSS() {
        if (this.core) {
            this.core.stop();
            this.updateStatusDisplay();
        }
        
        console.log('[DMSS UI] DMSS系统已停止');
    }

    /**
     * 重置DMSS系统
     */
    resetDMSS() {
        if (this.core) {
            this.core.reset();
            this.updateStatusDisplay();
        }
        
        console.log('[DMSS UI] DMSS系统已重置');
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 监听记忆更新事件
        window.addEventListener('dmssMemoryUpdated', (event) => {
            this.updateStatusDisplay();
        });
    }

    /**
     * 更新状态显示
     */
    updateStatusDisplay() {
        if (!this.core) return;
        
        const status = this.core.getStatus();
        
        // 更新状态元素
        const statusElement = document.getElementById('dmss-status');
        const lastUpdateElement = document.getElementById('dmss-last-update');
        
        if (statusElement) {
            statusElement.textContent = status.isEnabled ? '运行中' : '已停止';
            statusElement.style.color = status.isEnabled ? '#28a745' : '#dc3545';
        }
        
        if (lastUpdateElement) {
            if (status.lastUpdate === '从未') {
                lastUpdateElement.textContent = '从未';
            } else {
                const updateTime = new Date(status.lastUpdate);
                lastUpdateElement.textContent = updateTime.toLocaleString('zh-CN');
            }
        }
    }

    /**
     * 查看记忆内容
     */
    viewMemoryContent() {
        if (!this.core) {
            toastr.info('请先启用DMSS系统', '提示', { timeOut: 2000 });
            return;
        }
        
        this.showMemoryViewer();
    }

    /**
     * 显示记忆查看器
     */
    showMemoryViewer() {
        // 如果模态框已存在，先移除
        if (this.memoryViewerModal) {
            this.memoryViewerModal.remove();
        }
        
        // 创建模态框
        this.memoryViewerModal = this.createMemoryViewerModal();
        
        // 添加到页面
        document.body.appendChild(this.memoryViewerModal);
        
        // 显示模态框
        setTimeout(() => {
            this.memoryViewerModal.classList.add('show');
        }, 10);
        
        // 加载记忆数据
        this.loadMemoryData();
    }

    /**
     * 创建记忆查看器模态框
     */
    createMemoryViewerModal() {
        const modal = document.createElement('div');
        modal.className = 'dmss-memory-viewer-modal';
        modal.innerHTML = `
            <div class="dmss-modal-backdrop"></div>
            <div class="dmss-modal-content">
                <div class="dmss-modal-header">
                    <h3><i class="fa-solid fa-brain"></i> DMSS 记忆查看器</h3>
                    <button class="dmss-modal-close" onclick="window.dmssUI.closeMemoryViewer()">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </div>
                
                <div class="dmss-modal-body">
                    <div class="dmss-memory-controls">
                        <div class="dmss-chat-selector">
                            <label>选择聊天:</label>
                            <select id="dmss-chat-selector" onchange="window.dmssUI.switchChat()">
                                <option value="">加载中...</option>
                            </select>
                        </div>
                        
                        <div class="dmss-memory-actions">
                            <button onclick="window.dmssUI.refreshMemoryData()" class="dmss-action-btn">
                                <i class="fa-solid fa-refresh"></i> 刷新
                            </button>
                            <button onclick="window.dmssUI.clearCurrentChatMemories()" class="dmss-action-btn warning-btn">
                                <i class="fa-solid fa-trash"></i> 清空当前聊天
                            </button>
                        </div>
                    </div>
                    
                    <div class="dmss-memory-stats">
                        <div class="stat-item">
                            <span class="stat-label">总聊天数:</span>
                            <span id="dmss-total-chats" class="stat-value">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">当前聊天记忆:</span>
                            <span id="dmss-current-memories" class="stat-value">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">总记忆数:</span>
                            <span id="dmss-total-memories" class="stat-value">0</span>
                        </div>
                    </div>
                    
                    <div class="dmss-memory-list" id="dmss-memory-list">
                        <div class="dmss-loading">
                            <i class="fa-solid fa-spinner fa-spin"></i>
                            <p>正在加载记忆数据...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        return modal;
    }

    /**
     * 加载记忆数据
     */
    loadMemoryData() {
        if (!this.core) return;
        
        const allMemories = this.core.getAllMemories();
        const currentChatId = this.core.getCurrentChatId();
        
        // 更新统计信息
        this.updateMemoryStats(allMemories);
        
        // 更新聊天选择器
        this.updateChatSelector(allMemories, currentChatId);
        
        // 加载当前聊天的记忆
        this.loadCurrentChatMemories(currentChatId);
    }

    /**
     * 更新记忆统计信息
     */
    updateMemoryStats(allMemories) {
        const totalChats = allMemories.length;
        const totalMemories = allMemories.reduce((sum, chat) => sum + chat.memories.length, 0);
        const currentChatMemories = this.core.getMemoriesForChat();
        
        document.getElementById('dmss-total-chats').textContent = totalChats;
        document.getElementById('dmss-current-memories').textContent = currentChatMemories.length;
        document.getElementById('dmss-total-memories').textContent = totalMemories;
    }

    /**
     * 更新聊天选择器
     */
    updateChatSelector(allMemories, currentChatId) {
        const selector = document.getElementById('dmss-chat-selector');
        if (!selector) return;
        
        selector.innerHTML = '';
        
        if (allMemories.length === 0) {
            selector.innerHTML = '<option value="">暂无记忆数据</option>';
            return;
        }
        
        allMemories.forEach(chat => {
            const option = document.createElement('option');
            option.value = chat.chatId;
            option.textContent = `${chat.chatName} (${chat.memories.length}条记忆)`;
            option.selected = chat.chatId === currentChatId;
            selector.appendChild(option);
        });
    }

    /**
     * 加载指定聊天的记忆
     */
    loadCurrentChatMemories(chatId) {
        const memories = this.core.getMemoriesForChat(chatId);
        const memoryList = document.getElementById('dmss-memory-list');
        
        if (!memoryList) return;
        
        if (memories.length === 0) {
            memoryList.innerHTML = `
                <div class="dmss-no-memories">
                    <i class="fa-solid fa-inbox"></i>
                    <p>该聊天暂无DMSS记忆数据</p>
                </div>
            `;
            return;
        }
        
        // 按时间倒序排列
        const sortedMemories = memories.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        const memoriesHTML = sortedMemories.map(memory => `
            <div class="dmss-memory-item" data-memory-id="${memory.id}">
                <div class="dmss-memory-header">
                    <div class="dmss-memory-meta">
                        <span class="dmss-memory-time">${new Date(memory.timestamp).toLocaleString('zh-CN')}</span>
                        <span class="dmss-memory-id">ID: ${memory.id}</span>
                    </div>
                    <div class="dmss-memory-actions">
                        <button onclick="window.dmssUI.deleteMemory('${memory.id}')" class="dmss-delete-btn" title="删除记忆">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="dmss-memory-content">
                    <pre>${this.escapeHtml(memory.content)}</pre>
                </div>
            </div>
        `).join('');
        
        memoryList.innerHTML = memoriesHTML;
    }

    /**
     * 切换聊天
     */
    switchChat() {
        const selector = document.getElementById('dmss-chat-selector');
        if (!selector) return;
        
        const selectedChatId = selector.value;
        if (selectedChatId) {
            this.loadCurrentChatMemories(selectedChatId);
        }
    }

    /**
     * 刷新记忆数据
     */
    refreshMemoryData() {
        this.loadMemoryData();
        toastr.success('记忆数据已刷新', '刷新成功', { timeOut: 1500 });
    }

    /**
     * 删除指定记忆
     */
    deleteMemory(memoryId) {
        if (!confirm('确定要删除这条记忆吗？')) return;
        
        const success = this.core.deleteMemory(memoryId);
        if (success) {
            toastr.success('记忆已删除', '删除成功', { timeOut: 1500 });
            this.loadMemoryData();
        } else {
            toastr.error('删除失败', '删除失败', { timeOut: 2000 });
        }
    }

    /**
     * 清空当前聊天的所有记忆
     */
    clearCurrentChatMemories() {
        const currentChatId = this.core.getCurrentChatId();
        const memories = this.core.getMemoriesForChat(currentChatId);
        
        if (memories.length === 0) {
            toastr.info('当前聊天没有记忆数据', '提示', { timeOut: 2000 });
            return;
        }
        
        if (!confirm(`确定要清空当前聊天的所有 ${memories.length} 条记忆吗？此操作不可恢复！`)) {
            return;
        }
        
        const success = this.core.clearChatMemories(currentChatId);
        if (success) {
            toastr.success('当前聊天记忆已清空', '清空成功', { timeOut: 2000 });
            this.loadMemoryData();
        } else {
            toastr.error('清空失败', '清空失败', { timeOut: 2000 });
        }
    }

    /**
     * 关闭记忆查看器
     */
    closeMemoryViewer() {
        if (this.memoryViewerModal) {
            this.memoryViewerModal.classList.remove('show');
            setTimeout(() => {
                this.memoryViewerModal.remove();
                this.memoryViewerModal = null;
            }, 300);
        }
    }

    /**
     * 转义HTML字符
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 打开设置界面
     */
    openSettings() {
        toastr.info('设置功能开发中...', '提示', { timeOut: 2000 });
    }
}

// 添加DMSS UI样式
const dmssStyles = `
<style>
/* DMSS 记忆查看器模态框样式 */
.dmss-memory-viewer-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
}

.dmss-memory-viewer-modal.show {
    opacity: 1;
    visibility: visible;
}

.dmss-modal-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(2px);
}

.dmss-modal-content {
    position: relative;
    width: 90%;
    max-width: 1000px;
    max-height: 80vh;
    background: var(--SmartThemeBodyColor, #ffffff);
    border: 1px solid var(--SmartThemeBorderColor, #ddd);
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    transform: scale(0.9);
    transition: transform 0.3s ease;
}

.dmss-memory-viewer-modal.show .dmss-modal-content {
    transform: scale(1);
}

.dmss-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 25px;
    border-bottom: 1px solid var(--SmartThemeBorderColor, #ddd);
    background: var(--SmartThemeChatTintColor, rgba(0, 0, 0, 0.05));
    border-radius: 12px 12px 0 0;
}

.dmss-modal-header h3 {
    margin: 0;
    color: var(--SmartThemeTextColor, #333);
    font-size: 18px;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 8px;
}

.dmss-modal-close {
    background: none;
    border: none;
    color: var(--SmartThemeTextColor, #666);
    font-size: 18px;
    cursor: pointer;
    padding: 5px;
    border-radius: 4px;
    transition: all 0.3s ease;
}

.dmss-modal-close:hover {
    background: var(--SmartThemeChatTintColor, rgba(0, 0, 0, 0.1));
    color: var(--SmartThemeTextColor, #333);
}

.dmss-modal-body {
    flex: 1;
    padding: 25px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

/* 记忆控制面板 */
.dmss-memory-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 15px;
    padding: 15px;
    background: var(--SmartThemeChatTintColor, rgba(0, 0, 0, 0.05));
    border: 1px solid var(--SmartThemeBorderColor, rgba(0, 0, 0, 0.1));
    border-radius: 8px;
}

.dmss-chat-selector {
    display: flex;
    align-items: center;
    gap: 10px;
}

.dmss-chat-selector label {
    color: var(--SmartThemeTextColor, #333);
    font-weight: bold;
    font-size: 14px;
}

.dmss-chat-selector select {
    padding: 8px 12px;
    border: 1px solid var(--SmartThemeBorderColor, #ddd);
    border-radius: 6px;
    background: var(--SmartThemeBodyColor, #fff);
    color: var(--SmartThemeTextColor, #333);
    font-size: 14px;
    min-width: 200px;
}

.dmss-memory-actions {
    display: flex;
    gap: 10px;
}

.dmss-action-btn {
    padding: 8px 16px;
    border: 1px solid var(--SmartThemeBorderColor, #ddd);
    background: var(--SmartThemeBodyColor, #fff);
    color: var(--SmartThemeTextColor, #333);
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 6px;
}

.dmss-action-btn:hover {
    background: var(--SmartThemeChatTintColor, rgba(0, 0, 0, 0.1));
    border-color: var(--SmartThemeQuoteColor, #007bff);
}

.dmss-action-btn.warning-btn {
    background: rgba(255, 193, 7, 0.1);
    border-color: #ffc107;
    color: #ffc107;
}

.dmss-action-btn.warning-btn:hover {
    background: rgba(255, 193, 7, 0.2);
}

/* 记忆统计信息 */
.dmss-memory-stats {
    display: flex;
    justify-content: space-around;
    padding: 15px;
    background: var(--SmartThemeChatTintColor, rgba(0, 0, 0, 0.05));
    border: 1px solid var(--SmartThemeBorderColor, rgba(0, 0, 0, 0.1));
    border-radius: 8px;
    flex-wrap: wrap;
    gap: 15px;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 120px;
}

.stat-label {
    font-size: 12px;
    color: var(--SmartThemeTextColor, #666);
    margin-bottom: 4px;
}

.stat-value {
    font-size: 16px;
    font-weight: bold;
    color: var(--SmartThemeTextColor, #333);
}

/* 记忆列表 */
.dmss-memory-list {
    flex: 1;
    overflow-y: auto;
    max-height: 400px;
}

.dmss-loading {
    text-align: center;
    padding: 40px;
    color: var(--SmartThemeTextColor, #666);
}

.dmss-loading i {
    font-size: 24px;
    margin-bottom: 10px;
    color: var(--SmartThemeQuoteColor, #007bff);
}

.dmss-no-memories {
    text-align: center;
    padding: 40px;
    color: var(--SmartThemeTextColor, #666);
}

.dmss-no-memories i {
    font-size: 48px;
    margin-bottom: 15px;
    opacity: 0.5;
}

/* 记忆条目 */
.dmss-memory-item {
    background: var(--SmartThemeBodyColor, #fff);
    border: 1px solid var(--SmartThemeBorderColor, #ddd);
    border-radius: 8px;
    margin-bottom: 15px;
    overflow: hidden;
    transition: all 0.3s ease;
}

.dmss-memory-item:hover {
    border-color: var(--SmartThemeQuoteColor, #007bff);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dmss-memory-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 15px;
    background: var(--SmartThemeChatTintColor, rgba(0, 0, 0, 0.05));
    border-bottom: 1px solid var(--SmartThemeBorderColor, rgba(0, 0, 0, 0.1));
}

.dmss-memory-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.dmss-memory-time {
    font-size: 13px;
    color: var(--SmartThemeTextColor, #333);
    font-weight: bold;
}

.dmss-memory-id {
    font-size: 11px;
    color: var(--SmartThemeTextColor, #666);
    font-family: monospace;
}

.dmss-memory-actions {
    display: flex;
    gap: 5px;
}

.dmss-delete-btn {
    background: none;
    border: none;
    color: #dc3545;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.3s ease;
    font-size: 12px;
}

.dmss-delete-btn:hover {
    background: rgba(220, 53, 69, 0.1);
}

.dmss-memory-content {
    padding: 15px;
}

.dmss-memory-content pre {
    margin: 0;
    padding: 0;
    background: none;
    border: none;
    color: var(--SmartThemeTextColor, #333);
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-wrap: break-word;
    max-height: 200px;
    overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .dmss-modal-content {
        width: 95%;
        max-height: 90vh;
    }
    
    .dmss-memory-controls {
        flex-direction: column;
        align-items: stretch;
    }
    
    .dmss-chat-selector {
        justify-content: space-between;
    }
    
    .dmss-chat-selector select {
        min-width: auto;
        flex: 1;
    }
    
    .dmss-memory-stats {
        flex-direction: column;
        gap: 10px;
    }
    
    .stat-item {
        flex-direction: row;
        justify-content: space-between;
        min-width: auto;
    }
}
</style>
`;

// 将样式添加到页面
if (!document.getElementById('dmss-ui-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'dmss-ui-styles';
    styleElement.innerHTML = dmssStyles;
    document.head.appendChild(styleElement);
}

// 创建全局实例
window.DMSSUI = DMSSUI;
window.dmssUI = new DMSSUI();

console.log('[DMSS UI] 模块加载完成');
