/**
 * DMSS (Dynamic Memory Stream System) 核心模块
 * 动态记忆流系统 - 负责捕获、存储和管理AI生成的记忆内容
 */

class DMSSCore {
    constructor() {
        this.memoryData = {};
        this.isEnabled = false;
        this.currentChatId = null;
        this.init();
    }

    /**
     * 初始化DMSS核心
     */
    init() {
        console.log('[DMSS Core] 初始化DMSS核心模块');
        this.loadMemoryData();
        this.setupEventListeners();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 监听消息生成完成事件
        if (window.eventSource && window.event_types) {
            window.eventSource.on(window.event_types.MESSAGE_RECEIVED, (data) => {
                this.handleMessageReceived(data);
            });
        }

        // 监听聊天切换事件
        if (window.eventSource && window.event_types) {
            window.eventSource.on(window.event_types.CHAT_CHANGED, (data) => {
                this.handleChatChanged(data);
            });
        }

        // 如果没有事件系统，使用轮询方式检查新消息
        if (!window.eventSource) {
            console.log('[DMSS Core] 使用轮询方式监听消息');
            this.startPolling();
        }
    }

    /**
     * 开始轮询检查新消息
     */
    startPolling() {
        this.lastMessageCount = 0;
        this.pollingInterval = setInterval(() => {
            this.checkForNewMessages();
        }, 2000); // 每2秒检查一次
    }

    /**
     * 停止轮询
     */
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    /**
     * 检查新消息
     */
    checkForNewMessages() {
        if (!this.isEnabled) return;

        try {
            // 获取当前聊天消息
            const messages = window.chat || [];
            if (messages.length > this.lastMessageCount) {
                // 有新消息，检查最后一条消息
                const lastMessage = messages[messages.length - 1];
                if (lastMessage && lastMessage.mes) {
                    const dmssContent = this.extractDMSSContent(lastMessage.mes);
                    if (dmssContent) {
                        console.log('[DMSS Core] 轮询发现DMSS内容:', dmssContent);
                        this.saveDMSSContent(dmssContent, {
                            messageId: lastMessage.id || Date.now(),
                            characterId: lastMessage.characterId || null,
                            userId: lastMessage.userId || null
                        });
                    }
                }
                this.lastMessageCount = messages.length;
            }
        } catch (error) {
            console.error('[DMSS Core] 轮询检查消息失败:', error);
        }
    }

    /**
     * 处理消息接收事件
     * @param {Object} data - 消息数据
     */
    handleMessageReceived(data) {
        if (!this.isEnabled) return;

        console.log('[DMSS Core] 处理新消息:', data);
        
        // 检查消息是否包含DMSS内容
        const dmssContent = this.extractDMSSContent(data.message);
        if (dmssContent) {
            console.log('[DMSS Core] 发现DMSS内容:', dmssContent);
            this.saveDMSSContent(dmssContent, data);
        }
    }

    /**
     * 处理聊天切换事件
     * @param {Object} data - 聊天数据
     */
    handleChatChanged(data) {
        this.currentChatId = data.chatId;
        console.log('[DMSS Core] 切换到聊天:', this.currentChatId);
    }

    /**
     * 使用正则表达式提取DMSS内容
     * @param {string} message - 消息内容
     * @returns {string|null} - 提取的DMSS内容，如果没有则返回null
     */
    extractDMSSContent(message) {
        if (!message || typeof message !== 'string') {
            return null;
        }

        // 使用正则表达式捕获<DMSS>内容</DMSS>，最大深度为0（不嵌套）
        const dmssRegex = /<DMSS>(.*?)<\/DMSS>/g;
        const matches = message.match(dmssRegex);
        
        if (matches && matches.length > 0) {
            // 提取第一个匹配的内容（去除标签）
            const content = matches[0].replace(/<\/?DMSS>/g, '').trim();
            console.log('[DMSS Core] 提取到DMSS内容:', content);
            return content;
        }

        return null;
    }

    /**
     * 保存DMSS内容到存储
     * @param {string} content - DMSS内容
     * @param {Object} messageData - 消息数据
     */
    saveDMSSContent(content, messageData) {
        if (!this.currentChatId) {
            console.warn('[DMSS Core] 没有当前聊天ID，无法保存DMSS内容');
            return;
        }

        const memoryEntry = {
            content: content,
            timestamp: new Date().toISOString(),
            messageId: messageData.messageId || Date.now(),
            chatId: this.currentChatId,
            characterId: messageData.characterId || null,
            userId: messageData.userId || null
        };

        // 确保当前聊天的记忆数组存在
        if (!this.memoryData[this.currentChatId]) {
            this.memoryData[this.currentChatId] = [];
        }

        // 添加新的记忆条目
        this.memoryData[this.currentChatId].push(memoryEntry);

        // 保存到extension_settings
        this.saveMemoryData();

        console.log('[DMSS Core] DMSS内容已保存:', memoryEntry);
        
        // 触发记忆更新事件
        this.triggerMemoryUpdateEvent(memoryEntry);
    }

