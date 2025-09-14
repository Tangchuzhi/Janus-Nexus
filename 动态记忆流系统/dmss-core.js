/**
 * DMSS (动态记忆流系统) 核心模块
 * Dynamic Memory Stream System Core Module
 */

class DMSSCore {
    constructor() {
        this.extensionName = 'Janus-Treasure-chest';
        this.memoryKey = 'dmss_memories';
        this.settingsKey = 'dmss_settings';
        
        // 默认设置
        this.defaultSettings = {
            enabled: false,
            maxMemories: 100,           // 最大记忆数量
            memoryThreshold: 0.7,       // 记忆关联阈值
            summaryLength: 200,         // 总结长度
            injectionDepth: 2,          // 注入深度（只考虑最近2条消息）
            autoSummarize: true,        // 自动总结
            debugMode: false            // 调试模式
        };
        
        // 初始化设置
        this.settings = this.loadSettings();
        
        // 记忆存储结构
        this.memories = this.loadMemories();
        
        // 当前聊天上下文
        this.currentContext = null;
        
        console.log('[DMSS Core] 初始化完成', {
            settings: this.settings,
            memoryCount: this.memories.length
        });
    }
    
    /**
     * 加载DMSS设置
     */
    loadSettings() {
        try {
            // 从extension_settings中获取设置
            if (typeof extension_settings !== 'undefined' && extension_settings[this.extensionName]) {
                const savedSettings = extension_settings[this.extensionName][this.settingsKey] || {};
                return { ...this.defaultSettings, ...savedSettings };
            }
        } catch (error) {
            console.warn('[DMSS Core] 加载设置失败，使用默认设置:', error);
        }
        return { ...this.defaultSettings };
    }
    
    /**
     * 保存DMSS设置
     */
    saveSettings() {
        try {
            if (typeof extension_settings !== 'undefined') {
                if (!extension_settings[this.extensionName]) {
                    extension_settings[this.extensionName] = {};
                }
                extension_settings[this.extensionName][this.settingsKey] = this.settings;
                
                // 触发设置保存
                if (typeof saveSettingsDebounced === 'function') {
                    saveSettingsDebounced();
                }
                console.log('[DMSS Core] 设置已保存');
            }
        } catch (error) {
            console.error('[DMSS Core] 保存设置失败:', error);
        }
    }
    
    /**
     * 加载记忆数据
     */
    loadMemories() {
        try {
            if (typeof extension_settings !== 'undefined' && extension_settings[this.extensionName]) {
                const savedMemories = extension_settings[this.extensionName][this.memoryKey] || [];
                return Array.isArray(savedMemories) ? savedMemories : [];
            }
        } catch (error) {
            console.warn('[DMSS Core] 加载记忆失败，使用空数组:', error);
        }
        return [];
    }
    
    /**
     * 保存记忆数据
     */
    saveMemories() {
        try {
            if (typeof extension_settings !== 'undefined') {
                if (!extension_settings[this.extensionName]) {
                    extension_settings[this.extensionName] = {};
                }
                extension_settings[this.extensionName][this.memoryKey] = this.memories;
                
                // 触发设置保存
                if (typeof saveSettingsDebounced === 'function') {
                    saveSettingsDebounced();
                }
                console.log('[DMSS Core] 记忆已保存，当前记忆数量:', this.memories.length);
            }
        } catch (error) {
            console.error('[DMSS Core] 保存记忆失败:', error);
        }
    }
    
    /**
     * 启用/禁用DMSS
     */
    setEnabled(enabled) {
        this.settings.enabled = enabled;
        this.saveSettings();
        console.log(`[DMSS Core] ${enabled ? '启用' : '禁用'}DMSS`);
    }
    
    /**
     * 更新设置
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
        console.log('[DMSS Core] 设置已更新:', newSettings);
    }
    
    /**
     * 处理新的聊天消息
     * @param {Object} messageData - 消息数据
     * @param {string} messageData.content - 消息内容
     * @param {string} messageData.role - 消息角色 (user/assistant)
     * @param {number} messageData.timestamp - 时间戳
     */
    async processMessage(messageData) {
        if (!this.settings.enabled) {
            return null;
        }
        
        try {
            // 只处理assistant消息进行总结
            if (messageData.role === 'assistant') {
                await this.summarizeAndStore(messageData);
            }
            
            // 如果是user消息，查找相关记忆
            if (messageData.role === 'user') {
                return await this.findRelevantMemories(messageData.content);
            }
            
        } catch (error) {
            console.error('[DMSS Core] 处理消息失败:', error);
        }
        
        return null;
    }
    
    /**
     * 总结并存储assistant消息
     */
    async summarizeAndStore(messageData) {
        if (!this.settings.autoSummarize) {
            return;
        }
        
        const content = messageData.content;
        if (!content || content.length < 50) {
            return; // 内容太短，不进行总结
        }
        
        // 生成总结
        const summary = await this.generateSummary(content);
        
        if (summary) {
            // 创建记忆条目
            const memory = {
                id: this.generateMemoryId(),
                content: content,
                summary: summary,
                timestamp: messageData.timestamp || Date.now(),
                keywords: this.extractKeywords(content),
                context: this.getCurrentContext()
            };
            
            // 添加到记忆库
            this.addMemory(memory);
            
            if (this.settings.debugMode) {
                console.log('[DMSS Core] 新记忆已添加:', memory);
            }
        }
    }
    
