/**
 * DMSS (Dynamic Memory Stream System) UI模块
 * 负责用户界面交互和DMSS内容的展示
 */

class DMSSUI {
    constructor() {
        this.core = null;
        this.isInitialized = false;
        this.viewModal = null;
        this.settingsModal = null;
        
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
        this.core.isEnabled = true;
        this.core.saveSettings();
        
        console.log('[DMSS UI] DMSS系统已启动');
        
        // 显示启动通知
        if (window.toastr) {
            toastr.success('DMSS系统已启动', '系统启动', { timeOut: 2000 });
        }
    }

    /**
     * 停止DMSS系统
     */
    stopDMSS() {
        if (this.core) {
            this.core.stop();
            this.core.isEnabled = false;
            this.core.saveSettings();
            
            console.log('[DMSS UI] DMSS系统已停止');
            
            // 显示停止通知
            if (window.toastr) {
                toastr.info('DMSS系统已停止', '系统停止', { timeOut: 2000 });
            }
        }
    }

    /**
     * 重置DMSS系统
     */
    resetDMSS() {
        if (this.core) {
            this.core.resetAllData();
            console.log('[DMSS UI] DMSS系统已重置');
            
            // 显示重置通知
            if (window.toastr) {
                toastr.warning('DMSS系统已重置', '系统重置', { timeOut: 2000 });
            }
        }
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 监听DMSS更新事件
        window.addEventListener('dmssUpdated', this.handleDMSSUpdate.bind(this));
        
        // 监听聊天切换事件
        window.addEventListener('chatChanged', this.handleChatChange.bind(this));
    }

    /**
     * 处理DMSS更新事件
     */
    handleDMSSUpdate(event) {
        console.log('[DMSS UI] 收到DMSS更新事件:', event.detail);
        
        // 更新状态显示
        this.updateStatusDisplay();
    }

    /**
     * 处理聊天切换事件
     */
    handleChatChange(event) {
        if (this.core) {
            this.core.currentChatId = this.core.getCurrentChatId();
            this.updateStatusDisplay();
        }
    }

    /**
     * 查看记忆内容
     */
    viewMemoryContent() {
        if (!this.core) {
            this.init();
        }
        
        this.showMemoryViewModal();
    }

    /**
     * 显示记忆查看模态框
     */
    showMemoryViewModal() {
        // 如果模态框已存在，先移除
        if (this.viewModal) {
            this.viewModal.remove();
        }
        
        // 获取DMSS记录
        const allRecords = this.core.getAllDMSSRecords();
        const currentChatRecords = this.core.getDMSSRecords();
        
        // 创建模态框HTML
        const modalHTML = this.createMemoryViewModalHTML(allRecords, currentChatRecords);
        
        // 创建模态框元素
        this.viewModal = document.createElement('div');
        this.viewModal.className = 'dmss-memory-modal';
        this.viewModal.innerHTML = modalHTML;
        
        // 添加到页面
        document.body.appendChild(this.viewModal);
        
        // 绑定事件
        this.bindMemoryViewEvents();
        
        // 显示模态框
        setTimeout(() => {
            this.viewModal.classList.add('show');
        }, 10);
        
        console.log('[DMSS UI] 记忆查看界面已打开');
    }

