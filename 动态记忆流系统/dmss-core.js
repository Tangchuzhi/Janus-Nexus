/**
 * DMSS (Dynamic Memory Stream System) 核心模块
 * 动态记忆流系统 - 基于正则表达式捕获和SillyTavern存储系统
 */

class DMSSCore {
    constructor() {
        this.isEnabled = false;
        this.currentChatId = null;
        this.memoryCache = new Map();
        this.regexPattern = /<DMSS>([\s\S]*?)<\/DMSS>/g;
        this.storagePrefix = 'DMSS_';
        this.debugMode = false;
        
        // 初始化
        this.init();
    }

    /**
     * 初始化DMSS核心
     */
    init() {
        console.log('[DMSS Core] 初始化动态记忆流系统');
        this.setupEventListeners();
        this.loadSettings();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 监听聊天切换
        if (typeof this_chid !== 'undefined') {
            this.currentChatId = this_chid;
        }

        // 使用SillyTavern的事件系统监听消息
        this.setupSillyTavernEventListeners();
        
        // 备用方案：DOM监听
        document.addEventListener('DOMContentLoaded', () => {
            this.observeMessageChanges();
        });
    }

    /**
     * 设置SillyTavern事件监听器
     */
    setupSillyTavernEventListeners() {
        try {
            // 检查SillyTavern事件系统是否可用
            if (typeof eventSource !== 'undefined' && typeof event_types !== 'undefined') {
                console.log('[DMSS Core] 使用SillyTavern事件系统监听消息');
                
                // 监听AI生成的消息
                eventSource.on(event_types.MESSAGE_RECEIVED, (messageData) => {
                    this.handleMessageReceived(messageData);
                });
                
                // 监听聊天切换
                eventSource.on(event_types.CHAT_CHANGED, () => {
                    this.handleChatChanged();
                });
                
                // 监听聊天加载
                eventSource.on(event_types.CHAT_LOADED, () => {
                    this.handleChatLoaded();
                });
                
                console.log('[DMSS Core] SillyTavern事件监听器已设置');
            } else {
                console.warn('[DMSS Core] SillyTavern事件系统不可用，使用DOM监听');
            }
        } catch (error) {
            console.error('[DMSS Core] 设置SillyTavern事件监听器失败:', error);
        }
    }

    /**
     * 处理AI生成的消息
     */
    handleMessageReceived(messageData) {
        if (!this.isEnabled) return;
        
        try {
            console.log('[DMSS Core] 收到AI消息:', messageData);
            
            // 提取消息文本
            let messageText = '';
            if (typeof messageData === 'string') {
                messageText = messageData;
            } else if (messageData && messageData.text) {
                messageText = messageData.text;
            } else if (messageData && messageData.content) {
                messageText = messageData.content;
            }
            
            if (messageText) {
                this.scanForDMSSContent(messageText);
            }
        } catch (error) {
            console.error('[DMSS Core] 处理AI消息失败:', error);
        }
    }

    /**
     * 处理聊天切换
     */
    handleChatChanged() {
        console.log('[DMSS Core] 聊天已切换');
        this.currentChatId = this.getCurrentChatId();
        this.triggerUpdateEvent();
    }

    /**
     * 处理聊天加载
     */
    handleChatLoaded() {
        console.log('[DMSS Core] 聊天已加载');
        this.currentChatId = this.getCurrentChatId();
        this.triggerUpdateEvent();
    }

