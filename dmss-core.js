/**
 * DMSS (动态记忆流系统) 核心模块
 * 负责长剧情记忆的总结、归档和检索功能
 */

class DMSSCore {
    constructor() {
        this.isEnabled = false;
        this.storageKey = 'dmss_memory_data';
        this.currentChatId = null;
        this.memoryData = new Map(); // 存储聊天记忆数据
        this.summaryTemplate = null; // 总结模板
        this.injectionSettings = {
            enabled: true,
            maxTokens: 2000,
            similarityThreshold: 0.7,
            maxResults: 5
        };
        
        console.log('[DMSS] 核心模块初始化完成');
    }

    /**
     * 初始化DMSS系统
     */
    async initialize() {
        try {
            // 获取当前聊天ID
            this.currentChatId = this.getCurrentChatId();
            
            // 加载记忆数据
            await this.loadMemoryData();
            
            // 加载配置
            await this.loadConfiguration();
            
            console.log('[DMSS] 系统初始化完成');
            return true;
        } catch (error) {
            console.error('[DMSS] 初始化失败:', error);
            return false;
        }
    }

    /**
     * 获取当前聊天ID
     */
    getCurrentChatId() {
        try {
            // 尝试从SillyTavern获取当前聊天ID
            if (typeof getCurrentChatId === 'function') {
                return getCurrentChatId();
            }
            
            // 备用方案：从URL或DOM获取
            const chatId = this.extractChatIdFromUrl() || this.extractChatIdFromDOM();
            return chatId;
        } catch (error) {
            console.warn('[DMSS] 无法获取聊天ID:', error);
            return 'default';
        }
    }

    /**
     * 从URL提取聊天ID
     */
    extractChatIdFromUrl() {
        try {
            const url = window.location.href;
            const match = url.match(/chat\/([^\/]+)/);
            return match ? match[1] : null;
        } catch (error) {
            return null;
        }
    }

    /**
     * 从DOM提取聊天ID
     */
    extractChatIdFromDOM() {
        try {
            // 尝试从各种可能的DOM元素获取聊天ID
            const chatElement = document.querySelector('[data-chat-id]');
            if (chatElement) {
                return chatElement.getAttribute('data-chat-id');
            }
            
            // 备用方案：使用时间戳
            return `chat_${Date.now()}`;
        } catch (error) {
            return null;
        }
    }

    /**
     * 加载记忆数据
     */
    async loadMemoryData() {
        try {
            const data = await this.getStorageData();
            if (data && data.memories) {
                this.memoryData = new Map(Object.entries(data.memories));
                console.log(`[DMSS] 加载了 ${this.memoryData.size} 条记忆数据`);
            }
        } catch (error) {
            console.error('[DMSS] 加载记忆数据失败:', error);
            this.memoryData = new Map();
        }
    }

    /**
     * 保存记忆数据
     */
    async saveMemoryData() {
        try {
            const data = {
                memories: Object.fromEntries(this.memoryData),
                lastUpdated: Date.now(),
                version: '1.0.0'
            };
            
            await this.setStorageData(data);
            console.log('[DMSS] 记忆数据保存成功');
        } catch (error) {
            console.error('[DMSS] 保存记忆数据失败:', error);
        }
    }

    /**
     * 获取存储数据
     */
    async getStorageData() {
        try {
            // 优先使用SillyTavern的存储系统
            if (typeof extension_settings !== 'undefined' && extension_settings.dmss) {
                return extension_settings.dmss;
            }
            
            // 备用方案：使用localStorage
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('[DMSS] 获取存储数据失败:', error);
            return null;
        }
    }

    /**
     * 设置存储数据
     */
    async setStorageData(data) {
        try {
            // 优先使用SillyTavern的存储系统
            if (typeof extension_settings !== 'undefined') {
                if (!extension_settings.dmss) {
                    extension_settings.dmss = {};
                }
                extension_settings.dmss = data;
                
                // 保存设置
                if (typeof saveSettingsDebounced === 'function') {
                    saveSettingsDebounced();
                }
                return;
            }
            
            // 备用方案：使用localStorage
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('[DMSS] 设置存储数据失败:', error);
        }
    }

