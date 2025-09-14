/**
 * DMSS (动态记忆流系统) UI界面
 * 提供用户交互界面和控制功能
 */

class DMSSUI {
    constructor(dmssCore) {
        this.dmssCore = dmssCore;
        this.isVisible = false;
        this.currentView = 'main'; 
        
        console.log('[DMSS UI] 界面模块初始化完成');
    }

    /**
     * 创建DMSS界面HTML
     */
    createInterface() {
        return `
            <h4 style="text-align: center;"><i class="fa-solid fa-brain"></i> 动态记忆流系统 (DMSS)</h4>
            
            <div class="dmss-interface">
                <!-- 主控制面板 -->
                <div class="dmss-control-panel">
                    <div class="dmss-header">
                        <div class="dmss-status-indicator" id="dmss-status">
                            <span class="status-dot offline"></span>
                            <span class="status-text">离线</span>
                        </div>
                    </div>
                    
                    <!-- 主按钮区域 -->
                    <div class="dmss-main-buttons">
                        <button class="dmss-btn primary" id="dmss-start-btn" onclick="window.dmssUI.toggleSystem()">
                            <i class="fa-solid fa-play"></i> 启动DMSS
                        </button>
                        <button class="dmss-btn secondary" id="dmss-settings-btn" onclick="window.dmssUI.showSettings()">
                            <i class="fa-solid fa-cog"></i> 设置
                        </button>
                        <button class="dmss-btn secondary" id="dmss-memory-btn" onclick="window.dmssUI.showMemory()">
                            <i class="fa-solid fa-database"></i> 记忆库
                        </button>
                        <button class="dmss-btn secondary" id="dmss-summary-btn" onclick="window.dmssUI.showSummary()">
                            <i class="fa-solid fa-file-text"></i> 总结
                        </button>
                    </div>
                    
                    <!-- 状态信息 -->
                    <div class="dmss-status-info" id="dmss-status-info">
                        <div class="status-item">
                            <span class="label">当前聊天:</span>
                            <span class="value" id="current-chat-id">未连接</span>
                        </div>
                        <div class="status-item">
                            <span class="label">记忆数量:</span>
                            <span class="value" id="memory-count">0</span>
                        </div>
                        <div class="status-item">
                            <span class="label">注入状态:</span>
                            <span class="value" id="injection-status">未启用</span>
                        </div>
                    </div>
                </div>
                
                <!-- 设置面板 -->
                <div class="dmss-panel" id="dmss-settings-panel" style="display: none;">
                    <div class="panel-header">
                        <h5><i class="fa-solid fa-cog"></i> DMSS设置</h5>
                        <button class="close-btn" onclick="window.dmssUI.hideSettings()">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>
                    <div class="panel-content">
                        <div class="setting-group">
                            <label>相似度阈值</label>
                            <input type="range" id="similarity-threshold" min="0.1" max="1" step="0.1" value="0.7">
                            <span class="range-value">0.7</span>
                        </div>
                        <div class="setting-group">
                            <label>最大检索结果</label>
                            <input type="number" id="max-results" min="1" max="20" value="5">
                        </div>
                        <div class="setting-group">
                            <label>最大注入Token数</label>
                            <input type="number" id="max-tokens" min="100" max="5000" value="2000">
                        </div>
                        <div class="setting-group">
                            <label>自动注入</label>
                            <input type="checkbox" id="auto-injection" checked>
                        </div>
                        <div class="setting-actions">
                            <button class="dmss-btn primary" onclick="window.dmssUI.saveSettings()">
                                <i class="fa-solid fa-save"></i> 保存设置
                            </button>
                            <button class="dmss-btn secondary" onclick="window.dmssUI.resetSettings()">
                                <i class="fa-solid fa-undo"></i> 重置
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- 记忆库面板 -->
                <div class="dmss-panel" id="dmss-memory-panel" style="display: none;">
                    <div class="panel-header">
                        <h5><i class="fa-solid fa-database"></i> 记忆库管理</h5>
                        <button class="close-btn" onclick="window.dmssUI.hideMemory()">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>
                    <div class="panel-content">
                        <div class="memory-controls">
                            <button class="dmss-btn primary" onclick="window.dmssUI.addCurrentChatMemory()">
                                <i class="fa-solid fa-plus"></i> 添加当前聊天记忆
                            </button>
                            <button class="dmss-btn secondary" onclick="window.dmssUI.addLastCharacterMessage()">
                                <i class="fa-solid fa-comment"></i> 添加最后角色消息
                            </button>
                            <button class="dmss-btn secondary" onclick="window.dmssUI.debugSystem()">
                                <i class="fa-solid fa-bug"></i> 调试系统
                            </button>
                            <button class="dmss-btn secondary" onclick="window.dmssUI.clearAllMemories()">
                                <i class="fa-solid fa-trash"></i> 清空记忆库
                            </button>
                        </div>
                        <div class="memory-list" id="memory-list">
                            <div class="no-memories">暂无记忆数据</div>
                        </div>
                    </div>
                </div>
                
                <!-- 总结面板 -->
                <div class="dmss-panel" id="dmss-summary-panel" style="display: none;">
                    <div class="panel-header">
                        <h5><i class="fa-solid fa-file-text"></i> 内容总结</h5>
                        <button class="close-btn" onclick="window.dmssUI.hideSummary()">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>
                    <div class="panel-content">
                        <div class="summary-controls">
                            <button class="dmss-btn primary" onclick="window.dmssUI.generateCurrentChatSummary()">
                                <i class="fa-solid fa-magic"></i> 总结当前聊天
                            </button>
                            <button class="dmss-btn secondary" onclick="window.dmssUI.setSummaryTemplate()">
                                <i class="fa-solid fa-edit"></i> 设置总结模板
                            </button>
                        </div>
                        <div class="summary-result" id="summary-result">
                            <div class="no-summary">点击"总结当前聊天"开始生成总结</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>
            .dmss-interface {
                padding: 10px;
                background: var(--SmartThemeChatTintColor, rgba(255, 255, 255, 0.05));
                border-radius: 8px;
                border: 1px solid var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.1));
            }
            
            .dmss-control-panel {
                margin-bottom: 15px;
            }
            
            .dmss-header {
                display: flex;
                justify-content: flex-end;
                align-items: center;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.1));
            }
            
            .dmss-status-indicator {
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 12px;
            }
            
            .status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                display: inline-block;
            }
            
            .status-dot.online {
                background-color: #28a745;
                box-shadow: 0 0 4px #28a745;
            }
            
            .status-dot.offline {
                background-color: #dc3545;
            }
            
            .status-text {
                color: var(--SmartThemeTextColor);
                opacity: 0.8;
            }
            
            .dmss-main-buttons {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                margin-bottom: 15px;
            }
            
            .dmss-btn {
                padding: 8px 12px;
                border: 1px solid var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.2));
                background: var(--SmartThemeChatTintColor, rgba(255, 255, 255, 0.1));
                color: var(--SmartThemeTextColor);
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 5px;
            }
            
            .dmss-btn:hover {
                background: var(--SmartThemeQuoteColor, rgba(0, 123, 255, 0.1));
                border-color: var(--SmartThemeQuoteColor, #007bff);
            }
            
            .dmss-btn.primary {
                background: var(--SmartThemeQuoteColor, rgba(0, 123, 255, 0.2));
                border-color: var(--SmartThemeQuoteColor, #007bff);
                font-weight: bold;
            }
            
            .dmss-btn.primary:hover {
                background: var(--SmartThemeQuoteColor, rgba(0, 123, 255, 0.3));
            }
            
            .dmss-status-info {
                background: var(--SmartThemeChatTintColor, rgba(255, 255, 255, 0.05));
                border-radius: 4px;
                padding: 10px;
                font-size: 11px;
            }
            
            .status-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
            }
            
            .status-item:last-child {
                margin-bottom: 0;
            }
            
            .status-item .label {
                color: var(--SmartThemeTextColor);
                opacity: 0.7;
            }
            
            .status-item .value {
                color: var(--SmartThemeTextColor);
                font-weight: bold;
            }
            
            .dmss-panel {
                background: var(--SmartThemeChatTintColor, rgba(255, 255, 255, 0.05));
                border: 1px solid var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.1));
                border-radius: 6px;
                margin-top: 10px;
            }
            
            .panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 15px;
                border-bottom: 1px solid var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.1));
            }
            
            .panel-header h5 {
                margin: 0;
                color: var(--SmartThemeTextColor);
                font-size: 14px;
            }
            
            .close-btn {
                background: none;
                border: none;
                color: var(--SmartThemeTextColor);
                cursor: pointer;
                padding: 5px;
                border-radius: 3px;
                transition: background 0.3s ease;
            }
            
            .close-btn:hover {
                background: var(--SmartThemeChatTintColor, rgba(255, 255, 255, 0.1));
            }
            
            .panel-content {
                padding: 15px;
            }
            
            .setting-group {
                margin-bottom: 15px;
            }
            
            .setting-group label {
                display: block;
                margin-bottom: 5px;
                color: var(--SmartThemeTextColor);
                font-size: 12px;
                font-weight: bold;
            }
            
            .setting-group input[type="range"] {
                width: 100%;
                margin-bottom: 5px;
            }
            
            .setting-group input[type="number"],
            .setting-group input[type="text"] {
                width: 100%;
                padding: 5px 8px;
                border: 1px solid var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.2));
                background: var(--SmartThemeChatTintColor, rgba(255, 255, 255, 0.1));
                color: var(--SmartThemeTextColor);
                border-radius: 3px;
                font-size: 12px;
            }
            
            .setting-group input[type="checkbox"] {
                margin-right: 8px;
            }
            
            .range-value {
                color: var(--SmartThemeTextColor);
                font-size: 11px;
                opacity: 0.8;
            }
            
            .setting-actions {
                display: flex;
                gap: 8px;
                margin-top: 20px;
            }
            
            .memory-controls,
            .summary-controls {
                display: flex;
                gap: 8px;
                margin-bottom: 15px;
            }
            
            .memory-list,
            .summary-result {
                max-height: 300px;
                overflow-y: auto;
                background: var(--SmartThemeChatTintColor, rgba(255, 255, 255, 0.05));
                border-radius: 4px;
                padding: 10px;
            }
            
            .no-memories,
            .no-summary {
                text-align: center;
                color: var(--SmartThemeTextColor);
                opacity: 0.6;
                font-size: 12px;
                padding: 20px;
            }
            
            .memory-item {
                background: var(--SmartThemeChatTintColor, rgba(255, 255, 255, 0.1));
                border-radius: 4px;
                padding: 10px;
                margin-bottom: 8px;
                border-left: 3px solid var(--SmartThemeQuoteColor, #007bff);
            }
            
            .memory-item:last-child {
                margin-bottom: 0;
            }
            
            .memory-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 5px;
            }
            
            .memory-id {
                font-size: 10px;
                color: var(--SmartThemeTextColor);
                opacity: 0.6;
            }
            
            .memory-date {
                font-size: 10px;
                color: var(--SmartThemeTextColor);
                opacity: 0.6;
            }
            
            .memory-content {
                color: var(--SmartThemeTextColor);
                font-size: 12px;
                line-height: 1.4;
            }
            
            .memory-actions {
                display: flex;
                gap: 5px;
                margin-top: 8px;
            }
            
            .memory-action-btn {
                padding: 3px 6px;
                border: 1px solid var(--SmartThemeBorderColor, rgba(255, 255, 255, 0.2));
                background: var(--SmartThemeChatTintColor, rgba(255, 255, 255, 0.1));
                color: var(--SmartThemeTextColor);
                border-radius: 3px;
                cursor: pointer;
                font-size: 10px;
                transition: all 0.3s ease;
            }
            
            .memory-action-btn:hover {
                background: var(--SmartThemeQuoteColor, rgba(0, 123, 255, 0.1));
                border-color: var(--SmartThemeQuoteColor, #007bff);
            }
            </style>
        `;
    }