    /**
     * 观察消息变化
     */
    observeMessageChanges() {
        const messageObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.scanForDMSSContent(node);
                        }
                    });
                }
            });
        });

        // 观察聊天消息容器
        const chatContainer = document.querySelector('#chat') || 
                             document.querySelector('.chat-container') ||
                             document.querySelector('.chat') ||
                             document.querySelector('[class*="chat"]');
                             
        if (chatContainer) {
            messageObserver.observe(chatContainer, {
                childList: true,
                subtree: true
            });
            console.log('[DMSS Core] DOM消息监听器已设置');
        } else {
            console.warn('[DMSS Core] 未找到聊天容器，DOM监听器设置失败');
        }
    }

    /**
     * 扫描DMSS内容
     */
    scanForDMSSContent(element) {
        if (!this.isEnabled) return;

        try {
            // 获取文本内容
            let textContent = '';
            if (typeof element === 'string') {
                textContent = element;
            } else if (element && element.textContent) {
                textContent = element.textContent;
            } else if (element && element.innerText) {
                textContent = element.innerText;
            } else if (element && element.innerHTML) {
                // 对于HTML内容，先提取纯文本
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = element.innerHTML;
                textContent = tempDiv.textContent || tempDiv.innerText || '';
            }

            if (!textContent || textContent.trim().length === 0) {
                return;
            }

            // 检查是否包含DMSS标签
            if (!textContent.includes('<DMSS>') || !textContent.includes('</DMSS>')) {
                return;
            }

            console.log('[DMSS Core] 扫描到可能包含DMSS的内容，长度:', textContent.length);
            
            const dmssMatches = this.extractDMSSContent(textContent);

            if (dmssMatches.length > 0) {
                console.log('[DMSS Core] 发现DMSS内容:', dmssMatches.length, '个匹配');
                this.processDMSSContent(dmssMatches);
            }
        } catch (error) {
            console.error('[DMSS Core] 扫描DMSS内容失败:', error);
        }
    }

    /**
     * 提取DMSS内容
     */
    extractDMSSContent(text) {
        const matches = [];
        let match;
        
        // 重置正则表达式
        this.regexPattern.lastIndex = 0;
        
        while ((match = this.regexPattern.exec(text)) !== null) {
            matches.push({
                fullMatch: match[0],
                content: match[1].trim(),
                startIndex: match.index,
                endIndex: match.index + match[0].length,
                timestamp: Date.now()
            });
        }
        
        return matches;
    }

    /**
     * 处理DMSS内容
     */
    async processDMSSContent(matches) {
        try {
            for (const match of matches) {
                await this.storeDMSSContent(match);
            }
            
            // 触发更新事件
            this.triggerUpdateEvent();
            
        } catch (error) {
            console.error('[DMSS Core] 处理DMSS内容失败:', error);
        }
    }

    /**
     * 存储DMSS内容
     */
    async storeDMSSContent(match) {
        let chatId = this.getCurrentChatId();
        
        // 如果无法获取聊天ID，使用默认ID
        if (!chatId) {
            chatId = 'default_chat';
            console.warn('[DMSS Core] 无法获取当前聊天ID，使用默认ID:', chatId);
        }

        const storageKey = `${this.storagePrefix}${chatId}`;
        
        try {
            // 获取现有内容
            const existingContent = await this.getStoredContent(storageKey);
            
            // 合并内容
            const mergedContent = this.mergeDMSSContent(existingContent, match.content);
            
            // 存储到SillyTavern的Data Bank
            await this.storeToDataBank(chatId, mergedContent);
            
            // 更新缓存
            this.memoryCache.set(storageKey, mergedContent);
            
            console.log('[DMSS Core] DMSS内容已存储到:', chatId);
            
        } catch (error) {
            console.error('[DMSS Core] 存储DMSS内容失败:', error);
            
            // 备用存储方案：使用localStorage
            try {
                const mergedContent = this.mergeDMSSContent(
                    await this.getStoredContent(storageKey), 
                    match.content
                );
                localStorage.setItem(storageKey, mergedContent);
                this.memoryCache.set(storageKey, mergedContent);
                console.log('[DMSS Core] DMSS内容已存储到localStorage');
            } catch (fallbackError) {
                console.error('[DMSS Core] 备用存储也失败:', fallbackError);
            }
        }
    }

    /**
     * 合并DMSS内容
     */
    mergeDMSSContent(existing, newContent) {
        if (!existing) {
            return newContent;
        }

        // 解析现有内容
        const existingSections = this.parseDMSSSections(existing);
        const newSections = this.parseDMSSSections(newContent);

        // 合并逻辑
        return this.mergeSections(existingSections, newSections);
    }

    /**
     * 解析DMSS段落
     */
    parseDMSSSections(content) {
        const sections = {
            archive: [],
            standby: [],
            metadata: {
                lastUpdated: Date.now(),
                version: 1
            }
        };

        const lines = content.split('\n');
        let currentSection = null;

        for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (trimmedLine.includes('[档案区') || trimmedLine.includes('Permanent Archive')) {
                currentSection = 'archive';
                continue;
            } else if (trimmedLine.includes('[备用区') || trimmedLine.includes('Standby Roster')) {
                currentSection = 'standby';
                continue;
            }

            if (currentSection && trimmedLine) {
                sections[currentSection].push(trimmedLine);
            }
        }

        return sections;
    }

    /**
     * 合并段落
     */
    mergeSections(existingSections, newSections) {
        // 简单的合并策略：新内容追加到现有内容
        const merged = {
            archive: [...existingSections.archive, ...newSections.archive],
            standby: [...existingSections.standby, ...newSections.standby],
            metadata: {
                lastUpdated: Date.now(),
                version: existingSections.metadata.version + 1
            }
        };

        // 重新格式化内容
        return this.formatDMSSContent(merged);
    }

    /**
     * 格式化DMSS内容
     */
    formatDMSSContent(sections) {
        let content = '<DMSS>\n';
        
        if (sections.archive.length > 0) {
            content += '[档案区 | Permanent Archive]\n';
            sections.archive.forEach(item => {
                content += `${item}\n`;
            });
            content += '\n';
        }

        if (sections.standby.length > 0) {
            content += '[备用区 | Standby Roster]\n';
            sections.standby.forEach(item => {
                content += `${item}\n`;
            });
        }

        content += '</DMSS>';
        return content;
    }

    /**
     * 存储到Data Bank
     */
    async storeToDataBank(chatId, content) {
        try {
            // 使用SillyTavern的slash命令存储
            if (typeof window !== 'undefined' && window.stScript) {
                try {
                    // 先尝试更新
                    await window.stScript.runCommand(`/db-update source=chat name=DMSS_${chatId} "${content}"`);
                    console.log('[DMSS Core] Data Bank更新成功');
                } catch (updateError) {
                    console.warn('[DMSS Core] Data Bank更新失败，尝试添加:', updateError);
                    // 如果更新失败，尝试添加
                    await window.stScript.runCommand(`/db-add source=chat name=DMSS_${chatId} "${content}"`);
                    console.log('[DMSS Core] Data Bank添加成功');
                }
            } else {
                // 备用方案1：使用全局变量
                if (typeof setGlobalVar !== 'undefined') {
                    setGlobalVar(`DMSS_${chatId}`, content);
                    console.log('[DMSS Core] 使用全局变量存储成功');
                } else {
                    // 备用方案2：使用localStorage
                    localStorage.setItem(`DMSS_${chatId}`, content);
                    console.log('[DMSS Core] 使用localStorage存储成功');
                }
            }
        } catch (error) {
            console.error('[DMSS Core] 存储到Data Bank失败:', error);
            throw error;
        }
    }

    /**
     * 从存储获取内容
     */
    async getStoredContent(storageKey) {
        try {
            // 先从缓存获取
            if (this.memoryCache.has(storageKey)) {
                return this.memoryCache.get(storageKey);
            }

            // 从Data Bank获取
            if (typeof window !== 'undefined' && window.stScript) {
                try {
                    const result = await window.stScript.runCommand(`/db-get source=chat name=${storageKey}`);
                    if (result && result.trim()) {
                        this.memoryCache.set(storageKey, result);
                        return result;
                    }
                } catch (dbError) {
                    console.warn('[DMSS Core] Data Bank获取失败，尝试备用方案:', dbError);
                }
            }

            // 备用方案1：从全局变量获取
            if (typeof getGlobalVar !== 'undefined') {
                try {
                    const result = getGlobalVar(storageKey);
                    if (result) {
                        this.memoryCache.set(storageKey, result);
                        return result;
                    }
                } catch (globalVarError) {
                    console.warn('[DMSS Core] 全局变量获取失败:', globalVarError);
                }
            }

            // 备用方案2：从localStorage获取
            try {
                const result = localStorage.getItem(storageKey);
                if (result) {
                    this.memoryCache.set(storageKey, result);
                    return result;
                }
            } catch (localStorageError) {
                console.warn('[DMSS Core] localStorage获取失败:', localStorageError);
            }

            return null;
        } catch (error) {
            console.error('[DMSS Core] 获取存储内容失败:', error);
            return null;
        }
    }

    /**
     * 获取当前聊天ID
     */
    getCurrentChatId() {
        // 方案1：使用SillyTavern的全局变量
        if (typeof this_chid !== 'undefined' && this_chid) {
            return this_chid;
        }
        
        // 方案2：使用getCurrentChatId函数（如果存在）
        if (typeof getCurrentChatId === 'function') {
            try {
                const chatId = getCurrentChatId();
                if (chatId) return chatId;
            } catch (error) {
                console.warn('[DMSS Core] getCurrentChatId函数调用失败:', error);
            }
        }
        
        // 方案3：从URL获取
        const urlMatch = window.location.pathname.match(/\/chat\/([^\/]+)/);
        if (urlMatch) {
            return urlMatch[1];
        }
        
        // 方案4：从localStorage获取
        try {
            const savedChatId = localStorage.getItem('current_chat_id');
            if (savedChatId) {
                return savedChatId;
            }
        } catch (error) {
            console.warn('[DMSS Core] 从localStorage获取聊天ID失败:', error);
        }
        
        // 方案5：生成临时聊天ID（用于测试）
        if (this.debugMode) {
            const tempChatId = 'temp_chat_' + Date.now();
            console.log('[DMSS Core] 使用临时聊天ID:', tempChatId);
            return tempChatId;
        }
        
        console.warn('[DMSS Core] 无法获取当前聊天ID');
        return null;
    }

    /**
     * 启动DMSS
     */
    start() {
        this.isEnabled = true;
        this.currentChatId = this.getCurrentChatId();
        console.log('[DMSS Core] DMSS已启动，当前聊天:', this.currentChatId);
        this.triggerUpdateEvent();
    }

    /**
     * 停止DMSS
     */
    stop() {
        this.isEnabled = false;
        console.log('[DMSS Core] DMSS已停止');
        this.triggerUpdateEvent();
    }

    /**
     * 重置DMSS
     */
    async reset() {
        const chatId = this.getCurrentChatId();
        if (chatId) {
            const storageKey = `${this.storagePrefix}${chatId}`;
            
            // 清除Data Bank
            try {
                if (typeof window !== 'undefined' && window.stScript) {
                    await window.stScript.runCommand(`/db-delete source=chat name=${storageKey}`);
                }
            } catch (error) {
                console.error('[DMSS Core] 清除Data Bank失败:', error);
            }

            // 清除缓存
            this.memoryCache.delete(storageKey);
        }

        console.log('[DMSS Core] DMSS已重置');
        this.triggerUpdateEvent();
    }

    /**
     * 获取当前记忆内容
     */
    async getCurrentMemory() {
        const chatId = this.getCurrentChatId();
        if (!chatId) return '';

        const storageKey = `${this.storagePrefix}${chatId}`;
        return await this.getStoredContent(storageKey) || '';
    }

    /**
     * 获取记忆统计信息
     */
    async getMemoryStats() {
        const content = await this.getCurrentMemory();
        if (!content) {
            return {
                totalLines: 0,
                archiveCount: 0,
                standbyCount: 0,
                lastUpdated: null
            };
        }

        const sections = this.parseDMSSSections(content);
        return {
            totalLines: content.split('\n').length,
            archiveCount: sections.archive.length,
            standbyCount: sections.standby.length,
            lastUpdated: new Date(sections.metadata.lastUpdated)
        };
    }

    /**
     * 触发更新事件
     */
    triggerUpdateEvent() {
        const event = new CustomEvent('dmssUpdate', {
            detail: {
                enabled: this.isEnabled,
                chatId: this.currentChatId,
                timestamp: Date.now()
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * 加载设置
     */
    loadSettings() {
        try {
            const settings = localStorage.getItem('dmss_settings');
            if (settings) {
                const parsed = JSON.parse(settings);
                this.debugMode = parsed.debugMode || false;
            }
        } catch (error) {
            console.error('[DMSS Core] 加载设置失败:', error);
        }
    }

    /**
     * 保存设置
     */
    saveSettings() {
        try {
            const settings = {
                debugMode: this.debugMode
            };
            localStorage.setItem('dmss_settings', JSON.stringify(settings));
        } catch (error) {
            console.error('[DMSS Core] 保存设置失败:', error);
        }
    }

    /**
     * 设置调试模式
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        this.saveSettings();
        console.log('[DMSS Core] 调试模式:', enabled ? '开启' : '关闭');
    }

    /**
     * 手动处理文本内容
     */
    async processText(text) {
        if (!this.isEnabled) return;

        const matches = this.extractDMSSContent(text);
        if (matches.length > 0) {
            await this.processDMSSContent(matches);
            return matches;
        }
        
        return [];
    }

    /**
     * 手动扫描当前聊天的最新消息
     */
    async scanLatestMessages() {
        if (!this.isEnabled) {
            console.log('[DMSS Core] DMSS未启用，跳过扫描');
            return;
        }

        try {
            console.log('[DMSS Core] 开始手动扫描最新消息...');
            
            // 查找聊天消息容器
            const chatContainer = document.querySelector('#chat') || 
                                 document.querySelector('.chat-container') ||
                                 document.querySelector('.chat') ||
                                 document.querySelector('[class*="chat"]');
            
            if (!chatContainer) {
                console.warn('[DMSS Core] 未找到聊天容器');
                return;
            }

            // 查找所有消息元素
            const messageElements = chatContainer.querySelectorAll('[class*="message"], [class*="msg"], .mes, .message');
            
            console.log('[DMSS Core] 找到', messageElements.length, '个消息元素');
            
            let scannedCount = 0;
            let foundCount = 0;
            
            // 扫描最近的消息（最多扫描最后10条）
            const recentMessages = Array.from(messageElements).slice(-10);
            
            for (const messageElement of recentMessages) {
                scannedCount++;
                const originalLength = this.extractDMSSContent(messageElement.textContent || '').length;
                
                this.scanForDMSSContent(messageElement);
                
                const newLength = this.extractDMSSContent(messageElement.textContent || '').length;
                if (newLength > originalLength) {
                    foundCount++;
                }
            }
            
            console.log(`[DMSS Core] 扫描完成: 扫描了${scannedCount}条消息，发现${foundCount}条包含DMSS内容`);
            
        } catch (error) {
            console.error('[DMSS Core] 手动扫描失败:', error);
        }
    }

    /**
     * 强制扫描整个聊天
     */
    async forceScanChat() {
        if (!this.isEnabled) {
            console.log('[DMSS Core] DMSS未启用，跳过强制扫描');
            return;
        }

        try {
            console.log('[DMSS Core] 开始强制扫描整个聊天...');
            
            // 查找聊天消息容器
            const chatContainer = document.querySelector('#chat') || 
                                 document.querySelector('.chat-container') ||
                                 document.querySelector('.chat') ||
                                 document.querySelector('[class*="chat"]');
            
            if (!chatContainer) {
                console.warn('[DMSS Core] 未找到聊天容器');
                return;
            }

            // 获取所有文本内容
            const allText = chatContainer.textContent || chatContainer.innerText || '';
            
            if (!allText.includes('<DMSS>')) {
                console.log('[DMSS Core] 聊天中未发现DMSS标签');
                return;
            }

            console.log('[DMSS Core] 聊天中发现DMSS标签，开始提取...');
            
            const matches = this.extractDMSSContent(allText);
            
            if (matches.length > 0) {
                console.log('[DMSS Core] 强制扫描发现', matches.length, '个DMSS内容');
                await this.processDMSSContent(matches);
            } else {
                console.log('[DMSS Core] 强制扫描未发现有效的DMSS内容');
            }
            
        } catch (error) {
            console.error('[DMSS Core] 强制扫描失败:', error);
        }
    }
}

// 导出到全局
if (typeof window !== 'undefined') {
window.DMSSCore = DMSSCore;
}

console.log('[DMSS Core] 动态记忆流系统核心模块已加载');