    /**
     * 加载配置
     */
    async loadConfiguration() {
        try {
            const config = await this.getStorageData();
            if (config && config.settings) {
                this.injectionSettings = { ...this.injectionSettings, ...config.settings };
            }
            
            if (config && config.summaryTemplate) {
                this.summaryTemplate = config.summaryTemplate;
            }
        } catch (error) {
            console.error('[DMSS] 加载配置失败:', error);
        }
    }

    /**
     * 启动DMSS系统
     */
    async start() {
        try {
            this.isEnabled = true;
            await this.initialize();
            
            // 注册事件监听器
            this.registerEventListeners();
            
            console.log('[DMSS] 系统启动成功');
            return true;
        } catch (error) {
            console.error('[DMSS] 启动失败:', error);
            return false;
        }
    }

    /**
     * 停止DMSS系统
     */
    async stop() {
        try {
            this.isEnabled = false;
            
            // 保存当前数据
            await this.saveMemoryData();
            
            // 移除事件监听器
            this.removeEventListeners();
            
            console.log('[DMSS] 系统已停止');
        } catch (error) {
            console.error('[DMSS] 停止失败:', error);
        }
    }

    /**
     * 注册事件监听器
     */
    registerEventListeners() {
        // 监听聊天消息事件
        if (typeof eventSource !== 'undefined') {
            eventSource.on(event_types.MESSAGE_RECEIVED, this.onMessageReceived.bind(this));
            eventSource.on(event_types.MESSAGE_SENT, this.onMessageSent.bind(this));
        }
        
        // 监听聊天切换事件
        if (typeof eventSource !== 'undefined') {
            eventSource.on(event_types.CHAT_CHANGED, this.onChatChanged.bind(this));
        }
    }

    /**
     * 移除事件监听器
     */
    removeEventListeners() {
        // 移除事件监听器
        if (typeof eventSource !== 'undefined') {
            eventSource.off(event_types.MESSAGE_RECEIVED, this.onMessageReceived.bind(this));
            eventSource.off(event_types.MESSAGE_SENT, this.onMessageSent.bind(this));
            eventSource.off(event_types.CHAT_CHANGED, this.onChatChanged.bind(this));
        }
    }

    /**
     * 消息接收事件处理
     */
    async onMessageReceived(data) {
        if (!this.isEnabled) return;
        
        try {
            console.log('[DMSS] 收到新消息:', data);
            
            // 如果是角色消息，自动添加到记忆
            if (data && data.mes && !data.is_user) {
                console.log('[DMSS] 检测到角色消息，添加到记忆');
                await this.addMemory(data.mes, 'character_message');
            }
            
            // 触发关键词检索和内容注入
            await this.processMessageForInjection(data);
        } catch (error) {
            console.error('[DMSS] 处理接收消息失败:', error);
        }
    }

    /**
     * 消息发送事件处理
     */
    async onMessageSent(data) {
        if (!this.isEnabled) return;
        
        try {
            // 可以在这里添加消息发送后的处理逻辑
            console.log('[DMSS] 消息已发送:', data);
        } catch (error) {
            console.error('[DMSS] 处理发送消息失败:', error);
        }
    }

    /**
     * 聊天切换事件处理
     */
    async onChatChanged(data) {
        if (!this.isEnabled) return;
        
        try {
            // 保存当前聊天的记忆数据
            await this.saveMemoryData();
            
            // 更新当前聊天ID
            this.currentChatId = this.getCurrentChatId();
            
            // 加载新聊天的记忆数据
            await this.loadMemoryData();
            
            console.log('[DMSS] 聊天已切换:', this.currentChatId);
        } catch (error) {
            console.error('[DMSS] 处理聊天切换失败:', error);
        }
    }

