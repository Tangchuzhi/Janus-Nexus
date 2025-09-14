/**
 * DMSS (Dynamic Memory Stream System) 核心模块
 * 负责捕获、存储和管理动态记忆流内容
 */

class DMSSCore {
    constructor() {
        this.storageKey = 'janus_dmss_memory';
        this.currentChatId = null;
        this.isEnabled = false;
        this.memoryData = new Map(); // 存储格式: chatId -> { memories: [], lastUpdate: timestamp }
        
        console.log('[DMSS Core] 初始化完成');
    }

    /**
     * 初始化DMSS系统
     */
    init() {
        this.loadMemoryData();
        this.setupMessageListener();
        console.log('[DMSS Core] 系统初始化完成');
    }

    /**
     * 启动DMSS系统
     */
    start() {
        this.isEnabled = true;
        this.currentChatId = this.getCurrentChatId();
        console.log(`[DMSS Core] 系统已启动，当前聊天ID: ${this.currentChatId}`);
    }

    /**
     * 停止DMSS系统
     */
    stop() {
        this.isEnabled = false;
        console.log('[DMSS Core] 系统已停止');
    }

    /**
     * 重置DMSS系统
     */
    reset() {
        this.memoryData.clear();
        this.saveMemoryData();
        console.log('[DMSS Core] 系统已重置');
    }

    /**
     * 获取当前聊天ID
     */
    getCurrentChatId() {
        // 尝试从SillyTavern的全局变量获取当前聊天ID
        if (typeof chat !== 'undefined' && chat.chatId) {
            return chat.chatId;
        }
        
        // 备用方案：使用时间戳作为聊天ID
        return `chat_${Date.now()}`;
    }