    /**
     * 显示DMSS界面
     */
    show() {
        this.isVisible = true;
        this.updateStatus();
        console.log('[DMSS UI] 界面已显示');
    }

    /**
     * 隐藏DMSS界面
     */
    hide() {
        this.isVisible = false;
        this.hideAllPanels();
        console.log('[DMSS UI] 界面已隐藏');
    }

    /**
     * 切换系统状态
     */
    async toggleSystem() {
        try {
            if (this.dmssCore.isEnabled) {
                await this.dmssCore.stop();
                this.updateStatus();
                toastr.success('DMSS系统已停止', '系统状态', { timeOut: 2000 });
            } else {
                const success = await this.dmssCore.start();
                if (success) {
                    this.updateStatus();
                    toastr.success('DMSS系统已启动', '系统状态', { timeOut: 2000 });
                } else {
                    toastr.error('DMSS系统启动失败', '系统状态', { timeOut: 3000 });
                }
            }
        } catch (error) {
            console.error('[DMSS UI] 切换系统状态失败:', error);
            toastr.error('操作失败', '错误', { timeOut: 3000 });
        }
    }

    /**
     * 更新状态显示
     */
    updateStatus() {
        const status = this.dmssCore.getStatus();
        
        // 更新状态指示器
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        
        if (statusDot && statusText) {
            if (status.enabled) {
                statusDot.className = 'status-dot online';
                statusText.textContent = '在线';
            } else {
                statusDot.className = 'status-dot offline';
                statusText.textContent = '离线';
            }
        }
        
        // 更新状态信息
        const currentChatId = document.getElementById('current-chat-id');
        const memoryCount = document.getElementById('memory-count');
        const injectionStatus = document.getElementById('injection-status');
        
        if (currentChatId) currentChatId.textContent = status.currentChatId || '未连接';
        if (memoryCount) memoryCount.textContent = status.memoryCount || '0';
        if (injectionStatus) {
            injectionStatus.textContent = status.enabled ? '已启用' : '未启用';
        }
        
        // 更新按钮状态
        const startBtn = document.getElementById('dmss-start-btn');
        if (startBtn) {
            if (status.enabled) {
                startBtn.innerHTML = '<i class="fa-solid fa-stop"></i> 停止DMSS';
                startBtn.classList.add('stop');
            } else {
                startBtn.innerHTML = '<i class="fa-solid fa-play"></i> 启动DMSS';
                startBtn.classList.remove('stop');
            }
        }
    }