    /**
     * 处理消息进行内容注入
     */
    async processMessageForInjection(messageData) {
        try {
            // 提取关键词
            const keywords = this.extractKeywords(messageData);
            
            if (keywords.length === 0) {
                return;
            }
            
            // 检索相关记忆
            const relevantMemories = await this.searchMemories(keywords);
            
            if (relevantMemories.length === 0) {
                return;
            }
            
            // 生成注入内容
            const injectionContent = await this.generateInjectionContent(relevantMemories);
            
            // 注入到提示中
            await this.injectToPrompt(injectionContent);
            
        } catch (error) {
            console.error('[DMSS] 处理消息注入失败:', error);
        }
    }

    /**
     * 提取关键词
     */
    extractKeywords(messageData) {
        try {
            const text = messageData.message || messageData.text || '';
            
            // 简单的关键词提取（后续可以优化）
            const words = text.toLowerCase()
                .replace(/[^\u4e00-\u9fa5a-zA-Z\s]/g, ' ')
                .split(/\s+/)
                .filter(word => word.length > 1);
            
            // 去重并限制数量
            return [...new Set(words)].slice(0, 10);
        } catch (error) {
            console.error('[DMSS] 提取关键词失败:', error);
            return [];
        }
    }

    /**
     * 搜索相关记忆
     */
    async searchMemories(keywords) {
        try {
            const results = [];
            
            for (const [key, memory] of this.memoryData) {
                const relevance = this.calculateRelevance(memory, keywords);
                
                if (relevance >= this.injectionSettings.similarityThreshold) {
                    results.push({
                        key,
                        memory,
                        relevance
                    });
                }
            }
            
            // 按相关性排序
            results.sort((a, b) => b.relevance - a.relevance);
            
            // 限制结果数量
            return results.slice(0, this.injectionSettings.maxResults);
        } catch (error) {
            console.error('[DMSS] 搜索记忆失败:', error);
            return [];
        }
    }

    /**
     * 计算相关性
     */
    calculateRelevance(memory, keywords) {
        try {
            const memoryText = (memory.summary || memory.content || '').toLowerCase();
            let score = 0;
            
            for (const keyword of keywords) {
                if (memoryText.includes(keyword.toLowerCase())) {
                    score += 1;
                }
            }
            
            return keywords.length > 0 ? score / keywords.length : 0;
        } catch (error) {
            console.error('[DMSS] 计算相关性失败:', error);
            return 0;
        }
    }

    /**
     * 生成注入内容
     */
    async generateInjectionContent(relevantMemories) {
        try {
            let content = '【相关记忆】\n';
            
            for (const item of relevantMemories) {
                content += `- ${item.memory.summary || item.memory.content}\n`;
            }
            
            return content;
        } catch (error) {
            console.error('[DMSS] 生成注入内容失败:', error);
            return '';
        }
    }

    /**
     * 注入到提示中
     */
    async injectToPrompt(content) {
        try {
            // 使用SillyTavern的注入系统
            if (typeof setExtensionPrompt === 'function') {
                setExtensionPrompt(EXTENSION_PROMPT_TAG, content, extension_prompt_types.AFTER);
            }
            
            console.log('[DMSS] 内容已注入到提示中');
        } catch (error) {
            console.error('[DMSS] 注入到提示失败:', error);
        }
    }