    /**
     * 设置消息监听器
     */
    setupMessageListener() {
        // 监听AI生成的消息，捕获DMSS内容
        const originalSendMessage = window.sendMessage;
        if (originalSendMessage) {
            window.sendMessage = (...args) => {
                const result = originalSendMessage.apply(this, args);
                
                // 延迟检查消息内容，确保消息已添加到聊天中
                setTimeout(() => {
                    this.checkForDMSSContent();
                }, 1000);
                
                return result;
            };
        }

        // 监听DOM变化，检测新消息
        const observer = new MutationObserver((mutations) => {
            if (!this.isEnabled) return;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.checkNodeForDMSS(node);
                        }
                    });
                }
            });
        });

        // 开始观察聊天区域的变化
        const chatContainer = document.querySelector('#chat') || document.querySelector('.chat-container');
        if (chatContainer) {
            observer.observe(chatContainer, {
                childList: true,
                subtree: true
            });
        }
    }

    /**
     * 检查节点中是否包含DMSS内容
     */
    checkNodeForDMSS(node) {
        if (!this.isEnabled) return;

        // 查找包含DMSS标签的文本内容
        const textContent = node.textContent || '';
        if (textContent.includes('<DMSS>') && textContent.includes('</DMSS>')) {
            this.extractDMSSContent(textContent);
        }

        // 递归检查子节点
        const children = node.querySelectorAll('*');
        children.forEach(child => {
            const childText = child.textContent || '';
            if (childText.includes('<DMSS>') && childText.includes('</DMSS>')) {
                this.extractDMSSContent(childText);
            }
        });
    }

    /**
     * 检查最新的消息内容
     */
    checkForDMSSContent() {
        if (!this.isEnabled) return;

        // 获取最新的AI消息
        const messages = document.querySelectorAll('.mes');
        if (messages.length === 0) return;

        const lastMessage = messages[messages.length - 1];
        const messageText = lastMessage.textContent || '';

        if (messageText.includes('<DMSS>') && messageText.includes('</DMSS>')) {
            this.extractDMSSContent(messageText);
        }
    }

    /**
     * 使用正则表达式提取DMSS内容
     */
    extractDMSSContent(text) {
        try {
            // 正则表达式：捕获<DMSS>和</DMSS>之间的内容，最大深度为0
            const dmssRegex = /<DMSS>([\s\S]*?)<\/DMSS>/g;
            const matches = text.match(dmssRegex);
            
            if (matches && matches.length > 0) {
                matches.forEach(match => {
                    // 提取DMSS标签内的纯文本内容
                    const contentMatch = match.match(/<DMSS>([\s\S]*?)<\/DMSS>/);
                    if (contentMatch && contentMatch[1]) {
                        const dmssContent = contentMatch[1].trim();
                        this.storeDMSSMemory(dmssContent);
                    }
                });
            }
        } catch (error) {
            console.error('[DMSS Core] 提取DMSS内容时出错:', error);
        }
    }

    /**
     * 存储DMSS记忆内容
     */
    storeDMSSMemory(content) {
        if (!content || content.trim() === '') return;

        const chatId = this.getCurrentChatId();
        const timestamp = new Date().toISOString();
        
        // 获取或创建聊天记忆数据
        if (!this.memoryData.has(chatId)) {
            this.memoryData.set(chatId, {
                memories: [],
                lastUpdate: timestamp,
                chatName: this.getChatName()
            });
        }

        const chatData = this.memoryData.get(chatId);
        
        // 创建新的记忆条目
        const memoryEntry = {
            id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            content: content,
            timestamp: timestamp,
            chatId: chatId
        };

        // 添加到记忆列表
        chatData.memories.push(memoryEntry);
        chatData.lastUpdate = timestamp;

        // 保存到本地存储
        this.saveMemoryData();

        console.log(`[DMSS Core] 已存储新的DMSS记忆，聊天ID: ${chatId}`);
        
        // 触发UI更新事件
        this.triggerMemoryUpdateEvent(memoryEntry);
    }

    /**
     * 获取聊天名称
     */
    getChatName() {
        // 尝试从SillyTavern获取聊天名称
        if (typeof chat !== 'undefined' && chat.title) {
            return chat.title;
        }
        
        // 备用方案：使用时间戳
        return `聊天_${new Date().toLocaleDateString()}`;
    }

    /**
     * 获取指定聊天的所有记忆
     */
    getMemoriesForChat(chatId = null) {
        const targetChatId = chatId || this.getCurrentChatId();
        const chatData = this.memoryData.get(targetChatId);
        
        if (!chatData) {
            return [];
        }
        
        return chatData.memories || [];
    }

    /**
     * 获取所有聊天的记忆数据
     */
    getAllMemories() {
        const allMemories = [];
        
        this.memoryData.forEach((chatData, chatId) => {
            allMemories.push({
                chatId: chatId,
                chatName: chatData.chatName,
                memories: chatData.memories,
                lastUpdate: chatData.lastUpdate
            });
        });
        
        return allMemories;
    }

    /**
     * 删除指定记忆
     */
    deleteMemory(memoryId, chatId = null) {
        const targetChatId = chatId || this.getCurrentChatId();
        const chatData = this.memoryData.get(targetChatId);
        
        if (!chatData) return false;
        
        const initialLength = chatData.memories.length;
        chatData.memories = chatData.memories.filter(memory => memory.id !== memoryId);
        
        if (chatData.memories.length < initialLength) {
            chatData.lastUpdate = new Date().toISOString();
            this.saveMemoryData();
            console.log(`[DMSS Core] 已删除记忆: ${memoryId}`);
            return true;
        }
        
        return false;
    }

    /**
     * 清空指定聊天的所有记忆
     */
    clearChatMemories(chatId = null) {
        const targetChatId = chatId || this.getCurrentChatId();
        
        if (this.memoryData.has(targetChatId)) {
            this.memoryData.delete(targetChatId);
            this.saveMemoryData();
            console.log(`[DMSS Core] 已清空聊天记忆: ${targetChatId}`);
            return true;
        }
        
        return false;
    }

    /**
     * 从本地存储加载记忆数据
     */
    loadMemoryData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsedData = JSON.parse(stored);
                this.memoryData = new Map(parsedData);
                console.log(`[DMSS Core] 已加载记忆数据，包含 ${this.memoryData.size} 个聊天`);
            }
        } catch (error) {
            console.error('[DMSS Core] 加载记忆数据失败:', error);
            this.memoryData = new Map();
        }
    }

    /**
     * 保存记忆数据到本地存储
     */
    saveMemoryData() {
        try {
            const dataToStore = Array.from(this.memoryData.entries());
            localStorage.setItem(this.storageKey, JSON.stringify(dataToStore));
            console.log('[DMSS Core] 记忆数据已保存');
        } catch (error) {
            console.error('[DMSS Core] 保存记忆数据失败:', error);
        }
    }

    /**
     * 触发记忆更新事件
     */
    triggerMemoryUpdateEvent(memoryEntry) {
        // 创建自定义事件
        const event = new CustomEvent('dmssMemoryUpdated', {
            detail: {
                memory: memoryEntry,
                chatId: this.getCurrentChatId()
            }
        });
        
        // 分发事件
        window.dispatchEvent(event);
    }

    /**
     * 获取系统状态信息
     */
    getStatus() {
        const totalMemories = Array.from(this.memoryData.values())
            .reduce((sum, chatData) => sum + chatData.memories.length, 0);
        
        return {
            isEnabled: this.isEnabled,
            currentChatId: this.currentChatId,
            totalChats: this.memoryData.size,
            totalMemories: totalMemories,
            lastUpdate: this.memoryData.get(this.currentChatId)?.lastUpdate || '从未'
        };
    }
}

// 创建全局实例
window.DMSSCore = DMSSCore;

console.log('[DMSS Core] 模块加载完成');