    /**
     * 显示设置面板
     */
    showSettings() {
        this.hideAllPanels();
        const panel = document.getElementById('dmss-settings-panel');
        if (panel) {
            panel.style.display = 'block';
            this.loadSettings();
        }
    }

    /**
     * 隐藏设置面板
     */
    hideSettings() {
        const panel = document.getElementById('dmss-settings-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    }

    /**
     * 加载设置
     */
    loadSettings() {
        const settings = this.dmssCore.injectionSettings;
        
        const similarityThreshold = document.getElementById('similarity-threshold');
        const maxResults = document.getElementById('max-results');
        const maxTokens = document.getElementById('max-tokens');
        const autoInjection = document.getElementById('auto-injection');
        
        if (similarityThreshold) {
            similarityThreshold.value = settings.similarityThreshold;
            similarityThreshold.nextElementSibling.textContent = settings.similarityThreshold;
        }
        if (maxResults) maxResults.value = settings.maxResults;
        if (maxTokens) maxTokens.value = settings.maxTokens;
        if (autoInjection) autoInjection.checked = settings.enabled;
        
        // 绑定范围滑块事件
        if (similarityThreshold) {
            similarityThreshold.addEventListener('input', (e) => {
                e.target.nextElementSibling.textContent = e.target.value;
            });
        }
    }

    /**
     * 保存设置
     */
    async saveSettings() {
        try {
            const similarityThreshold = document.getElementById('similarity-threshold');
            const maxResults = document.getElementById('max-results');
            const maxTokens = document.getElementById('max-tokens');
            const autoInjection = document.getElementById('auto-injection');
            
            this.dmssCore.injectionSettings = {
                similarityThreshold: parseFloat(similarityThreshold?.value || 0.7),
                maxResults: parseInt(maxResults?.value || 5),
                maxTokens: parseInt(maxTokens?.value || 2000),
                enabled: autoInjection?.checked || false
            };
            
            await this.dmssCore.saveMemoryData();
            toastr.success('设置已保存', '保存成功', { timeOut: 2000 });
        } catch (error) {
            console.error('[DMSS UI] 保存设置失败:', error);
            toastr.error('保存设置失败', '错误', { timeOut: 3000 });
        }
    }

    /**
     * 重置设置
     */
    resetSettings() {
        this.dmssCore.injectionSettings = {
            enabled: true,
            maxTokens: 2000,
            similarityThreshold: 0.7,
            maxResults: 5
        };
        
        this.loadSettings();
        toastr.info('设置已重置', '重置完成', { timeOut: 2000 });
    }

    /**
     * 显示记忆库面板
     */
    showMemory() {
        this.hideAllPanels();
        const panel = document.getElementById('dmss-memory-panel');
        if (panel) {
            panel.style.display = 'block';
            this.loadMemoryList();
        }
    }

    /**
     * 隐藏记忆库面板
     */
    hideMemory() {
        const panel = document.getElementById('dmss-memory-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    }

    /**
     * 加载记忆列表
     */
    loadMemoryList() {
        const memoryList = document.getElementById('memory-list');
        if (!memoryList) return;
        
        const memories = Array.from(this.dmssCore.memoryData.values());
        
        if (memories.length === 0) {
            memoryList.innerHTML = '<div class="no-memories">暂无记忆数据</div>';
            return;
        }
        
        const memoryHTML = memories.map(memory => `
            <div class="memory-item">
                <div class="memory-header">
                    <span class="memory-id">${memory.id}</span>
                    <span class="memory-date">${new Date(memory.createdAt).toLocaleString()}</span>
                </div>
                <div class="memory-content">${memory.content.substring(0, 100)}${memory.content.length > 100 ? '...' : ''}</div>
                <div class="memory-actions">
                    <button class="memory-action-btn" onclick="window.dmssUI.viewMemory('${memory.id}')">查看</button>
                    <button class="memory-action-btn" onclick="window.dmssUI.deleteMemory('${memory.id}')">删除</button>
                </div>
            </div>
        `).join('');
        
        memoryList.innerHTML = memoryHTML;
    }

    /**
     * 添加当前聊天记忆
     */
    async addCurrentChatMemory() {
        try {
            // 获取当前聊天内容
            const messages = this.getCurrentChatMessages();
            if (messages.length === 0) {
                toastr.warning('当前聊天没有消息', '提示', { timeOut: 2000 });
                return;
            }
            
            const content = messages.map(msg => `${msg.name}: ${msg.text}`).join('\n');
            const memoryId = await this.dmssCore.addMemory(content, 'chat');
            
            if (memoryId) {
                this.loadMemoryList();
                toastr.success('记忆已添加', '添加成功', { timeOut: 2000 });
            } else {
                toastr.error('添加记忆失败', '错误', { timeOut: 3000 });
            }
        } catch (error) {
            console.error('[DMSS UI] 添加记忆失败:', error);
            toastr.error('添加记忆失败', '错误', { timeOut: 3000 });
        }
    }

    /**
     * 添加最后角色消息
     */
    async addLastCharacterMessage() {
        try {
            // 获取最后一条角色消息
            const lastCharMessage = this.dmssCore.getLastCharacterMessage();
            
            if (!lastCharMessage) {
                toastr.warning('未找到角色消息', '提示', { timeOut: 2000 });
                return;
            }
            
            const memoryId = await this.dmssCore.addMemory(lastCharMessage, 'character_message');
            
            if (memoryId) {
                this.loadMemoryList();
                toastr.success('角色消息已添加到记忆', '添加成功', { timeOut: 2000 });
            } else {
                toastr.error('添加角色消息失败', '错误', { timeOut: 3000 });
            }
        } catch (error) {
            console.error('[DMSS UI] 添加角色消息失败:', error);
            toastr.error('添加角色消息失败', '错误', { timeOut: 3000 });
        }
    }

    /**
     * 调试系统
     */
    debugSystem() {
        try {
            console.log('[DMSS UI] 开始调试系统...');
            
            // 检查DMSS核心状态
            const status = this.dmssCore.getStatus();
            console.log('[DMSS UI] 系统状态:', status);
            
            // 检查SillyTavern宏
            let lastCharMessage = null;
            let lastMessage = null;
            let lastUserMessage = null;
            
            if (typeof substituteParams === 'function') {
                lastCharMessage = substituteParams('{{lastCharMessage}}');
                lastMessage = substituteParams('{{lastMessage}}');
                lastUserMessage = substituteParams('{{lastUserMessage}}');
            }
            
            // 检查全局变量
            const globalVars = {
                chat: typeof chat !== 'undefined' ? chat.length : 'undefined',
                messages: typeof messages !== 'undefined' ? messages.length : 'undefined',
                getMessages: typeof getMessages !== 'function' ? 'undefined' : 'function',
                substituteParams: typeof substituteParams !== 'function' ? 'undefined' : 'function'
            };
            
            // 检查DOM元素
            const domElements = {
                mesElements: document.querySelectorAll('.mes').length,
                mesNameElements: document.querySelectorAll('.mes_name').length,
                mesTextElements: document.querySelectorAll('.mes_text').length
            };
            
            // 获取当前消息
            const currentMessages = this.getCurrentChatMessages();
            const lastCharMsg = this.dmssCore.getLastCharacterMessage();
            
            const debugInfo = `
                <div style="max-height: 500px; overflow-y: auto; font-size: 12px;">
                    <h6>DMSS系统调试信息</h6>
                    
                    <h7>系统状态:</h7>
                    <ul>
                        <li>启用状态: ${status.enabled ? '✅ 已启用' : '❌ 未启用'}</li>
                        <li>当前聊天ID: ${status.currentChatId || '未设置'}</li>
                        <li>记忆数量: ${status.memoryCount}</li>
                        <li>相似度阈值: ${status.settings.similarityThreshold}</li>
                        <li>最大检索结果: ${status.settings.maxResults}</li>
                    </ul>
                    
                    <h7>SillyTavern宏检查:</h7>
                    <ul>
                        <li>{{lastCharMessage}}: ${lastCharMessage ? '✅ 有内容' : '❌ 无内容'}</li>
                        <li>{{lastMessage}}: ${lastMessage ? '✅ 有内容' : '❌ 无内容'}</li>
                        <li>{{lastUserMessage}}: ${lastUserMessage ? '✅ 有内容' : '❌ 无内容'}</li>
                    </ul>
                    
                    <h7>全局变量检查:</h7>
                    <ul>
                        <li>chat: ${globalVars.chat}</li>
                        <li>messages: ${globalVars.messages}</li>
                        <li>getMessages: ${globalVars.getMessages}</li>
                        <li>substituteParams: ${globalVars.substituteParams}</li>
                    </ul>
                    
                    <h7>DOM元素检查:</h7>
                    <ul>
                        <li>.mes 元素: ${domElements.mesElements} 个</li>
                        <li>.mes_name 元素: ${domElements.mesNameElements} 个</li>
                        <li>.mes_text 元素: ${domElements.mesTextElements} 个</li>
                    </ul>
                    
                    <h7>消息获取测试:</h7>
                    <ul>
                        <li>当前聊天消息数量: ${currentMessages.length}</li>
                        <li>最后角色消息: ${lastCharMsg ? '✅ 获取成功' : '❌ 获取失败'}</li>
                    </ul>
                    
                    ${lastCharMessage ? `
                        <h7>最后角色消息内容:</h7>
                        <div style="background: var(--SmartThemeChatTintColor, rgba(255, 255, 255, 0.1)); padding: 10px; border-radius: 4px; white-space: pre-wrap; margin: 5px 0;">${lastCharMessage}</div>
                    ` : ''}
                    
                    ${currentMessages.length > 0 ? `
                        <h7>当前聊天消息示例 (前3条):</h7>
                        <div style="background: var(--SmartThemeChatTintColor, rgba(255, 255, 255, 0.1)); padding: 10px; border-radius: 4px; white-space: pre-wrap; margin: 5px 0;">${JSON.stringify(currentMessages.slice(0, 3), null, 2)}</div>
                    ` : ''}
                </div>
            `;
            
            // 使用SillyTavern的弹窗系统
            if (typeof callGenericPopup === 'function') {
                callGenericPopup(debugInfo, POPUP_TYPE.TEXT, POPUP_RESULT.TEXT);
            } else {
                alert(debugInfo);
            }
            
        } catch (error) {
            console.error('[DMSS UI] 调试系统失败:', error);
            toastr.error('调试失败', '错误', { timeOut: 3000 });
        }
    }

    /**
     * 获取当前聊天消息
     */
    getCurrentChatMessages() {
        try {
            // 使用DMSS核心的方法
            if (this.dmssCore && typeof this.dmssCore.getCurrentChatMessages === 'function') {
                return this.dmssCore.getCurrentChatMessages();
            }
            
            // 备用方案：尝试从SillyTavern获取消息
            if (typeof getMessages === 'function') {
                return getMessages();
            }
            
            // 备用方案：从DOM获取
            const messageElements = document.querySelectorAll('.mes');
            const messages = [];
            
            messageElements.forEach((element, index) => {
                const nameElement = element.querySelector('.mes_name');
                const textElement = element.querySelector('.mes_text');
                
                if (nameElement && textElement) {
                    messages.push({
                        name: nameElement.textContent.trim(),
                        text: textElement.textContent.trim(),
                        index: index
                    });
                }
            });
            
            return messages;
        } catch (error) {
            console.error('[DMSS UI] 获取消息失败:', error);
            return [];
        }
    }

    /**
     * 清空所有记忆
     */
    async clearAllMemories() {
        if (confirm('确定要清空所有记忆吗？此操作不可恢复！')) {
            try {
                this.dmssCore.memoryData.clear();
                await this.dmssCore.saveMemoryData();
                this.loadMemoryList();
                toastr.success('记忆库已清空', '清空成功', { timeOut: 2000 });
            } catch (error) {
                console.error('[DMSS UI] 清空记忆失败:', error);
                toastr.error('清空记忆失败', '错误', { timeOut: 3000 });
            }
        }
    }

    /**
     * 删除记忆
     */
    async deleteMemory(memoryId) {
        if (confirm('确定要删除这条记忆吗？')) {
            try {
                this.dmssCore.memoryData.delete(memoryId);
                await this.dmssCore.saveMemoryData();
                this.loadMemoryList();
                toastr.success('记忆已删除', '删除成功', { timeOut: 2000 });
            } catch (error) {
                console.error('[DMSS UI] 删除记忆失败:', error);
                toastr.error('删除记忆失败', '错误', { timeOut: 3000 });
            }
        }
    }

    /**
     * 查看记忆
     */
    viewMemory(memoryId) {
        const memory = this.dmssCore.memoryData.get(memoryId);
        if (memory) {
            const content = `
                <div style="max-height: 400px; overflow-y: auto;">
                    <h6>记忆详情</h6>
                    <p><strong>ID:</strong> ${memory.id}</p>
                    <p><strong>类型:</strong> ${memory.type}</p>
                    <p><strong>创建时间:</strong> ${new Date(memory.createdAt).toLocaleString()}</p>
                    <p><strong>聊天ID:</strong> ${memory.chatId}</p>
                    <hr>
                    <p><strong>内容:</strong></p>
                    <div style="background: var(--SmartThemeChatTintColor, rgba(255, 255, 255, 0.1)); padding: 10px; border-radius: 4px; white-space: pre-wrap;">${memory.content}</div>
                </div>
            `;
            
            // 使用SillyTavern的弹窗系统
            if (typeof callGenericPopup === 'function') {
                callGenericPopup(content, POPUP_TYPE.TEXT, POPUP_RESULT.TEXT);
            } else {
                alert(content);
            }
        }
    }

    /**
     * 显示总结面板
     */
    showSummary() {
        this.hideAllPanels();
        const panel = document.getElementById('dmss-summary-panel');
        if (panel) {
            panel.style.display = 'block';
        }
    }

    /**
     * 隐藏总结面板
     */
    hideSummary() {
        const panel = document.getElementById('dmss-summary-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    }

    /**
     * 生成当前聊天总结
     */
    async generateCurrentChatSummary() {
        try {
            const messages = this.getCurrentChatMessages();
            if (messages.length === 0) {
                toastr.warning('当前聊天没有消息', '提示', { timeOut: 2000 });
                return;
            }
            
            const content = messages.map(msg => `${msg.name}: ${msg.text}`).join('\n');
            const summary = await this.dmssCore.generateSummary(content);
            
            const summaryResult = document.getElementById('summary-result');
            if (summaryResult) {
                if (summary) {
                    summaryResult.innerHTML = `
                        <div style="background: var(--SmartThemeChatTintColor, rgba(255, 255, 255, 0.1)); padding: 15px; border-radius: 4px; white-space: pre-wrap; font-size: 12px; line-height: 1.4;">${summary}</div>
                    `;
                } else {
                    summaryResult.innerHTML = '<div class="no-summary">总结生成失败</div>';
                }
            }
        } catch (error) {
            console.error('[DMSS UI] 生成总结失败:', error);
            toastr.error('生成总结失败', '错误', { timeOut: 3000 });
        }
    }

    /**
     * 设置总结模板
     */
    setSummaryTemplate() {
        const currentTemplate = this.dmssCore.summaryTemplate || '';
        const newTemplate = prompt('请输入新的总结模板（使用 {content} 作为内容占位符）:', currentTemplate);
        
        if (newTemplate !== null) {
            this.dmssCore.summaryTemplate = newTemplate;
            toastr.success('总结模板已更新', '更新成功', { timeOut: 2000 });
        }
    }

    /**
     * 隐藏所有面板
     */
    hideAllPanels() {
        const panels = ['dmss-settings-panel', 'dmss-memory-panel', 'dmss-summary-panel'];
        panels.forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (panel) {
                panel.style.display = 'none';
            }
        });
    }
}

// 导出DMSS UI类
window.DMSSUI = DMSSUI;
