/**
 * DMSS (动态记忆流系统) UI模块
 * Dynamic Memory Stream System UI Module
 * 
 * 功能：
 * 1. 提供DMSS的用户界面
 * 2. 管理DMSS的启动和停止
 * 3. 显示记忆内容和统计信息
 * 4. 提供设置界面
 */

class DMSSUI {
    constructor() {
        this.core = null;
        this.isInitialized = false;
        this.uiContainer = null;
        this.settingsModal = null;
        this.memoryViewer = null;
        
        console.log('[DMSS UI] 初始化');
    }
    
    /**
     * 初始化DMSS UI
     */
    init() {
        if (this.isInitialized) {
            console.log('[DMSS UI] 已经初始化');
            return;
        }
        
        try {
            // 初始化核心模块
            this.core = new DMSSCore();
            
            // 创建UI容器
            this.createUIContainer();
            
            // 绑定事件
            this.bindEvents();
            
            this.isInitialized = true;
            console.log('[DMSS UI] 初始化完成');
            
        } catch (error) {
            console.error('[DMSS UI] 初始化失败:', error);
        }
    }
    
    /**
     * 创建UI容器
     */
    createUIContainer() {
        // 创建主UI容器
        this.uiContainer = document.createElement('div');
        this.uiContainer.id = 'dmss-ui-container';
        this.uiContainer.className = 'dmss-ui-container';
        this.uiContainer.style.display = 'none';
        
        // 添加到页面
        document.body.appendChild(this.uiContainer);
        
        console.log('[DMSS UI] UI容器已创建');
    }
    
    /**
     * 绑定事件
     */
    bindEvents() {
        // 监听聊天消息
        this.bindChatEvents();
        
        // 监听设置变化
        this.bindSettingsEvents();
        
        console.log('[DMSS UI] 事件已绑定');
    }
    
    /**
     * 绑定聊天事件
     */
    bindChatEvents() {
        // 监听消息发送事件
        if (typeof eventSource !== 'undefined') {
            eventSource.on('MESSAGE_SENT', (data) => {
                this.handleMessageSent(data);
            });
            
            eventSource.on('MESSAGE_RECEIVED', (data) => {
                this.handleMessageReceived(data);
            });
        }
        
        // 监听DOM变化（备用方案）
        this.observeChatChanges();
    }
    
