/**
 * DMSS (Dynamic Memory Stream System) 核心模块
 * 负责捕获、存储和管理AI生成的记忆内容
 */

class DMSSCore {
    constructor() {
        this.storageKey = 'janus_dmss_memories';
        this.currentChatId = null;
        this.memories = new Map(); // 存储格式: chatId -> Array<memory>
        this.isEnabled = false;
        
        // 初始化
        this.init();
    }
    
    /**
     * 初始化DMSS系统
     */
    init() {
        console.log('[DMSS Core] 初始化DMSS核心模块');
        this.loadMemories();
        this.setupMessageListener();
        this.currentChatId = this.getCurrentChatId();
    }
    
    /**
     * 获取当前聊天ID
     */
    getCurrentChatId() {
        // 尝试从SillyTavern的全局变量获取当前聊天ID
        if (window.chat && window.chat.length > 0) {
            return window.chat[window.chat.length - 1].id || 'default';
        }
        return 'default';
    }
    
    /**
     * 设置消息监听器，监听AI生成的消息
     */
    setupMessageListener() {
        // 监听消息生成完成事件
        if (window.eventSource) {
            window.eventSource.addEventListener('message', (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'message' && data.data && data.data.name !== 'You') {
                        // AI消息生成完成，检查是否包含DMSS内容
                        setTimeout(() => {
                            this.checkAndCaptureDMSS(data.data);
                        }, 100);
                    }
                } catch (error) {
                    // 忽略解析错误
                }
            });
        }
        
        // 备用方案：监听DOM变化
        this.setupDOMObserver();
    }
    
    /**
     * 设置DOM观察器作为备用方案
     */
    setupDOMObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE && 
                            node.classList && 
                            node.classList.contains('mes')) {
                            this.checkMessageForDMSS(node);
                        }
                    });
                }
            });
        });
        
        const chatContainer = document.querySelector('#chat');
        if (chatContainer) {
            observer.observe(chatContainer, {
                childList: true,
                subtree: true
            });
        }
    }
    
    /**
     * 检查消息中是否包含DMSS内容
     */
    checkMessageForDMSS(messageElement) {
        if (!this.isEnabled) return;
        
        const messageText = messageElement.textContent || '';
        this.captureDMSSContent(messageText);
    }
    
    /**
     * 检查并捕获DMSS内容（从事件数据）
     */
    checkAndCaptureDMSS(messageData) {
        if (!this.isEnabled) return;
        
        const messageText = messageData.mes || '';
        this.captureDMSSContent(messageText);
    }
    
    /**
     * 使用正则表达式捕获DMSS内容
     */
    captureDMSSContent(text) {
        // 正则表达式：捕获<DMSS>和</DMSS>之间的内容，最大深度为0
        const dmssRegex = /<DMSS>([\s\S]*?)<\/DMSS>/g;
        const matches = text.match(dmssRegex);
        
        if (matches && matches.length > 0) {
            matches.forEach(match => {
                // 提取DMSS标签内的内容
                const contentMatch = match.match(/<DMSS>([\s\S]*?)<\/DMSS>/);
                if (contentMatch && contentMatch[1]) {
                    const dmssContent = contentMatch[1].trim();
                    if (dmssContent) {
                        this.storeDMSSMemory(dmssContent);
                        console.log('[DMSS Core] 捕获到DMSS内容:', dmssContent.substring(0, 100) + '...');
                    }
                }
            });
        }
    }
    
    /**
     * 存储DMSS记忆内容
     */
    storeDMSSMemory(content) {
        const chatId = this.getCurrentChatId();
        const memory = {
            id: this.generateMemoryId(),
            content: content,
            timestamp: new Date().toISOString(),
            chatId: chatId,
            createdAt: Date.now()
        };
        
        // 获取当前聊天的记忆数组
        if (!this.memories.has(chatId)) {
            this.memories.set(chatId, []);
        }
        
        const chatMemories = this.memories.get(chatId);
        chatMemories.push(memory);
        
        // 保存到永久存储
        this.saveMemories();
        
        // 触发更新事件
        this.triggerMemoryUpdate(chatId, memory);
        
        console.log(`[DMSS Core] 已存储记忆到聊天 ${chatId}:`, memory.id);
    }
    
    /**
     * 生成记忆ID
     */
    generateMemoryId() {
        return 'dmss_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * 从永久存储加载记忆
     */
    loadMemories() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const data = JSON.parse(stored);
                this.memories = new Map(data);
                console.log('[DMSS Core] 已加载记忆数据:', this.memories.size, '个聊天');
            }
        } catch (error) {
            console.error('[DMSS Core] 加载记忆失败:', error);
            this.memories = new Map();
        }
    }
    
    /**
     * 保存记忆到永久存储
     */
    saveMemories() {
        try {
            const data = Array.from(this.memories.entries());
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            console.log('[DMSS Core] 记忆已保存到永久存储');
        } catch (error) {
            console.error('[DMSS Core] 保存记忆失败:', error);
        }
    }
    
    /**
     * 获取指定聊天的记忆
     */
    getMemoriesForChat(chatId = null) {
        const targetChatId = chatId || this.getCurrentChatId();
        return this.memories.get(targetChatId) || [];
    }
    
    /**
     * 获取所有记忆
     */
    getAllMemories() {
        const allMemories = [];
        this.memories.forEach((memories, chatId) => {
            memories.forEach(memory => {
                allMemories.push({
                    ...memory,
                    chatId: chatId
                });
            });
        });
        return allMemories.sort((a, b) => b.createdAt - a.createdAt);
    }
    
    /**
     * 删除指定记忆
     */
    deleteMemory(memoryId, chatId = null) {
        const targetChatId = chatId || this.getCurrentChatId();
        const chatMemories = this.memories.get(targetChatId);
        
        if (chatMemories) {
            const index = chatMemories.findIndex(m => m.id === memoryId);
            if (index !== -1) {
                const deleted = chatMemories.splice(index, 1)[0];
                this.saveMemories();
                console.log('[DMSS Core] 已删除记忆:', memoryId);
                return deleted;
            }
        }
        return null;
    }
    
    /**
     * 清空指定聊天的所有记忆
     */
    clearChatMemories(chatId = null) {
        const targetChatId = chatId || this.getCurrentChatId();
        const cleared = this.memories.delete(targetChatId);
        this.saveMemories();
        
        if (cleared) {
            console.log(`[DMSS Core] 已清空聊天 ${targetChatId} 的所有记忆`);
        }
        return cleared;
    }
    
    /**
     * 清空所有记忆
     */
    clearAllMemories() {
        this.memories.clear();
        this.saveMemories();
        console.log('[DMSS Core] 已清空所有记忆');
    }
    
    /**
     * 启用DMSS系统
     */
    enable() {
        this.isEnabled = true;
        console.log('[DMSS Core] DMSS系统已启用');
    }
    
    /**
     * 禁用DMSS系统
     */
    disable() {
        this.isEnabled = false;
        console.log('[DMSS Core] DMSS系统已禁用');
    }
    
    /**
     * 获取系统状态
     */
    getStatus() {
        return {
            enabled: this.isEnabled,
            currentChatId: this.getCurrentChatId(),
            totalChats: this.memories.size,
            totalMemories: this.getAllMemories().length,
            lastUpdate: this.getLastUpdateTime()
        };
    }
    
    /**
     * 获取最后更新时间
     */
    getLastUpdateTime() {
        const allMemories = this.getAllMemories();
        if (allMemories.length > 0) {
            return new Date(allMemories[0].createdAt).toLocaleString();
        }
        return '从未';
    }
    
    /**
     * 触发记忆更新事件
     */
    triggerMemoryUpdate(chatId, memory) {
        // 触发自定义事件，供UI监听
        const event = new CustomEvent('dmssMemoryUpdate', {
            detail: {
                chatId: chatId,
                memory: memory,
                timestamp: Date.now()
            }
        });
        window.dispatchEvent(event);
    }
    
    /**
     * 重置DMSS系统
     */
    reset() {
        this.clearAllMemories();
        this.isEnabled = false;
        console.log('[DMSS Core] DMSS系统已重置');
    }
}

// 创建全局实例
window.DMSSCore = new DMSSCore();

console.log('[DMSS Core] DMSS核心模块已加载完成');