    /**
     * 添加记忆
     */
    async addMemory(content, type = 'chat') {
        try {
            const memoryId = `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const memory = {
                id: memoryId,
                content: content,
                type: type,
                chatId: this.currentChatId,
                createdAt: Date.now(),
                summary: null,
                keywords: this.extractKeywords({ text: content })
            };
            
            this.memoryData.set(memoryId, memory);
            await this.saveMemoryData();
            
            console.log('[DMSS] 记忆已添加:', memoryId);
            return memoryId;
        } catch (error) {
            console.error('[DMSS] 添加记忆失败:', error);
            return null;
        }
    }

    /**
     * 生成总结
     */
    async generateSummary(content) {
        try {
            if (!this.summaryTemplate) {
                // 使用默认模板
                this.summaryTemplate = `
请对以下聊天内容进行结构化总结：

内容：
{content}

请按照以下格式输出：
【主要事件】
- 事件1
- 事件2

【关键人物】
- 人物1：描述
- 人物2：描述

【重要信息】
- 信息1
- 信息2

【情感氛围】
- 氛围描述

【后续发展】
- 可能的后续发展
`;
            }
            
            const prompt = this.summaryTemplate.replace('{content}', content);
            
            // 使用SillyTavern的生成功能
            if (typeof generateRaw === 'function') {
                const result = await generateRaw(prompt, {
                    instruct: true,
                    system: '你是一个专业的聊天内容总结助手。'
                });
                
                return result;
            }
            
            return '总结功能需要AI API支持';
        } catch (error) {
            console.error('[DMSS] 生成总结失败:', error);
            return null;
        }
    }

    /**
     * 获取当前聊天的最后一条角色消息
     */
    getLastCharacterMessage() {
        try {
            // 使用SillyTavern的宏系统
            if (typeof substituteParams === 'function') {
                const lastCharMessage = substituteParams('{{lastCharMessage}}');
                if (lastCharMessage && lastCharMessage.trim()) {
                    console.log('[DMSS] 获取到最后角色消息:', lastCharMessage);
                    return lastCharMessage;
                }
            }
            
            // 备用方案：从DOM获取
            const messageElements = document.querySelectorAll('.mes');
            for (let i = messageElements.length - 1; i >= 0; i--) {
                const element = messageElements[i];
                const nameElement = element.querySelector('.mes_name');
                const textElement = element.querySelector('.mes_text');
                
                if (nameElement && textElement && !element.classList.contains('user')) {
                    const name = nameElement.textContent.trim();
                    const text = textElement.textContent.trim();
                    
                    // 如果不是用户消息，返回角色消息
                    if (name && text && name !== '{{user}}') {
                        console.log('[DMSS] 从DOM获取角色消息:', text);
                        return text;
                    }
                }
            }
            
            console.warn('[DMSS] 未找到角色消息');
            return null;
        } catch (error) {
            console.error('[DMSS] 获取角色消息失败:', error);
            return null;
        }
    }

    /**
     * 获取当前聊天的所有消息
     */
    getCurrentChatMessages() {
        try {
            const messages = [];
            
            // 方法1: 尝试从SillyTavern的全局变量获取
            if (typeof chat !== 'undefined' && chat.length > 0) {
                console.log('[DMSS] 从chat全局变量获取消息:', chat.length);
                return chat.map((msg, index) => ({
                    name: msg.name || (msg.is_user ? '用户' : 'AI'),
                    text: msg.mes || msg.text || '',
                    index: index,
                    role: msg.is_user ? 'user' : 'assistant'
                }));
            }
            
            // 方法2: 尝试从messages全局变量获取
            if (typeof messages !== 'undefined' && messages.length > 0) {
                console.log('[DMSS] 从messages全局变量获取消息:', messages.length);
                return messages.map((msg, index) => ({
                    name: msg.name || (msg.is_user ? '用户' : 'AI'),
                    text: msg.mes || msg.text || '',
                    index: index,
                    role: msg.is_user ? 'user' : 'assistant'
                }));
            }
            
            // 方法3: 从DOM获取
            const messageElements = document.querySelectorAll('.mes');
            messageElements.forEach((element, index) => {
                const nameElement = element.querySelector('.mes_name');
                const textElement = element.querySelector('.mes_text');
                
                if (nameElement && textElement) {
                    messages.push({
                        name: nameElement.textContent.trim(),
                        text: textElement.textContent.trim(),
                        index: index,
                        role: element.classList.contains('user') ? 'user' : 'assistant'
                    });
                }
            });
            
            console.log(`[DMSS] 最终获取到 ${messages.length} 条消息`);
            return messages;
        } catch (error) {
            console.error('[DMSS] 获取聊天消息失败:', error);
            return [];
        }
    }

    /**
     * 获取系统状态
     */
    getStatus() {
        return {
            enabled: this.isEnabled,
            currentChatId: this.currentChatId,
            memoryCount: this.memoryData.size,
            settings: this.injectionSettings
        };
    }
}

// 导出DMSS核心类
window.DMSSCore = DMSSCore;