    /**
     * 监听聊天DOM变化
     */
    observeChatChanges() {
        const chatContainer = document.querySelector('#chat');
        if (chatContainer) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        this.handleChatDOMChange(mutation);
                    }
                });
            });
            
            observer.observe(chatContainer, {
                childList: true,
                subtree: true
            });
            
            console.log('[DMSS UI] 聊天DOM监听已启动');
        }
    }
    
    /**
     * 处理消息发送
     */
    async handleMessageSent(data) {
        if (!this.core || !this.core.settings.enabled) {
            return;
        }
        
        try {
            const messageData = {
                content: data.message || data.content,
                role: 'user',
                timestamp: Date.now()
            };
            
            const relevantMemories = await this.core.processMessage(messageData);
            
            if (relevantMemories && relevantMemories.length > 0) {
                this.injectMemories(relevantMemories);
            }
            
        } catch (error) {
            console.error('[DMSS UI] 处理用户消息失败:', error);
        }
    }
    
    /**
     * 处理消息接收
     */
    async handleMessageReceived(data) {
        if (!this.core || !this.core.settings.enabled) {
            return;
        }
        
        try {
            const messageData = {
                content: data.message || data.content,
                role: 'assistant',
                timestamp: Date.now()
            };
            
            await this.core.processMessage(messageData);
            
        } catch (error) {
            console.error('[DMSS UI] 处理AI消息失败:', error);
        }
    }
    
    /**
     * 处理聊天DOM变化
     */
    handleChatDOMChange(mutation) {
        // 检测新消息
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const messageElement = node.querySelector('.mes, .message');
                if (messageElement) {
                    this.processNewMessage(messageElement);
                }
            }
        });
    }
    
    /**
     * 处理新消息
     */
    async processNewMessage(messageElement) {
        if (!this.core || !this.core.settings.enabled) {
            return;
        }
        
        try {
            // 提取消息内容
            const content = messageElement.textContent || messageElement.innerText;
            const isUserMessage = messageElement.classList.contains('mes_user') || 
                                messageElement.querySelector('.mes_user');
            
            const messageData = {
                content: content,
                role: isUserMessage ? 'user' : 'assistant',
                timestamp: Date.now()
            };
            
            if (isUserMessage) {
                const relevantMemories = await this.core.processMessage(messageData);
                if (relevantMemories && relevantMemories.length > 0) {
                    this.injectMemories(relevantMemories);
                }
            } else {
                await this.core.processMessage(messageData);
            }
            
        } catch (error) {
            console.error('[DMSS UI] 处理新消息失败:', error);
        }
    }
    
    /**
     * 注入记忆到聊天
     */
    injectMemories(relevantMemories) {
        try {
            const injectionText = this.core.generateInjectionText(relevantMemories);
            
            if (injectionText) {
                // 查找输入框
                const inputElement = document.querySelector('#send_textarea, #user_input, textarea[placeholder*="输入"]');
                
                if (inputElement) {
                    // 在输入框下方显示记忆注入
                    this.showMemoryInjection(injectionText, relevantMemories);
                }
            }
            
        } catch (error) {
            console.error('[DMSS UI] 注入记忆失败:', error);
        }
    }
    
    /**
     * 显示记忆注入
     */
    showMemoryInjection(injectionText, memories) {
        // 移除之前的注入显示
        const existingInjection = document.querySelector('#dmss-memory-injection');
        if (existingInjection) {
            existingInjection.remove();
        }
        
        // 创建注入显示元素
        const injectionElement = document.createElement('div');
        injectionElement.id = 'dmss-memory-injection';
        injectionElement.className = 'dmss-memory-injection';
        injectionElement.innerHTML = `
            <div class="dmss-injection-header">
                <i class="fa-solid fa-brain"></i>
                <span>DMSS记忆注入 (${memories.length}条相关记忆)</span>
                <button class="dmss-injection-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>
            <div class="dmss-injection-content">
                ${memories.map((memory, index) => `
                    <div class="dmss-memory-item" data-relevance="${memory.relevance}">
                        <div class="dmss-memory-header">
                            <span class="dmss-memory-index">${index + 1}</span>
                            <span class="dmss-memory-relevance">相关性: ${(memory.relevance * 100).toFixed(1)}%</span>
                        </div>
                        <div class="dmss-memory-summary">${memory.summary}</div>
                        <div class="dmss-memory-meta">
                            <span class="dmss-memory-time">${new Date(memory.timestamp).toLocaleString()}</span>
                            <span class="dmss-memory-keywords">${memory.keywords ? memory.keywords.join(', ') : ''}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        // 添加样式
        this.addInjectionStyles();
        
        // 插入到聊天区域
        const chatContainer = document.querySelector('#chat');
        if (chatContainer) {
            chatContainer.appendChild(injectionElement);
            
            // 滚动到注入内容
            injectionElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        
        console.log('[DMSS UI] 记忆注入已显示');
    }
    
    /**
     * 添加注入样式
     */
    addInjectionStyles() {
        if (document.querySelector('#dmss-injection-styles')) {
            return;
        }
        
        const styleElement = document.createElement('style');
        styleElement.id = 'dmss-injection-styles';
        styleElement.textContent = `
            .dmss-memory-injection {
                background: rgba(52, 152, 219, 0.1);
                border: 1px solid rgba(52, 152, 219, 0.3);
                border-radius: 8px;
                margin: 10px 0;
                padding: 12px;
                font-size: 13px;
                color: var(--SmartThemeTextColor, #333);
            }
            
            .dmss-injection-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 10px;
                font-weight: bold;
                color: rgba(52, 152, 219, 0.9);
            }
            
            .dmss-injection-close {
                background: none;
                border: none;
                color: rgba(52, 152, 219, 0.7);
                cursor: pointer;
                padding: 2px;
                border-radius: 3px;
            }
            
            .dmss-injection-close:hover {
                background: rgba(52, 152, 219, 0.1);
            }
            
            .dmss-memory-item {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                padding: 10px;
                margin-bottom: 8px;
            }
            
            .dmss-memory-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 6px;
            }
            
            .dmss-memory-index {
                background: rgba(52, 152, 219, 0.8);
                color: white;
                padding: 2px 6px;
                border-radius: 10px;
                font-size: 11px;
                font-weight: bold;
            }
            
            .dmss-memory-relevance {
                font-size: 11px;
                color: rgba(52, 152, 219, 0.8);
            }
            
            .dmss-memory-summary {
                margin-bottom: 6px;
                line-height: 1.4;
            }
            
            .dmss-memory-meta {
                display: flex;
                justify-content: space-between;
                font-size: 10px;
                color: var(--SmartThemeTextColor, #666);
                opacity: 0.7;
            }
            
            .dmss-memory-keywords {
                font-style: italic;
            }
        `;
        
        document.head.appendChild(styleElement);
    }
    
    /**
     * 启动DMSS
     */
    startDMSS() {
        if (!this.core) {
            console.error('[DMSS UI] 核心模块未初始化');
            return;
        }
        
        this.core.setEnabled(true);
        this.updateUI();
        
        console.log('[DMSS UI] DMSS已启动');
    }
    
    /**
     * 停止DMSS
     */
    stopDMSS() {
        if (!this.core) {
            return;
        }
        
        this.core.setEnabled(false);
        this.updateUI();
        
        // 移除记忆注入显示
        const injectionElement = document.querySelector('#dmss-memory-injection');
        if (injectionElement) {
            injectionElement.remove();
        }
        
        console.log('[DMSS UI] DMSS已停止');
    }
    
    /**
     * 重置DMSS
     */
    resetDMSS() {
        if (!this.core) {
            return;
        }
        
        this.core.reset();
        this.updateUI();
        
        console.log('[DMSS UI] DMSS已重置');
    }
    
    /**
     * 查看记忆内容
     */
    viewMemoryContent() {
        if (!this.core) {
            return;
        }
        
        this.showMemoryViewer();
    }
    
    /**
     * 显示记忆查看器
     */
    showMemoryViewer() {
        // 移除之前的查看器
        const existingViewer = document.querySelector('#dmss-memory-viewer');
        if (existingViewer) {
            existingViewer.remove();
        }
        
        const memories = this.core.memories;
        const stats = this.core.getStats();
        
        const viewerHTML = `
            <div id="dmss-memory-viewer" class="dmss-memory-viewer">
                <div class="dmss-viewer-header">
                    <h3><i class="fa-solid fa-brain"></i> DMSS记忆查看器</h3>
                    <button class="dmss-viewer-close" onclick="this.parentElement.parentElement.remove()">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </div>
                <div class="dmss-viewer-stats">
                    <div class="stat-item">
                        <span class="stat-label">总记忆数:</span>
                        <span class="stat-value">${stats.totalMemories}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">最后更新:</span>
                        <span class="stat-value">${stats.lastUpdate ? new Date(stats.lastUpdate).toLocaleString() : '无'}</span>
                    </div>
                </div>
                <div class="dmss-viewer-content">
                    ${memories.length === 0 ? 
                        '<div class="no-memories">暂无记忆内容</div>' :
                        memories.map((memory, index) => `
                            <div class="dmss-viewer-memory">
                                <div class="memory-header">
                                    <span class="memory-id">#${index + 1}</span>
                                    <span class="memory-time">${new Date(memory.timestamp).toLocaleString()}</span>
                                </div>
                                <div class="memory-content">${memory.content}</div>
                                <div class="memory-summary"><strong>总结:</strong> ${memory.summary}</div>
                                <div class="memory-keywords"><strong>关键词:</strong> ${memory.keywords ? memory.keywords.join(', ') : '无'}</div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        `;
        
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'dmss-modal-overlay';
        modal.innerHTML = viewerHTML;
        
        // 添加样式
        this.addViewerStyles();
        
        // 添加到页面
        document.body.appendChild(modal);
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        console.log('[DMSS UI] 记忆查看器已显示');
    }
    
    /**
     * 添加查看器样式
     */
    addViewerStyles() {
        if (document.querySelector('#dmss-viewer-styles')) {
            return;
        }
        
        const styleElement = document.createElement('style');
        styleElement.id = 'dmss-viewer-styles';
        styleElement.textContent = `
            .dmss-modal-overlay {
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
            
            .dmss-memory-viewer {
                background: var(--SmartThemeBodyColor, #fff);
                border-radius: 12px;
                width: 80%;
                max-width: 800px;
                max-height: 80%;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            }
            
            .dmss-viewer-header {
                background: rgba(52, 152, 219, 0.1);
                padding: 15px 20px;
                border-bottom: 1px solid rgba(52, 152, 219, 0.2);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .dmss-viewer-header h3 {
                margin: 0;
                color: rgba(52, 152, 219, 0.9);
                font-size: 16px;
            }
            
            .dmss-viewer-close {
                background: none;
                border: none;
                color: rgba(52, 152, 219, 0.7);
                cursor: pointer;
                padding: 5px;
                border-radius: 4px;
            }
            
            .dmss-viewer-close:hover {
                background: rgba(52, 152, 219, 0.1);
            }
            
            .dmss-viewer-stats {
                padding: 15px 20px;
                background: rgba(0, 0, 0, 0.02);
                border-bottom: 1px solid rgba(0, 0, 0, 0.1);
                display: flex;
                gap: 20px;
            }
            
            .stat-item {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            
            .stat-label {
                font-size: 12px;
                color: var(--SmartThemeTextColor, #666);
                opacity: 0.8;
            }
            
            .stat-value {
                font-size: 14px;
                font-weight: bold;
                color: var(--SmartThemeTextColor, #333);
            }
            
            .dmss-viewer-content {
                padding: 20px;
                max-height: 400px;
                overflow-y: auto;
            }
            
            .no-memories {
                text-align: center;
                color: var(--SmartThemeTextColor, #666);
                opacity: 0.6;
                padding: 40px;
                font-style: italic;
            }
            
            .dmss-viewer-memory {
                background: rgba(0, 0, 0, 0.02);
                border: 1px solid rgba(0, 0, 0, 0.1);
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 15px;
            }
            
            .memory-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .memory-id {
                background: rgba(52, 152, 219, 0.8);
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: bold;
            }
            
            .memory-time {
                font-size: 11px;
                color: var(--SmartThemeTextColor, #666);
                opacity: 0.7;
            }
            
            .memory-content {
                margin-bottom: 10px;
                line-height: 1.5;
                color: var(--SmartThemeTextColor, #333);
            }
            
            .memory-summary, .memory-keywords {
                font-size: 12px;
                margin-bottom: 5px;
                color: var(--SmartThemeTextColor, #555);
            }
            
            .memory-summary strong, .memory-keywords strong {
                color: rgba(52, 152, 219, 0.8);
            }
        `;
        
        document.head.appendChild(styleElement);
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
        // 移除之前的设置模态框
        const existingModal = document.querySelector('#dmss-settings-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const settings = this.core.settings;
        
        const settingsHTML = `
            <div id="dmss-settings-modal" class="dmss-modal-overlay">
                <div class="dmss-settings-modal">
                    <div class="dmss-settings-header">
                        <h3><i class="fa-solid fa-gear"></i> DMSS设置</h3>
                        <button class="dmss-settings-close" onclick="this.parentElement.parentElement.remove()">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>
                    <div class="dmss-settings-content">
                        <div class="setting-group">
                            <label class="setting-label">
                                <input type="checkbox" id="dmss-enabled" ${settings.enabled ? 'checked' : ''}>
                                <span>启用DMSS</span>
                            </label>
                        </div>
                        
                        <div class="setting-group">
                            <label class="setting-label">
                                <span>最大记忆数量:</span>
                                <input type="number" id="dmss-max-memories" value="${settings.maxMemories}" min="10" max="500">
                            </label>
                        </div>
                        
                        <div class="setting-group">
                            <label class="setting-label">
                                <span>记忆关联阈值:</span>
                                <input type="range" id="dmss-threshold" min="0.1" max="1" step="0.1" value="${settings.memoryThreshold}">
                                <span class="threshold-value">${(settings.memoryThreshold * 100).toFixed(0)}%</span>
                            </label>
                        </div>
                        
                        <div class="setting-group">
                            <label class="setting-label">
                                <span>总结长度:</span>
                                <input type="number" id="dmss-summary-length" value="${settings.summaryLength}" min="50" max="500">
                            </label>
                        </div>
                        
                        <div class="setting-group">
                            <label class="setting-label">
                                <input type="checkbox" id="dmss-auto-summarize" ${settings.autoSummarize ? 'checked' : ''}>
                                <span>自动总结</span>
                            </label>
                        </div>
                        
                        <div class="setting-group">
                            <label class="setting-label">
                                <input type="checkbox" id="dmss-debug-mode" ${settings.debugMode ? 'checked' : ''}>
                                <span>调试模式</span>
                            </label>
                        </div>
                    </div>
                    <div class="dmss-settings-footer">
                        <button class="dmss-settings-save" onclick="window.dmssUI.saveSettings()">保存设置</button>
                        <button class="dmss-settings-cancel" onclick="this.parentElement.parentElement.remove()">取消</button>
                    </div>
                </div>
            </div>
        `;
        
        // 添加到页面
        document.body.insertAdjacentHTML('beforeend', settingsHTML);
        
        // 添加设置样式
        this.addSettingsStyles();
        
        // 绑定设置事件
        this.bindSettingsModalEvents();
        
        console.log('[DMSS UI] 设置模态框已显示');
    }
    
    /**
     * 绑定设置模态框事件
     */
    bindSettingsModalEvents() {
        // 阈值滑块事件
        const thresholdSlider = document.querySelector('#dmss-threshold');
        const thresholdValue = document.querySelector('.threshold-value');
        
        if (thresholdSlider && thresholdValue) {
            thresholdSlider.addEventListener('input', (e) => {
                thresholdValue.textContent = `${(e.target.value * 100).toFixed(0)}%`;
            });
        }
    }
    
    /**
     * 保存设置
     */
    saveSettings() {
        if (!this.core) {
            return;
        }
        
        const newSettings = {
            enabled: document.querySelector('#dmss-enabled').checked,
            maxMemories: parseInt(document.querySelector('#dmss-max-memories').value),
            memoryThreshold: parseFloat(document.querySelector('#dmss-threshold').value),
            summaryLength: parseInt(document.querySelector('#dmss-summary-length').value),
            autoSummarize: document.querySelector('#dmss-auto-summarize').checked,
            debugMode: document.querySelector('#dmss-debug-mode').checked
        };
        
        this.core.updateSettings(newSettings);
        this.updateUI();
        
        // 关闭设置模态框
        const settingsModal = document.querySelector('#dmss-settings-modal');
        if (settingsModal) {
            settingsModal.remove();
        }
        
        console.log('[DMSS UI] 设置已保存');
    }
    
    /**
     * 添加设置样式
     */
    addSettingsStyles() {
        if (document.querySelector('#dmss-settings-styles')) {
            return;
        }
        
        const styleElement = document.createElement('style');
        styleElement.id = 'dmss-settings-styles';
        styleElement.textContent = `
            .dmss-settings-modal {
                background: var(--SmartThemeBodyColor, #fff);
                border-radius: 12px;
                width: 90%;
                max-width: 500px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            }
            
            .dmss-settings-header {
                background: rgba(52, 152, 219, 0.1);
                padding: 15px 20px;
                border-bottom: 1px solid rgba(52, 152, 219, 0.2);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .dmss-settings-header h3 {
                margin: 0;
                color: rgba(52, 152, 219, 0.9);
                font-size: 16px;
            }
            
            .dmss-settings-close {
                background: none;
                border: none;
                color: rgba(52, 152, 219, 0.7);
                cursor: pointer;
                padding: 5px;
                border-radius: 4px;
            }
            
            .dmss-settings-close:hover {
                background: rgba(52, 152, 219, 0.1);
            }
            
            .dmss-settings-content {
                padding: 20px;
            }
            
            .setting-group {
                margin-bottom: 20px;
            }
            
            .setting-label {
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 14px;
                color: var(--SmartThemeTextColor, #333);
            }
            
            .setting-label input[type="checkbox"] {
                width: 16px;
                height: 16px;
            }
            
            .setting-label input[type="number"], .setting-label input[type="range"] {
                padding: 4px 8px;
                border: 1px solid rgba(0, 0, 0, 0.2);
                border-radius: 4px;
                font-size: 13px;
            }
            
            .threshold-value {
                font-weight: bold;
                color: rgba(52, 152, 219, 0.8);
                min-width: 40px;
            }
            
            .dmss-settings-footer {
                padding: 15px 20px;
                border-top: 1px solid rgba(0, 0, 0, 0.1);
                display: flex;
                gap: 10px;
                justify-content: flex-end;
            }
            
            .dmss-settings-save, .dmss-settings-cancel {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 13px;
                font-weight: bold;
            }
            
            .dmss-settings-save {
                background: rgba(52, 152, 219, 0.8);
                color: white;
            }
            
            .dmss-settings-save:hover {
                background: rgba(52, 152, 219, 1);
            }
            
            .dmss-settings-cancel {
                background: rgba(108, 117, 125, 0.8);
                color: white;
            }
            
            .dmss-settings-cancel:hover {
                background: rgba(108, 117, 125, 1);
            }
        `;
        
        document.head.appendChild(styleElement);
    }
    
    /**
     * 更新UI状态
     */
    updateUI() {
        if (!this.core) {
            return;
        }
        
        // 更新状态显示
        const statusElement = document.getElementById('dmss-status');
        if (statusElement) {
            statusElement.textContent = this.core.settings.enabled ? '运行中' : '已停止';
            statusElement.style.color = this.core.settings.enabled ? '#28a745' : '#dc3545';
        }
        
        // 更新开关状态
        const toggleElement = document.getElementById('dmss-main-toggle');
        if (toggleElement) {
            toggleElement.checked = this.core.settings.enabled;
        }
        
        // 更新最后更新时间
        const lastUpdateElement = document.getElementById('dmss-last-update');
        if (lastUpdateElement) {
            const stats = this.core.getStats();
            lastUpdateElement.textContent = stats.lastUpdate ? 
                new Date(stats.lastUpdate).toLocaleString() : '从未';
        }
    }
    
    /**
     * 绑定设置事件
     */
    bindSettingsEvents() {
        // 这里可以添加其他设置相关的事件绑定
    }
}

// 导出DMSS UI类
window.DMSSUI = DMSSUI;

console.log('[DMSS UI] 模块加载完成');
