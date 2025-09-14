/**
 * DMSS (Dynamic Memory Stream System) 核心模块
 * 负责捕获、存储和管理AI生成的DMSS内容
 */

class DMSSCore {
    constructor() {
        this.storageKey = 'janus_dmss_memory';
        this.currentChatId = null;
        this.isEnabled = false;
        this.lastProcessedMessageId = null;
        
        // DMSS内容正则表达式
        this.dmssRegex = /<DMSS>([\s\S]*?)<\/DMSS>/g;
        
        console.log('[DMSS Core] 初始化完成');
    }

    /**
     * 初始化DMSS系统
     */
    init() {
        this.currentChatId = this.getCurrentChatId();
        this.loadSettings();
        console.log(`[DMSS Core] 初始化完成，当前聊天ID: ${this.currentChatId}`);
    }

    /**
     * 获取当前聊天ID
     */
    getCurrentChatId() {
        // 从SillyTavern获取当前聊天ID
        if (window.chat && window.chat.length > 0) {
            return window.chat[window.chat.length - 1].id || 'default';
        }
        return 'default';
    }

    /**
     * 启动DMSS系统
     */
    start() {
        this.isEnabled = true;
        this.setupMessageListener();
        console.log('[DMSS Core] 系统已启动');
    }

    /**
     * 停止DMSS系统
     */
    stop() {
        this.isEnabled = false;
        this.removeMessageListener();
        console.log('[DMSS Core] 系统已停止');
    }

    /**
     * 设置消息监听器
     */
    setupMessageListener() {
        // 监听新消息生成
        if (window.eventSource && window.eventSource.addEventListener) {
            window.eventSource.addEventListener('message', this.handleNewMessage.bind(this));
        }
        
        // 监听聊天更新
        if (window.chat) {
            this.observeChatChanges();
        }
    }

    /**
     * 移除消息监听器
     */
    removeMessageListener() {
        // 清理监听器
        if (window.eventSource && window.eventSource.removeEventListener) {
            window.eventSource.removeEventListener('message', this.handleNewMessage.bind(this));
        }
    }

