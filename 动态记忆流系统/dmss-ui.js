/**
 * DMSS (Dynamic Memory Stream System) UI界面模块
 * 负责提供用户界面和交互功能
 */

class DMSSUI {
    constructor() {
        this.core = window.DMSSCore;
        this.isInitialized = false;
        this.memoryViewerModal = null;
        this.settingsModal = null;
    }

    /**
     * 初始化DMSS UI
     */
    init() {
        if (this.isInitialized) return;
        
        console.log('[DMSS UI] 初始化DMSS UI界面');
        this.createStyles();
        this.setupEventListeners();
        this.isInitialized = true;
    }
    
    /**
     * 创建样式
     */
    createStyles() {
        const styleId = 'dmss-ui-styles';
        if (document.getElementById(styleId)) return;
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* DMSS 记忆查看器模态框样式 */
            .dmss-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                z-index: 10000;
                display: none;
                align-items: center;
                justify-content: center;
            }
            
            .dmss-modal.show {
                display: flex;
            }
            
            .dmss-modal-content {
                background: var(--SmartThemeBodyColor, #fff);
                border-radius: 12px;
                width: 90%;
                max-width: 800px;
                max-height: 80vh;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                display: flex;
                flex-direction: column;
            }
            
            .dmss-modal-header {
                padding: 20px;
                border-bottom: 1px solid var(--SmartThemeBorderColor, #ddd);
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: var(--SmartThemeChatTintColor, rgba(0, 0, 0, 0.05));
            }
            
            .dmss-modal-title {
                font-size: 18px;
                font-weight: bold;
                color: var(--SmartThemeTextColor);
                margin: 0;
            }
            
            .dmss-modal-close {
                background: none;
                border: none;
                font-size: 24px;
                color: var(--SmartThemeTextColor);
                cursor: pointer;
                padding: 5px;
                border-radius: 4px;
                transition: background-color 0.3s;
            }
            
            .dmss-modal-close:hover {
                background: var(--SmartThemeChatTintColor, rgba(0, 0, 0, 0.1));
            }
            
            .dmss-modal-body {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }
            
            .dmss-modal-footer {
                padding: 15px 20px;
                border-top: 1px solid var(--SmartThemeBorderColor, #ddd);
                background: var(--SmartThemeChatTintColor, rgba(0, 0, 0, 0.05));
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }
            
            /* 记忆列表样式 */
            .dmss-memory-list {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            
            .dmss-memory-item {
                background: var(--SmartThemeChatTintColor, rgba(0, 0, 0, 0.05));
                border: 1px solid var(--SmartThemeBorderColor, rgba(0, 0, 0, 0.1));
                border-radius: 8px;
                padding: 15px;
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
                margin-bottom: 10px;
            }
            
            .dmss-memory-meta {
                display: flex;
                gap: 15px;
                font-size: 12px;
                color: var(--SmartThemeTextColor);
                opacity: 0.7;
            }
            
            .dmss-memory-actions {
                display: flex;
                gap: 8px;
            }
            
            .dmss-action-btn {
                padding: 4px 8px;
                border: 1px solid var(--SmartThemeBorderColor, rgba(0, 0, 0, 0.2));
                background: var(--SmartThemeChatTintColor, rgba(0, 0, 0, 0.1));
                color: var(--SmartThemeTextColor);
                border-radius: 4px;
                cursor: pointer;
                font-size: 11px;
                transition: all 0.3s ease;
            }
            
            .dmss-action-btn:hover {
                background: var(--SmartThemeQuoteColor, rgba(0, 123, 255, 0.1));
                border-color: var(--SmartThemeQuoteColor, #007bff);
            }
            
            .dmss-action-btn.delete:hover {
                background: rgba(220, 53, 69, 0.1);
                border-color: #dc3545;
                color: #dc3545;
            }
            
            .dmss-memory-content {
                color: var(--SmartThemeTextColor);
                line-height: 1.6;
                font-size: 14px;
                white-space: pre-wrap;
                word-break: break-word;
            }
            
            .dmss-memory-content.collapsed {
                max-height: 100px;
                overflow: hidden;
                position: relative;
            }
            
            .dmss-memory-content.collapsed::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 30px;
                background: linear-gradient(transparent, var(--SmartThemeBodyColor, #fff));
            }
            
            .dmss-expand-btn {
                background: none;
                border: none;
                color: var(--SmartThemeQuoteColor, #007bff);
                cursor: pointer;
                font-size: 12px;
                padding: 5px 0;
                margin-top: 5px;
            }
            
            .dmss-expand-btn:hover {
                text-decoration: underline;
            }
            
            /* 空状态样式 */
            .dmss-empty-state {
                text-align: center;
                padding: 40px 20px;
                color: var(--SmartThemeTextColor);
                opacity: 0.6;
            }
            
            .dmss-empty-state i {
                font-size: 48px;
                margin-bottom: 15px;
                opacity: 0.3;
            }
            
            .dmss-empty-state h3 {
                margin: 0 0 10px 0;
                font-size: 18px;
            }
            
            .dmss-empty-state p {
                margin: 0;
                font-size: 14px;
            }
            
            /* 统计信息样式 */
            .dmss-stats {
                display: flex;
                gap: 20px;
                margin-bottom: 20px;
                padding: 15px;
                background: var(--SmartThemeChatTintColor, rgba(0, 0, 0, 0.05));
                border-radius: 8px;
                border: 1px solid var(--SmartThemeBorderColor, rgba(0, 0, 0, 0.1));
            }
            
            .dmss-stat-item {
                text-align: center;
                flex: 1;
            }
            
            .dmss-stat-value {
                font-size: 24px;
                font-weight: bold;
                color: var(--SmartThemeQuoteColor, #007bff);
                margin-bottom: 5px;
            }
            
            .dmss-stat-label {
                font-size: 12px;
                color: var(--SmartThemeTextColor);
                opacity: 0.7;
            }
            
            /* 聊天选择器样式 */
            .dmss-chat-selector {
                margin-bottom: 20px;
            }
            
            .dmss-chat-selector select {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid var(--SmartThemeBorderColor, #ddd);
                border-radius: 6px;
                background: var(--SmartThemeBodyColor, #fff);
                color: var(--SmartThemeTextColor);
                font-size: 14px;
            }
            
            .dmss-chat-selector label {
                display: block;
                margin-bottom: 8px;
                font-size: 14px;
                font-weight: bold;
                color: var(--SmartThemeTextColor);
            }
            
            /* 按钮样式 */
            .dmss-btn {
                padding: 8px 16px;
                border: 1px solid var(--SmartThemeBorderColor, #ddd);
                background: var(--SmartThemeBodyColor, #fff);
                color: var(--SmartThemeTextColor);
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.3s ease;
            }
            
            .dmss-btn:hover {
                background: var(--SmartThemeChatTintColor, rgba(0, 0, 0, 0.05));
            }
            
            .dmss-btn.primary {
                background: var(--SmartThemeQuoteColor, #007bff);
                color: white;
                border-color: var(--SmartThemeQuoteColor, #007bff);
            }
            
            .dmss-btn.primary:hover {
                background: var(--SmartThemeQuoteColor, #0056b3);
            }
            
            .dmss-btn.danger {
                background: #dc3545;
                color: white;
                border-color: #dc3545;
            }
            
            .dmss-btn.danger:hover {
                background: #c82333;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 监听记忆更新事件
        window.addEventListener('dmssMemoryUpdate', (event) => {
            console.log('[DMSS UI] 收到记忆更新事件:', event.detail);
            this.updateMemoryViewer();
        });
        
        // 监听聊天切换事件
        window.addEventListener('chatChanged', () => {
            console.log('[DMSS UI] 检测到聊天切换');
            this.updateMemoryViewer();
        });
    }
    
    /**
     * 启动DMSS系统
     */
    startDMSS() {
        this.core.enable();
        console.log('[DMSS UI] DMSS系统已启动');
    }
    
    /**
     * 停止DMSS系统
     */
    stopDMSS() {
        this.core.disable();
        console.log('[DMSS UI] DMSS系统已停止');
    }
    
    /**
     * 重置DMSS系统
     */
    resetDMSS() {
        this.core.reset();
        console.log('[DMSS UI] DMSS系统已重置');
    }

    /**
     * 查看记忆内容
     */
    viewMemoryContent() {
        this.showMemoryViewer();
    }
    
    /**
     * 显示记忆查看器
     */
    showMemoryViewer() {
        if (this.memoryViewerModal) {
            this.memoryViewerModal.remove();
        }
        
        this.memoryViewerModal = this.createMemoryViewerModal();
        document.body.appendChild(this.memoryViewerModal);
        
        // 显示模态框
        setTimeout(() => {
            this.memoryViewerModal.classList.add('show');
        }, 10);
        
        // 加载记忆数据
        this.updateMemoryViewer();
    }
    
    /**
     * 创建记忆查看器模态框
     */
    createMemoryViewerModal() {
        const modal = document.createElement('div');
        modal.className = 'dmss-modal';
        modal.innerHTML = `
            <div class="dmss-modal-content">
                <div class="dmss-modal-header">
                    <h3 class="dmss-modal-title">
                        <i class="fa-solid fa-brain"></i> DMSS 记忆查看器
                    </h3>
                    <button class="dmss-modal-close" onclick="window.DMSSUI.closeMemoryViewer()">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </div>
                <div class="dmss-modal-body">
                    <div class="dmss-stats" id="dmss-stats">
                        <div class="dmss-stat-item">
                            <div class="dmss-stat-value" id="total-memories">0</div>
                            <div class="dmss-stat-label">总记忆数</div>
                        </div>
                        <div class="dmss-stat-item">
                            <div class="dmss-stat-value" id="current-chat-memories">0</div>
                            <div class="dmss-stat-label">当前聊天</div>
                        </div>
                        <div class="dmss-stat-item">
                            <div class="dmss-stat-value" id="total-chats">0</div>
                            <div class="dmss-stat-label">聊天数量</div>
                        </div>
                    </div>
                    
                    <div class="dmss-chat-selector">
                        <label for="dmss-chat-select">选择聊天:</label>
                        <select id="dmss-chat-select" onchange="window.DMSSUI.switchChat(this.value)">
                            <option value="current">当前聊天</option>
                            <option value="all">所有聊天</option>
                        </select>
                    </div>
                    
                    <div id="dmss-memory-container">
                        <div class="dmss-empty-state">
                            <i class="fa-solid fa-brain"></i>
                            <h3>暂无记忆内容</h3>
                            <p>DMSS系统将自动捕获AI生成的记忆内容</p>
                        </div>
                    </div>
                </div>
                <div class="dmss-modal-footer">
                    <button class="dmss-btn" onclick="window.DMSSUI.refreshMemories()">
                        <i class="fa-solid fa-refresh"></i> 刷新
                    </button>
                    <button class="dmss-btn danger" onclick="window.DMSSUI.clearCurrentChatMemories()">
                        <i class="fa-solid fa-trash"></i> 清空当前聊天
                    </button>
                    <button class="dmss-btn" onclick="window.DMSSUI.closeMemoryViewer()">
                        关闭
                    </button>
                        </div>
                    </div>
                `;
        
        return modal;
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
     * 更新记忆查看器
     */
    updateMemoryViewer() {
        if (!this.memoryViewerModal) return;
        
        this.updateStats();
        this.updateMemoryList();
    }
    
    /**
     * 更新统计信息
     */
    updateStats() {
                const status = this.core.getStatus();
        const allMemories = this.core.getAllMemories();
        const currentMemories = this.core.getMemoriesForChat();
        
        const totalMemoriesEl = document.getElementById('total-memories');
        const currentChatMemoriesEl = document.getElementById('current-chat-memories');
        const totalChatsEl = document.getElementById('total-chats');
        
        if (totalMemoriesEl) totalMemoriesEl.textContent = allMemories.length;
        if (currentChatMemoriesEl) currentChatMemoriesEl.textContent = currentMemories.length;
        if (totalChatsEl) totalChatsEl.textContent = status.totalChats;
    }
    
    /**
     * 更新记忆列表
     */
    updateMemoryList() {
        const container = document.getElementById('dmss-memory-container');
        if (!container) return;
        
        const memories = this.core.getMemoriesForChat();
        
        if (memories.length === 0) {
            container.innerHTML = `
                <div class="dmss-empty-state">
                    <i class="fa-solid fa-brain"></i>
                    <h3>暂无记忆内容</h3>
                    <p>DMSS系统将自动捕获AI生成的记忆内容</p>
            </div>
        `;
            return;
        }
        
        const memoriesHTML = memories.map(memory => this.createMemoryItemHTML(memory)).join('');
        container.innerHTML = `<div class="dmss-memory-list">${memoriesHTML}</div>`;
    }
    
    /**
     * 创建记忆项HTML
     */
    createMemoryItemHTML(memory) {
        const date = new Date(memory.timestamp).toLocaleString();
        const isLongContent = memory.content.length > 200;
        
        return `
            <div class="dmss-memory-item">
                <div class="dmss-memory-header">
                    <div class="dmss-memory-meta">
                        <span><i class="fa-solid fa-clock"></i> ${date}</span>
                        <span><i class="fa-solid fa-hashtag"></i> ${memory.id}</span>
                    </div>
                    <div class="dmss-memory-actions">
                        <button class="dmss-action-btn" onclick="window.DMSSUI.copyMemory('${memory.id}')" title="复制内容">
                            <i class="fa-solid fa-copy"></i>
                        </button>
                        <button class="dmss-action-btn delete" onclick="window.DMSSUI.deleteMemory('${memory.id}')" title="删除记忆">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="dmss-memory-content ${isLongContent ? 'collapsed' : ''}" id="content-${memory.id}">
                    ${this.escapeHtml(memory.content)}
                </div>
                ${isLongContent ? `
                    <button class="dmss-expand-btn" onclick="window.DMSSUI.toggleMemoryContent('${memory.id}')">
                        展开更多
                    </button>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * 切换记忆内容展开/收起
     */
    toggleMemoryContent(memoryId) {
        const contentEl = document.getElementById(`content-${memoryId}`);
        const expandBtn = contentEl.nextElementSibling;
        
        if (contentEl.classList.contains('collapsed')) {
            contentEl.classList.remove('collapsed');
            expandBtn.textContent = '收起';
        } else {
            contentEl.classList.add('collapsed');
            expandBtn.textContent = '展开更多';
        }
    }
    
    /**
     * 复制记忆内容
     */
    copyMemory(memoryId) {
        const memories = this.core.getMemoriesForChat();
        const memory = memories.find(m => m.id === memoryId);
        
        if (memory) {
            navigator.clipboard.writeText(memory.content).then(() => {
                toastr.success('记忆内容已复制到剪贴板', '复制成功', { timeOut: 2000 });
            }).catch(() => {
                toastr.error('复制失败', '复制失败', { timeOut: 2000 });
            });
        }
    }

    /**
     * 删除记忆
     */
    deleteMemory(memoryId) {
        if (confirm('确定要删除这条记忆吗？')) {
            const deleted = this.core.deleteMemory(memoryId);
            if (deleted) {
                toastr.success('记忆已删除', '删除成功', { timeOut: 2000 });
                this.updateMemoryViewer();
            } else {
                toastr.error('删除失败', '删除失败', { timeOut: 2000 });
            }
        }
    }

    /**
     * 刷新记忆
     */
    refreshMemories() {
        this.updateMemoryViewer();
        toastr.success('记忆列表已刷新', '刷新成功', { timeOut: 2000 });
    }
    
    /**
     * 清空当前聊天记忆
     */
    clearCurrentChatMemories() {
        if (confirm('确定要清空当前聊天的所有记忆吗？此操作不可恢复！')) {
            const cleared = this.core.clearChatMemories();
            if (cleared) {
                toastr.success('当前聊天记忆已清空', '清空成功', { timeOut: 2000 });
                this.updateMemoryViewer();
            } else {
                toastr.error('清空失败', '清空失败', { timeOut: 2000 });
            }
        }
    }
    
    /**
     * 切换聊天
     */
    switchChat(chatId) {
        // 这里可以实现切换不同聊天的记忆显示
        console.log('[DMSS UI] 切换聊天:', chatId);
        this.updateMemoryViewer();
    }
    
    /**
     * 打开设置
     */
    openSettings() {
        toastr.info('设置功能开发中...', '提示', { timeOut: 2000 });
    }

    /**
     * HTML转义
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 创建全局实例
window.DMSSUI = new DMSSUI();

console.log('[DMSS UI] DMSS UI模块已加载完成');