    /**
     * 从extension_settings加载记忆数据
     */
    loadMemoryData() {
        try {
            if (window.extension_settings && window.extension_settings.dmss) {
                this.memoryData = window.extension_settings.dmss.memoryData || {};
                console.log('[DMSS Core] 记忆数据已加载:', Object.keys(this.memoryData).length, '个聊天');
            } else {
                this.memoryData = {};
                console.log('[DMSS Core] 初始化空记忆数据');
            }
        } catch (error) {
            console.error('[DMSS Core] 加载记忆数据失败:', error);
            this.memoryData = {};
        }
    }

    /**
     * 保存记忆数据到extension_settings
     */
    saveMemoryData() {
        try {
            if (!window.extension_settings) {
                window.extension_settings = {};
            }
            
            if (!window.extension_settings.dmss) {
                window.extension_settings.dmss = {};
            }
            
            window.extension_settings.dmss.memoryData = this.memoryData;
            
            // 触发保存
            if (window.saveMetadataDebounced) {
                window.saveMetadataDebounced();
            }
            
            console.log('[DMSS Core] 记忆数据已保存');
        } catch (error) {
            console.error('[DMSS Core] 保存记忆数据失败:', error);
        }
    }

    /**
     * 获取指定聊天的记忆内容
     * @param {string} chatId - 聊天ID
     * @returns {Array} - 记忆条目数组
     */
    getMemoryForChat(chatId) {
        return this.memoryData[chatId] || [];
    }

    /**
     * 获取当前聊天的记忆内容
     * @returns {Array} - 记忆条目数组
     */
    getCurrentMemory() {
        return this.getMemoryForChat(this.currentChatId);
    }

    /**
     * 清空指定聊天的记忆
     * @param {string} chatId - 聊天ID
     */
    clearMemoryForChat(chatId) {
        if (this.memoryData[chatId]) {
            delete this.memoryData[chatId];
            this.saveMemoryData();
            console.log('[DMSS Core] 已清空聊天记忆:', chatId);
        }
    }

    /**
     * 清空所有记忆
     */
    clearAllMemory() {
        this.memoryData = {};
        this.saveMemoryData();
        console.log('[DMSS Core] 已清空所有记忆');
    }

    /**
     * 启用DMSS
     */
    enable() {
        this.isEnabled = true;
        
        // 获取当前聊天ID
        if (window.getCurrentChatId) {
            this.currentChatId = window.getCurrentChatId();
        } else if (window.this_chid) {
            this.currentChatId = window.this_chid;
        }
        
        // 如果没有事件系统，启动轮询
        if (!window.eventSource) {
            this.startPolling();
        }
        
        console.log('[DMSS Core] DMSS已启用，当前聊天:', this.currentChatId);
    }

    /**
     * 禁用DMSS
     */
    disable() {
        this.isEnabled = false;
        
        // 停止轮询
        this.stopPolling();
        
        console.log('[DMSS Core] DMSS已禁用');
    }

    /**
     * 获取DMSS状态
     * @returns {boolean} - 是否启用
     */
    getStatus() {
        return this.isEnabled;
    }

    /**
     * 触发记忆更新事件
     * @param {Object} memoryEntry - 记忆条目
     */
    triggerMemoryUpdateEvent(memoryEntry) {
        if (window.eventSource) {
            window.eventSource.emit(event_types.DMSS_MEMORY_UPDATED, {
                memoryEntry: memoryEntry,
                chatId: this.currentChatId
            });
        }
    }

    /**
     * 获取记忆统计信息
     * @returns {Object} - 统计信息
     */
    getMemoryStats() {
        const totalChats = Object.keys(this.memoryData).length;
        const totalEntries = Object.values(this.memoryData).reduce((sum, entries) => sum + entries.length, 0);
        
        return {
            totalChats: totalChats,
            totalEntries: totalEntries,
            isEnabled: this.isEnabled,
            currentChatId: this.currentChatId
        };
    }
}

// 导出DMSS核心类
window.DMSSCore = DMSSCore;

// 如果存在event_types，添加DMSS相关事件类型
if (window.event_types) {
    window.event_types.DMSS_MEMORY_UPDATED = 'dmss_memory_updated';
}

console.log('[DMSS Core] DMSS核心模块已加载');