    /**
     * 生成记忆总结
     */
    async generateSummary(content) {
        try {
            // 简单的总结逻辑：取前200个字符 + 关键信息
            let summary = content.substring(0, this.settings.summaryLength);
            
            // 如果内容被截断，添加省略号
            if (content.length > this.settings.summaryLength) {
                summary += '...';
            }
            
            // 提取关键信息（简单实现）
            const keywords = this.extractKeywords(content);
            if (keywords.length > 0) {
                summary += ` [关键词: ${keywords.join(', ')}]`;
            }
            
            return summary;
        } catch (error) {
            console.error('[DMSS Core] 生成总结失败:', error);
            return null;
        }
    }
    
    /**
     * 提取关键词
     */
    extractKeywords(content) {
        // 简单的关键词提取逻辑
        const words = content.toLowerCase()
            .replace(/[^\u4e00-\u9fa5a-zA-Z\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 1);
        
        // 统计词频
        const wordCount = {};
        words.forEach(word => {
            wordCount[word] = (wordCount[word] || 0) + 1;
        });
        
        // 返回出现频率最高的前5个词
        return Object.entries(wordCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([word]) => word);
    }
    
    /**
     * 查找相关记忆
     */
    async findRelevantMemories(userInput) {
        if (!userInput || userInput.length < 3) {
            return [];
        }
        
        const relevantMemories = [];
        const inputKeywords = this.extractKeywords(userInput);
        
        // 遍历所有记忆，计算相关性
        for (const memory of this.memories) {
            const relevance = this.calculateRelevance(userInput, memory, inputKeywords);
            
            if (relevance >= this.settings.memoryThreshold) {
                relevantMemories.push({
                    ...memory,
                    relevance: relevance
                });
            }
        }
        
        // 按相关性排序，返回最相关的前3条
        relevantMemories.sort((a, b) => b.relevance - a.relevance);
        
        const result = relevantMemories.slice(0, 3);
        
        if (this.settings.debugMode && result.length > 0) {
            console.log('[DMSS Core] 找到相关记忆:', result);
        }
        
        return result;
    }
    
    /**
     * 计算记忆相关性
     */
    calculateRelevance(userInput, memory, inputKeywords) {
        let score = 0;
        
        // 关键词匹配
        const memoryKeywords = memory.keywords || [];
        const keywordMatches = inputKeywords.filter(keyword => 
            memoryKeywords.some(memKeyword => 
                memKeyword.includes(keyword) || keyword.includes(memKeyword)
            )
        ).length;
        
        score += (keywordMatches / Math.max(inputKeywords.length, 1)) * 0.6;
        
        // 内容相似度（简单实现）
        const contentSimilarity = this.calculateTextSimilarity(userInput, memory.summary);
        score += contentSimilarity * 0.4;
        
        return Math.min(score, 1);
    }
    
    /**
     * 计算文本相似度
     */
    calculateTextSimilarity(text1, text2) {
        // 简单的Jaccard相似度计算
        const words1 = new Set(text1.toLowerCase().split(/\s+/));
        const words2 = new Set(text2.toLowerCase().split(/\s+/));
        
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        
        return intersection.size / union.size;
    }
    
    /**
     * 添加记忆到记忆库
     */
    addMemory(memory) {
        // 检查是否已存在相似记忆（避免重复）
        const isDuplicate = this.memories.some(existing => 
            this.calculateTextSimilarity(memory.summary, existing.summary) > 0.8
        );
        
        if (!isDuplicate) {
            this.memories.push(memory);
            
            // 限制记忆数量
            if (this.memories.length > this.settings.maxMemories) {
                // 移除最旧的记忆
                this.memories.sort((a, b) => a.timestamp - b.timestamp);
                this.memories = this.memories.slice(-this.settings.maxMemories);
            }
            
            this.saveMemories();
        }
    }
    
    /**
     * 生成记忆ID
     */
    generateMemoryId() {
        return `dmss_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * 获取当前上下文
     */
    getCurrentContext() {
        try {
            // 尝试获取当前聊天上下文
            if (typeof getContext === 'function') {
                const context = getContext();
                return {
                    characterId: context.characterId,
                    chatId: context.chatId,
                    groupId: context.groupId
                };
            }
        } catch (error) {
            console.warn('[DMSS Core] 获取上下文失败:', error);
        }
        return null;
    }
    
    /**
     * 生成记忆注入文本
     */
    generateInjectionText(relevantMemories) {
        if (!relevantMemories || relevantMemories.length === 0) {
            return '';
        }
        
        let injectionText = '\n[DMSS记忆注入]\n';
        
        relevantMemories.forEach((memory, index) => {
            injectionText += `${index + 1}. ${memory.summary}\n`;
        });
        
        injectionText += '[DMSS记忆注入结束]\n';
        
        return injectionText;
    }
    
    /**
     * 重置DMSS系统
     */
    reset() {
        this.memories = [];
        this.saveMemories();
        console.log('[DMSS Core] 系统已重置');
    }
    
    /**
     * 获取统计信息
     */
    getStats() {
        return {
            totalMemories: this.memories.length,
            settings: this.settings,
            lastUpdate: this.memories.length > 0 ? 
                Math.max(...this.memories.map(m => m.timestamp)) : null
        };
    }
}

// 导出DMSS核心类
window.DMSSCore = DMSSCore;

console.log('[DMSS Core] 模块加载完成');