    /**
     * 处理新消息
     */
    handleNewMessage(event) {
        if (!this.isEnabled) return;
        
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'message' && data.message) {
                this.processMessage(data.message);
            }
        } catch (error) {
            console.error('[DMSS Core] 处理消息失败:', error);
        }
    }

    /**
     * 观察聊天变化
     */
    observeChatChanges() {
        // 使用MutationObserver监听聊天DOM变化
        const chatContainer = document.querySelector('#chat');
        if (chatContainer) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                this.checkForDMSSContent(node);
                            }
                        });
                    }
                });
            });
            
            observer.observe(chatContainer, {
                childList: true,
                subtree: true
            });
            
            this.chatObserver = observer;
        }
    }

    /**
     * 检查节点中的DMSS内容
     */
    checkForDMSSContent(node) {
        if (!this.isEnabled) return;
        
        // 查找包含DMSS内容的文本节点
        const walker = document.createTreeWalker(
            node,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        let textNode;
        while (textNode = walker.nextNode()) {
            const text = textNode.textContent;
            if (text.includes('<DMSS>') && text.includes('</DMSS>')) {
                this.extractAndStoreDMSS(text);
            }
        }
    }

    /**
     * 处理消息内容
     */
    processMessage(message) {
        if (!this.isEnabled || !message) return;
        
        // 检查消息是否包含DMSS内容
        if (message.includes('<DMSS>') && message.includes('</DMSS>')) {
            this.extractAndStoreDMSS(message);
        }
    }

    /**
     * 提取并存储DMSS内容
     */
    extractAndStoreDMSS(content) {
        try {
            const matches = content.match(this.dmssRegex);
            if (matches && matches.length > 0) {
                matches.forEach((match, index) => {
                    // 提取DMSS标签内的内容
                    const dmssContent = match.replace(/<\/?DMSS>/g, '').trim();
                    
                    if (dmssContent) {
                        this.storeDMSSContent(dmssContent, index);
                        console.log(`[DMSS Core] 捕获到DMSS内容 (${index + 1}/${matches.length})`);
                    }
                });
            }
        } catch (error) {
            console.error('[DMSS Core] 提取DMSS内容失败:', error);
        }
    }

    /**
     * 存储DMSS内容
     */
    storeDMSSContent(content, index = 0) {
        try {
            const chatId = this.getCurrentChatId();
            const timestamp = new Date().toISOString();
            
            // 创建DMSS记录
            const dmssRecord = {
                id: this.generateId(),
                chatId: chatId,
                content: content,
                timestamp: timestamp,
                index: index,
                processed: true
            };
            
            // 获取现有存储
            const storage = this.getStorage();
            
            // 确保聊天记录存在
            if (!storage.chats[chatId]) {
                storage.chats[chatId] = {
                    id: chatId,
                    name: this.getChatName(),
                    created: timestamp,
                    dmssRecords: []
                };
            }
            
            // 添加新记录
            storage.chats[chatId].dmssRecords.push(dmssRecord);
            storage.lastUpdated = timestamp;
            
            // 保存到localStorage
            this.saveStorage(storage);
            
            console.log(`[DMSS Core] DMSS内容已存储到聊天: ${chatId}`);
            
            // 触发更新事件
            this.triggerUpdateEvent(dmssRecord);
            
        } catch (error) {
            console.error('[DMSS Core] 存储DMSS内容失败:', error);
        }
    }

    /**
     * 生成唯一ID
     */
    generateId() {
        return 'dmss_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 获取聊天名称
     */
    getChatName() {
        // 尝试从SillyTavern获取聊天名称
        if (window.chat && window.chat.length > 0) {
            const currentChat = window.chat[window.chat.length - 1];
            return currentChat.name || `聊天_${this.currentChatId}`;
        }
        return `聊天_${this.currentChatId}`;
    }

    /**
     * 获取存储数据
     */
    getStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('[DMSS Core] 读取存储失败:', error);
        }
        
        // 返回默认结构
        return {
            version: '1.0.0',
            created: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            chats: {}
        };
    }

    /**
     * 保存存储数据
     */
    saveStorage(storage) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(storage));
        } catch (error) {
            console.error('[DMSS Core] 保存存储失败:', error);
        }
    }

    /**
     * 获取指定聊天的DMSS记录
     */
    getDMSSRecords(chatId = null) {
        const storage = this.getStorage();
        const targetChatId = chatId || this.getCurrentChatId();
        
        if (storage.chats[targetChatId]) {
            return storage.chats[targetChatId].dmssRecords || [];
        }
        
        return [];
    }

    /**
     * 获取所有聊天的DMSS记录
     */
    getAllDMSSRecords() {
        const storage = this.getStorage();
        const allRecords = [];
        
        Object.values(storage.chats).forEach(chat => {
            if (chat.dmssRecords) {
                chat.dmssRecords.forEach(record => {
                    allRecords.push({
                        ...record,
                        chatName: chat.name
                    });
                });
            }
        });
        
        return allRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * 删除指定聊天的所有DMSS记录
     */
    clearDMSSRecords(chatId = null) {
        const storage = this.getStorage();
        const targetChatId = chatId || this.getCurrentChatId();
        
        if (storage.chats[targetChatId]) {
            storage.chats[targetChatId].dmssRecords = [];
            storage.lastUpdated = new Date().toISOString();
            this.saveStorage(storage);
            console.log(`[DMSS Core] 已清空聊天 ${targetChatId} 的DMSS记录`);
        }
    }

    /**
     * 重置所有DMSS数据
     */
    resetAllData() {
        try {
            localStorage.removeItem(this.storageKey);
            console.log('[DMSS Core] 所有DMSS数据已重置');
        } catch (error) {
            console.error('[DMSS Core] 重置数据失败:', error);
        }
    }

    /**
     * 触发更新事件
     */
    triggerUpdateEvent(record) {
        // 触发自定义事件，通知UI更新
        const event = new CustomEvent('dmssUpdated', {
            detail: {
                record: record,
                chatId: this.getCurrentChatId()
            }
        });
        window.dispatchEvent(event);
    }

    /**
     * 加载设置
     */
    loadSettings() {
        try {
            const settings = localStorage.getItem('janus_dmss_settings');
            if (settings) {
                const parsed = JSON.parse(settings);
                this.isEnabled = parsed.enabled || false;
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
                enabled: this.isEnabled,
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem('janus_dmss_settings', JSON.stringify(settings));
        } catch (error) {
            console.error('[DMSS Core] 保存设置失败:', error);
        }
    }

    /**
     * 获取系统状态
     */
    getStatus() {
        const storage = this.getStorage();
        const totalRecords = Object.values(storage.chats).reduce((sum, chat) => {
            return sum + (chat.dmssRecords ? chat.dmssRecords.length : 0);
        }, 0);
        
        return {
            enabled: this.isEnabled,
            currentChatId: this.getCurrentChatId(),
            totalChats: Object.keys(storage.chats).length,
            totalRecords: totalRecords,
            lastUpdated: storage.lastUpdated
        };
    }
}

// 创建全局实例
window.DMSSCore = DMSSCore;

console.log('[DMSS Core] 模块加载完成');
