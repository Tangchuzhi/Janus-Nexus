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
        
        try {
            await this.core.start();
            await this.refreshMemoryList();
            this.updateStatusDisplay();
            
            console.log('[DMSS UI] DMSS系统已启动');
            
            // 显示启动成功提示
            if (typeof toastr !== 'undefined') {
                toastr.success('DMSS系统已启动', '启动成功', { timeOut: 2000 });
            }
        } catch (error) {
            console.error('[DMSS UI] 启动DMSS系统失败:', error);
            
            // 显示启动失败提示
            if (typeof toastr !== 'undefined') {
                toastr.error('DMSS系统启动失败，请检查世界书设置', '启动失败', { timeOut: 3000 });
            }
        }
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

        // 监听DOM变化，检测新消息
        this.setupDOMObserver();

        // 监听用户输入事件，准备自动注入记忆
        this.setupInputListener();

        // 监听slash命令事件
        this.setupSlashCommandListener();
    }

    /**
     * 设置DOM观察器，监听聊天消息变化
     */
    setupDOMObserver() {
        try {
            const chatContainer = document.querySelector('#chat') || 
                                document.querySelector('.chat-container') ||
                                document.querySelector('.messages') ||
                                document.body;

            if (chatContainer) {
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'childList') {
                            mutation.addedNodes.forEach((node) => {
                                if (node.nodeType === Node.ELEMENT_NODE) {
                                    this.checkForNewMessages(node);
                                }
                            });
                        }
                    });
                });

                observer.observe(chatContainer, {
                    childList: true,
                    subtree: true
                });

                console.log('[DMSS UI] DOM观察器已设置');
            }
        } catch (error) {
            console.error('[DMSS UI] 设置DOM观察器失败:', error);
        }
    }

    /**
     * 检查新消息中的DMSS内容
     */
    checkForNewMessages(node) {
        try {
            // 查找消息元素
            const messageSelectors = [
                '.message',
                '.chat-message',
                '.user-message',
                '.assistant-message',
                '[class*="message"]'
            ];

            let messageElement = null;
            for (let selector of messageSelectors) {
                if (node.matches && node.matches(selector)) {
                    messageElement = node;
                    break;
                }
                const found = node.querySelector && node.querySelector(selector);
                if (found) {
                    messageElement = found;
                    break;
                }
            }

            if (messageElement) {
                const messageText = messageElement.textContent || messageElement.innerText;
                if (messageText && messageText.includes('<DMSS>')) {
                    this.handleNewMessage(messageText);
                }
            }
        } catch (error) {
            console.error('[DMSS UI] 检查新消息失败:', error);
        }
    }

    /**
     * 设置输入监听器，准备自动注入记忆
     */
    setupInputListener() {
        try {
            const inputSelectors = [
                '#send_textarea',
                '#user_input',
                '.user-input',
                'textarea[placeholder*="输入"]',
                'textarea[placeholder*="message"]'
            ];

            for (let selector of inputSelectors) {
                const inputElement = document.querySelector(selector);
                if (inputElement) {
                    // 监听输入事件
                    inputElement.addEventListener('input', (event) => {
                        this.handleUserInput(event.target.value);
                    });

                    // 监听焦点事件
                    inputElement.addEventListener('focus', (event) => {
                        this.handleInputFocus(event.target.value);
                    });

                    console.log('[DMSS UI] 输入监听器已设置');
                    break;
                }
            }
        } catch (error) {
            console.error('[DMSS UI] 设置输入监听器失败:', error);
        }
    }

    /**
     * 处理用户输入
     */
    handleUserInput(inputValue) {
        if (!this.core || !this.core.isEnabled || !inputValue) {
            return;
        }

        // 延迟处理，避免频繁触发
        clearTimeout(this.inputTimeout);
        this.inputTimeout = setTimeout(() => {
            this.autoInjectMemories(inputValue);
        }, 1000); // 1秒延迟
    }

    /**
     * 处理输入框获得焦点
     */
    handleInputFocus(inputValue) {
        if (!this.core || !this.core.isEnabled) {
            return;
        }

        // 如果输入框为空，可以考虑注入一些通用记忆
        if (!inputValue || inputValue.trim() === '') {
            this.suggestGeneralMemories();
        }
    }

    /**
     * 自动注入记忆
     */
    async autoInjectMemories(inputValue) {
        if (!this.core || !this.core.isEnabled) {
            return;
        }

        try {
            const relevantMemories = await this.core.findRelevantMemories(inputValue);
            if (relevantMemories.length > 0) {
                // 显示记忆建议
                this.showMemorySuggestions(relevantMemories, inputValue);
            }
        } catch (error) {
            console.error('[DMSS UI] 自动注入记忆失败:', error);
        }
    }

    /**
     * 显示记忆建议
     */
    showMemorySuggestions(memories, originalInput) {
        try {
            // 移除已存在的建议
            const existingSuggestions = document.querySelector('.dmss-memory-suggestions');
            if (existingSuggestions) {
                existingSuggestions.remove();
            }

            // 创建建议容器
            const suggestionsContainer = document.createElement('div');
            suggestionsContainer.className = 'dmss-memory-suggestions';
            suggestionsContainer.innerHTML = `
                <div class="suggestions-header">
                    <span><i class="fa-solid fa-brain"></i> 相关记忆建议</span>
                    <button class="suggestions-close" onclick="this.parentElement.parentElement.remove()">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </div>
                <div class="suggestions-content">
                    ${memories.map(memory => `
                        <div class="memory-suggestion" data-key="${memory.key}">
                            <div class="suggestion-summary">${memory.summary}</div>
                            <button class="suggestion-inject-btn" onclick="window.dmssUI.injectMemorySuggestion('${memory.key}', '${originalInput.replace(/'/g, "\\'")}')">
                                <i class="fa-solid fa-plus"></i> 注入
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;

            // 添加到页面
            document.body.appendChild(suggestionsContainer);

            // 5秒后自动隐藏
            setTimeout(() => {
                if (suggestionsContainer.parentElement) {
                    suggestionsContainer.remove();
                }
            }, 5000);

        } catch (error) {
            console.error('[DMSS UI] 显示记忆建议失败:', error);
        }
    }

    /**
     * 注入记忆建议
     */
    injectMemorySuggestion(memoryKey, originalInput) {
        try {
            const memory = this.core.memoryEntries.find(m => m.key === memoryKey);
            if (memory) {
                const injectedContent = originalInput + '\n\n<!-- DMSS注入的相关记忆 -->\n' +
                    `[记忆片段 ${memory.key}]: ${memory.summary}\n`;
                
                this.core.updateUserInput(injectedContent);
                
                // 移除建议容器
                const suggestionsContainer = document.querySelector('.dmss-memory-suggestions');
                if (suggestionsContainer) {
                    suggestionsContainer.remove();
                }
            }
        } catch (error) {
            console.error('[DMSS UI] 注入记忆建议失败:', error);
        }
    }

    /**
     * 建议通用记忆
     */
    suggestGeneralMemories() {
        if (!this.core || this.core.memoryEntries.length === 0) {
            return;
        }

        // 获取最近的几条记忆作为建议
        const recentMemories = this.core.getAllMemories().slice(0, 3);
        if (recentMemories.length > 0) {
            this.showMemorySuggestions(recentMemories, '');
        }
    }

    /**
     * 设置slash命令监听器
     */
    setupSlashCommandListener() {
        try {
            // 监听自定义slash命令事件
            window.addEventListener('dmss-slash-command', (event) => {
                const command = event.detail.command;
                console.log('[DMSS UI] 收到slash命令:', command);
                
                // 处理DMSS相关的slash命令
                if (command.includes('dmss') || command.includes('DMSS')) {
                    this.handleDMSSSlashCommand(command);
                }
            });

            console.log('[DMSS UI] Slash命令监听器已设置');
        } catch (error) {
            console.error('[DMSS UI] 设置slash命令监听器失败:', error);
        }
    }

    /**
     * 处理DMSS相关的slash命令
     */
    handleDMSSSlashCommand(command) {
        try {
            if (command.includes('/dmss-inject')) {
                this.core.autoInjectMemories();
            } else if (command.includes('/dmss-view')) {
                this.viewMemoryContent();
            }
        } catch (error) {
            console.error('[DMSS UI] 处理DMSS slash命令失败:', error);
        }
    }

    /**
     * 测试DMSS功能
     */
    async testDMSSFunction() {
        if (!this.core) {
            if (typeof toastr !== 'undefined') {
                toastr.error('请先启动DMSS系统', '测试失败', { timeOut: 2000 });
            }
            return;
        }
        
        try {
            console.log('[DMSS UI] 开始测试DMSS功能...');
            
            if (typeof toastr !== 'undefined') {
                toastr.info('正在测试DMSS功能...', '测试中', { timeOut: 2000 });
            }
            
            const success = await this.core.testDMSSFunction();
            
            if (success) {
                await this.refreshMemoryList();
                this.updateStatusDisplay();
                
                if (typeof toastr !== 'undefined') {
                    toastr.success('DMSS功能测试成功！', '测试完成', { timeOut: 3000 });
                }
            } else {
                if (typeof toastr !== 'undefined') {
                    toastr.error('DMSS功能测试失败，请检查设置', '测试失败', { timeOut: 3000 });
                }
            }
            
        } catch (error) {
            console.error('[DMSS UI] 测试DMSS功能失败:', error);
            
            if (typeof toastr !== 'undefined') {
                toastr.error('测试过程中发生错误', '测试失败', { timeOut: 3000 });
            }
        }
    }

    /**
     * 处理新消息
     */
    async handleNewMessage(messageContent) {
        if (this.core && this.core.isEnabled) {
            try {
                // 检查是否包含DMSS标签
                if (messageContent.includes('<DMSS>')) {
                    console.log('[DMSS UI] 检测到DMSS标签，开始处理...');
                    
                    await this.core.processMessage(messageContent);
                    await this.refreshMemoryList();
                    this.updateStatusDisplay();
                    
                    // 显示处理成功提示
                    if (typeof toastr !== 'undefined') {
                        toastr.success('已捕获DMSS内容并存储到世界书', 'DMSS处理完成', { timeOut: 2000 });
                    }
                }
            } catch (error) {
                console.error('[DMSS UI] 处理DMSS消息失败:', error);
                
                if (typeof toastr !== 'undefined') {
                    toastr.error('处理DMSS内容失败', '处理错误', { timeOut: 3000 });
                }
            }
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