    /**
     * 创建记忆查看模态框HTML
     */
    createMemoryViewModalHTML(allRecords, currentChatRecords) {
        const currentChatId = this.core.getCurrentChatId();
        const status = this.core.getStatus();
        
        return `
            <div class="dmss-modal-overlay">
                <div class="dmss-modal-content">
                    <div class="dmss-modal-header">
                        <h3><i class="fa-solid fa-brain"></i> DMSS 记忆查看</h3>
                        <button class="dmss-modal-close" onclick="window.dmssUI.closeMemoryViewModal()">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="dmss-modal-body">
                        <!-- 系统状态 -->
                        <div class="dmss-status-section">
                            <h4><i class="fa-solid fa-info-circle"></i> 系统状态</h4>
                            <div class="status-grid">
                                <div class="status-item">
                                    <span class="status-label">系统状态:</span>
                                    <span class="status-value ${status.enabled ? 'enabled' : 'disabled'}">
                                        ${status.enabled ? '运行中' : '已停止'}
                                    </span>
                            </div>
                                <div class="status-item">
                                    <span class="status-label">当前聊天:</span>
                                    <span class="status-value">${currentChatId}</span>
                                </div>
                                <div class="status-item">
                                    <span class="status-label">总聊天数:</span>
                                    <span class="status-value">${status.totalChats}</span>
                                </div>
                                <div class="status-item">
                                    <span class="status-label">总记录数:</span>
                                    <span class="status-value">${status.totalRecords}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 标签页切换 -->
                        <div class="dmss-tab-bar">
                            <button class="dmss-tab-btn active" data-tab="current">
                                <i class="fa-solid fa-comment"></i> 当前聊天 (${currentChatRecords.length})
                            </button>
                            <button class="dmss-tab-btn" data-tab="all">
                                <i class="fa-solid fa-list"></i> 所有记录 (${allRecords.length})
                            </button>
                        </div>
                        
                        <!-- 当前聊天记录 -->
                        <div class="dmss-tab-content active" id="current-chat-content">
                            ${this.createRecordsHTML(currentChatRecords, 'current')}
                        </div>
                        
                        <!-- 所有记录 -->
                        <div class="dmss-tab-content" id="all-records-content">
                            ${this.createRecordsHTML(allRecords, 'all')}
                    </div>
                        
                        <!-- 操作按钮 -->
                        <div class="dmss-action-buttons">
                            <button class="dmss-btn primary" onclick="window.dmssUI.exportDMSSData()">
                                <i class="fa-solid fa-download"></i> 导出数据
                            </button>
                            <button class="dmss-btn warning" onclick="window.dmssUI.clearCurrentChatRecords()">
                                <i class="fa-solid fa-trash"></i> 清空当前聊天
                        </button>
                            <button class="dmss-btn danger" onclick="window.dmssUI.clearAllRecords()">
                                <i class="fa-solid fa-exclamation-triangle"></i> 清空所有记录
                        </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 创建记录HTML
     */
    createRecordsHTML(records, type) {
        if (records.length === 0) {
            return `
                <div class="dmss-empty-state">
                    <i class="fa-solid fa-inbox"></i>
                    <p>暂无DMSS记录</p>
                    <small>AI生成包含&lt;DMSS&gt;标签的内容时，系统会自动捕获并存储</small>
                </div>
            `;
        }
        
        return `
            <div class="dmss-records-container">
                ${records.map((record, index) => this.createRecordHTML(record, index, type)).join('')}
            </div>
        `;
    }

    /**
     * 创建单个记录HTML
     */
    createRecordHTML(record, index, type) {
        const timestamp = new Date(record.timestamp).toLocaleString('zh-CN');
        const chatName = type === 'all' ? record.chatName : '';
        
        return `
            <div class="dmss-record-item" data-record-id="${record.id}">
                <div class="record-header">
                    <div class="record-meta">
                        <span class="record-index">#${index + 1}</span>
                        <span class="record-timestamp">${timestamp}</span>
                        ${chatName ? `<span class="record-chat">${chatName}</span>` : ''}
                    </div>
                    <div class="record-actions">
                        <button class="record-action-btn" onclick="window.dmssUI.toggleRecordExpansion('${record.id}')">
                            <i class="fa-solid fa-chevron-down"></i>
                        </button>
                        <button class="record-action-btn" onclick="window.dmssUI.copyRecordContent('${record.id}')">
                            <i class="fa-solid fa-copy"></i>
                        </button>
                    </div>
                </div>
                <div class="record-content collapsed" id="content-${record.id}">
                    <pre class="dmss-content-text">${this.escapeHtml(record.content)}</pre>
                </div>
            </div>
        `;
    }

    /**
     * HTML转义
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 绑定记忆查看事件
     */
    bindMemoryViewEvents() {
        // 标签页切换
        const tabButtons = this.viewModal.querySelectorAll('.dmss-tab-btn');
        const tabContents = this.viewModal.querySelectorAll('.dmss-tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;
                
                // 更新按钮状态
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // 更新内容显示
                tabContents.forEach(content => content.classList.remove('active'));
                this.viewModal.querySelector(`#${tabName === 'current' ? 'current-chat-content' : 'all-records-content'}`).classList.add('active');
            });
        });
        
        // 点击遮罩层关闭
        this.viewModal.querySelector('.dmss-modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeMemoryViewModal();
            }
        });
    }

    /**
     * 关闭记忆查看模态框
     */
    closeMemoryViewModal() {
        if (this.viewModal) {
            this.viewModal.classList.remove('show');
            setTimeout(() => {
                this.viewModal.remove();
                this.viewModal = null;
            }, 300);
        }
    }

    /**
     * 切换记录展开/收起
     */
    toggleRecordExpansion(recordId) {
        const content = document.getElementById(`content-${recordId}`);
        const button = content.parentElement.querySelector('.record-action-btn i');
        
        if (content.classList.contains('collapsed')) {
            content.classList.remove('collapsed');
            button.className = 'fa-solid fa-chevron-up';
            } else {
            content.classList.add('collapsed');
            button.className = 'fa-solid fa-chevron-down';
        }
    }

    /**
     * 复制记录内容
     */
    copyRecordContent(recordId) {
        const content = document.getElementById(`content-${recordId}`);
        const text = content.querySelector('.dmss-content-text').textContent;
        
        navigator.clipboard.writeText(text).then(() => {
            if (window.toastr) {
                toastr.success('内容已复制到剪贴板', '复制成功', { timeOut: 1500 });
            }
        }).catch(err => {
            console.error('复制失败:', err);
            if (window.toastr) {
                toastr.error('复制失败', '错误', { timeOut: 1500 });
            }
        });
    }

    /**
     * 导出DMSS数据
     */
    exportDMSSData() {
        try {
            const storage = this.core.getStorage();
            const dataStr = JSON.stringify(storage, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `dmss_backup_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            if (window.toastr) {
                toastr.success('数据导出成功', '导出完成', { timeOut: 2000 });
            }
        } catch (error) {
            console.error('[DMSS UI] 导出数据失败:', error);
            if (window.toastr) {
                toastr.error('导出失败', '错误', { timeOut: 2000 });
            }
        }
    }

    /**
     * 清空当前聊天记录
     */
    clearCurrentChatRecords() {
        if (confirm('确定要清空当前聊天的所有DMSS记录吗？此操作不可恢复！')) {
            this.core.clearDMSSRecords();
            this.showMemoryViewModal(); // 刷新界面
            if (window.toastr) {
                toastr.warning('当前聊天记录已清空', '清空完成', { timeOut: 2000 });
            }
        }
    }

    /**
     * 清空所有记录
     */
    clearAllRecords() {
        if (confirm('确定要清空所有DMSS记录吗？此操作不可恢复！')) {
            this.core.resetAllData();
            this.showMemoryViewModal(); // 刷新界面
            if (window.toastr) {
                toastr.warning('所有记录已清空', '清空完成', { timeOut: 2000 });
            }
        }
    }

    /**
     * 打开设置
     */
    openSettings() {
        if (!this.core) {
            this.init();
        }
        
        this.showSettingsModal();
    }

    /**
     * 显示设置模态框
     */
    showSettingsModal() {
        // 如果模态框已存在，先移除
        if (this.settingsModal) {
            this.settingsModal.remove();
        }
        
        const status = this.core.getStatus();
        
        // 创建设置模态框HTML
        const modalHTML = `
            <div class="dmss-modal-overlay">
                <div class="dmss-modal-content">
                    <div class="dmss-modal-header">
                        <h3><i class="fa-solid fa-gear"></i> DMSS 系统设置</h3>
                        <button class="dmss-modal-close" onclick="window.dmssUI.closeSettingsModal()">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="dmss-modal-body">
                        <div class="settings-section">
                            <h4><i class="fa-solid fa-toggle-on"></i> 系统控制</h4>
                            <div class="setting-item">
                                <label class="setting-label">
                                    <input type="checkbox" id="dmss-enable-setting" ${status.enabled ? 'checked' : ''}>
                                    <span class="setting-text">启用DMSS系统</span>
                                </label>
                                <p class="setting-description">启用后系统将自动捕获AI生成的DMSS内容</p>
                            </div>
                        </div>
                        
                        <div class="settings-section">
                            <h4><i class="fa-solid fa-database"></i> 数据管理</h4>
                            <div class="setting-item">
                                <button class="dmss-btn primary" onclick="window.dmssUI.exportDMSSData()">
                                    <i class="fa-solid fa-download"></i> 导出所有数据
                                </button>
                                <p class="setting-description">将DMSS数据导出为JSON文件</p>
                            </div>
                            <div class="setting-item">
                                <button class="dmss-btn warning" onclick="window.dmssUI.clearAllRecords()">
                                    <i class="fa-solid fa-trash"></i> 清空所有记录
                                </button>
                                <p class="setting-description">删除所有存储的DMSS记录</p>
                            </div>
                        </div>
                        
                        <div class="settings-section">
                            <h4><i class="fa-solid fa-info-circle"></i> 系统信息</h4>
                            <div class="info-grid">
                                <div class="info-item">
                                    <span class="info-label">版本:</span>
                                    <span class="info-value">1.0.0</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">总聊天数:</span>
                                    <span class="info-value">${status.totalChats}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">总记录数:</span>
                                    <span class="info-value">${status.totalRecords}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">最后更新:</span>
                                    <span class="info-value">${new Date(status.lastUpdated).toLocaleString('zh-CN')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 创建模态框元素
        this.settingsModal = document.createElement('div');
        this.settingsModal.className = 'dmss-settings-modal';
        this.settingsModal.innerHTML = modalHTML;
        
        // 添加到页面
        document.body.appendChild(this.settingsModal);
        
        // 绑定事件
        this.bindSettingsEvents();
        
        // 显示模态框
        setTimeout(() => {
            this.settingsModal.classList.add('show');
        }, 10);
    }

    /**
     * 绑定设置事件
     */
    bindSettingsEvents() {
        // 启用/禁用开关
        const enableCheckbox = this.settingsModal.querySelector('#dmss-enable-setting');
        enableCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.startDMSS();
            } else {
                this.stopDMSS();
            }
        });
        
        // 点击遮罩层关闭
        this.settingsModal.querySelector('.dmss-modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeSettingsModal();
            }
        });
    }

    /**
     * 关闭设置模态框
     */
    closeSettingsModal() {
        if (this.settingsModal) {
            this.settingsModal.classList.remove('show');
            setTimeout(() => {
                this.settingsModal.remove();
                this.settingsModal = null;
            }, 300);
        }
    }

    /**
     * 更新状态显示
     */
    updateStatusDisplay() {
        if (!this.core) return;
        
        const status = this.core.getStatus();
        const statusElement = document.getElementById('dmss-status');
        const lastUpdateElement = document.getElementById('dmss-last-update');
        
        if (statusElement) {
            statusElement.textContent = status.enabled ? '运行中' : '已停止';
            statusElement.style.color = status.enabled ? '#28a745' : '#dc3545';
        }
        
        if (lastUpdateElement) {
            lastUpdateElement.textContent = status.lastUpdated ? 
                new Date(status.lastUpdated).toLocaleString('zh-CN') : '从未';
        }
    }
}

// 创建全局实例
window.DMSSUI = DMSSUI;
window.dmssUI = new DMSSUI();

console.log('[DMSS UI] 模块加载完成');
