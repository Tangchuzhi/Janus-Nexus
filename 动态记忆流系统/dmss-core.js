/**
 * DMSS (Dynamic Memory Stream System) 核心模块
 * 动态记忆流系统 - 用于长剧情记忆管理
 */

class DMSSCore {
    constructor() {
        this.isEnabled = false;
        this.memoryEntries = [];
        this.lastProcessedMessage = null;
        this.stats = {
            totalEntries: 0,
            lastUpdate: null,
            processedMessages: 0
        };
        
        console.log('[DMSS Core] 核心模块已初始化');
    }

    /**
     * 启动DMSS系统
     */
    start() {
        if (this.isEnabled) {
            console.log('[DMSS Core] 系统已在运行中');
            return;
        }

        this.isEnabled = true;
        this.loadMemoryEntries();
        console.log('[DMSS Core] 系统已启动');
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
        this.memoryEntries = [];
        this.lastProcessedMessage = null;
        this.stats = {
            totalEntries: 0,
            lastUpdate: null,
            processedMessages: 0
        };
        console.log('[DMSS Core] 系统已重置');
    }

    /**
     * 处理新消息，提取DMSS内容并存储到世界书
     */
    async processMessage(messageContent) {
        if (!this.isEnabled) {
            return;
        }

        try {
            // 使用正则表达式提取DMSS标签内容
            const dmssPattern = /<DMSS>([\s\S]*?)<\/DMSS>/g;
            const matches = messageContent.match(dmssPattern);
            
            if (matches && matches.length > 0) {
                for (let match of matches) {
                    // 提取DMSS内容（去掉标签）
                    const dmssContent = match.replace(/<\/?DMSS>/g, '').trim();
                    
                    if (dmssContent) {
                        await this.storeDMSSEntry(dmssContent);
                    }
                }
            }
            
            this.lastProcessedMessage = messageContent;
            this.stats.processedMessages++;
            this.stats.lastUpdate = new Date().toISOString();
            
        } catch (error) {
            console.error('[DMSS Core] 处理消息时出错:', error);
        }
    }

    /**
     * 存储DMSS条目到世界书
     */
    async storeDMSSEntry(content) {
        try {
            // 生成唯一的时间戳ID
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const entryKey = `DMSS_${timestamp}`;
            
            // 创建摘要
            const summary = this.generateSummary(content);
            
            // 存储到世界书
            const entryData = {
                content: content,
                summary: summary,
                timestamp: new Date().toISOString(),
                key: entryKey
            };

            // 使用酒馆的slash命令存储到世界书
            await this.executeSlashCommand(`/createentry file=chatLore key=${entryKey} ${JSON.stringify(entryData)}`);
            
            // 更新本地缓存
            this.memoryEntries.push(entryData);
            this.stats.totalEntries++;
            
            console.log(`[DMSS Core] 已存储DMSS条目: ${entryKey}`);
            
        } catch (error) {
            console.error('[DMSS Core] 存储DMSS条目失败:', error);
        }
    }

    /**
     * 生成内容摘要
     */
    generateSummary(content) {
        // 简单的摘要生成逻辑
        const words = content.split(' ');
        if (words.length <= 20) {
            return content;
        }
        return words.slice(0, 20).join(' ') + '...';
    }

    /**
     * 根据用户输入查找相关记忆
     */
    async findRelevantMemories(userInput) {
        if (!this.isEnabled || this.memoryEntries.length === 0) {
            return [];
        }

        try {
            const relevantMemories = [];
            
            // 简单的关键词匹配逻辑
            const inputWords = userInput.toLowerCase().split(/\s+/);
            
            for (let entry of this.memoryEntries) {
                const content = entry.content.toLowerCase();
                const summary = entry.summary.toLowerCase();
                
                // 检查关键词匹配
                let matchCount = 0;
                for (let word of inputWords) {
                    if (word.length > 2 && (content.includes(word) || summary.includes(word))) {
                        matchCount++;
                    }
                }
                
                // 如果匹配度足够高，添加到相关记忆
                if (matchCount >= Math.min(2, inputWords.length * 0.3)) {
                    relevantMemories.push({
                        ...entry,
                        relevanceScore: matchCount
                    });
                }
            }
            
            // 按相关性排序，返回最相关的几条
            return relevantMemories
                .sort((a, b) => b.relevanceScore - a.relevanceScore)
                .slice(0, 5);
                
        } catch (error) {
            console.error('[DMSS Core] 查找相关记忆失败:', error);
            return [];
        }
    }

    /**
     * 注入相关记忆到用户输入下方
     */
    async injectRelevantMemories(userInput) {
        const relevantMemories = await this.findRelevantMemories(userInput);
        
        if (relevantMemories.length === 0) {
            return userInput;
        }

        // 构建记忆注入内容
        let injectedContent = userInput + '\n\n<!-- DMSS注入的相关记忆 -->\n';
        
        for (let memory of relevantMemories) {
            injectedContent += `[记忆片段 ${memory.key}]: ${memory.summary}\n`;
        }
        
        return injectedContent;
    }

    /**
     * 自动注入记忆到当前用户输入
     */
    async autoInjectMemories() {
        try {
            // 获取当前用户输入
            const currentInput = this.getCurrentUserInput();
            if (!currentInput) {
                console.log('[DMSS Core] 未找到当前用户输入');
                return;
            }

            // 查找相关记忆
            const relevantMemories = await this.findRelevantMemories(currentInput);
            if (relevantMemories.length === 0) {
                console.log('[DMSS Core] 未找到相关记忆');
                return;
            }

            // 注入记忆
            const injectedContent = await this.injectRelevantMemories(currentInput);
            
            // 更新用户输入框
            this.updateUserInput(injectedContent);
            
            console.log(`[DMSS Core] 已注入 ${relevantMemories.length} 条相关记忆`);
            
        } catch (error) {
            console.error('[DMSS Core] 自动注入记忆失败:', error);
        }
    }

    /**
     * 获取当前用户输入
     */
    getCurrentUserInput() {
        try {
            // 尝试多种方式获取用户输入
            const inputSelectors = [
                '#send_textarea',
                '#user_input',
                '.user-input',
                'textarea[placeholder*="输入"]',
                'textarea[placeholder*="message"]'
            ];

            for (let selector of inputSelectors) {
                const element = document.querySelector(selector);
                if (element && element.value) {
                    return element.value;
                }
            }

            return null;
        } catch (error) {
            console.error('[DMSS Core] 获取用户输入失败:', error);
            return null;
        }
    }

    /**
     * 更新用户输入框内容
     */
    updateUserInput(content) {
        try {
            const inputSelectors = [
                '#send_textarea',
                '#user_input',
                '.user-input',
                'textarea[placeholder*="输入"]',
                'textarea[placeholder*="message"]'
            ];

            for (let selector of inputSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    element.value = content;
                    
                    // 触发输入事件
                    const event = new Event('input', { bubbles: true });
                    element.dispatchEvent(event);
                    
                    console.log('[DMSS Core] 已更新用户输入框');
                    return;
                }
            }

            console.log('[DMSS Core] 未找到用户输入框');
        } catch (error) {
            console.error('[DMSS Core] 更新用户输入失败:', error);
        }
    }

    /**
     * 从世界书加载记忆条目
     */
    async loadMemoryEntries() {
        try {
            // 使用酒馆的slash命令获取世界书条目
            const entries = await this.executeSlashCommand('/db-list source=chat field=name');
            
            if (entries && Array.isArray(entries)) {
                this.memoryEntries = entries
                    .filter(entry => entry.name && entry.name.startsWith('DMSS_'))
                    .map(entry => ({
                        key: entry.name,
                        content: entry.content || '',
                        summary: entry.summary || '',
                        timestamp: entry.timestamp || new Date().toISOString()
                    }));
                
                this.stats.totalEntries = this.memoryEntries.length;
                console.log(`[DMSS Core] 已加载 ${this.memoryEntries.length} 个记忆条目`);
            }
            
        } catch (error) {
            console.error('[DMSS Core] 加载记忆条目失败:', error);
        }
    }

    /**
     * 获取所有记忆条目
     */
    getAllMemories() {
        return this.memoryEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * 获取统计信息
     */
    getStats() {
        return {
            ...this.stats,
            isEnabled: this.isEnabled,
            memoryCount: this.memoryEntries.length
        };
    }

    /**
     * 执行酒馆slash命令
     */
    async executeSlashCommand(command) {
        try {
            console.log(`[DMSS Core] 执行命令: ${command}`);
            
            // 尝试使用SillyTavern的slash命令系统
            if (window.executeSlashCommand) {
                return await window.executeSlashCommand(command);
            }
            
            // 如果直接调用不可用，尝试通过事件系统
            if (window.dispatchEvent) {
                const event = new CustomEvent('dmss-slash-command', {
                    detail: { command: command }
                });
                window.dispatchEvent(event);
            }
            
            // 尝试通过jQuery触发（如果可用）
            if (window.$ && window.$.fn.trigger) {
                window.$('body').trigger('dmss-slash-command', { command: command });
            }
            
            // 模拟执行结果（用于测试）
            return this.simulateSlashCommand(command);
            
        } catch (error) {
            console.error('[DMSS Core] 执行slash命令失败:', error);
            throw error;
        }
    }

    /**
     * 模拟slash命令执行（用于测试）
     */
    simulateSlashCommand(command) {
        console.log(`[DMSS Core] 模拟执行命令: ${command}`);
        
        // 解析命令并返回模拟结果
        if (command.includes('/getchatbook')) {
            return 'chatLore';
        } else if (command.includes('/createentry')) {
            return 'DMSS_Entry_Created';
        } else if (command.includes('/db-list')) {
            return this.memoryEntries.map(entry => ({
                name: entry.key,
                content: entry.content,
                timestamp: entry.timestamp
            }));
        } else if (command.includes('/db-delete')) {
            return 'Entry_Deleted';
        }
        
        return null;
    }

    /**
     * 删除指定的记忆条目
     */
    async deleteMemoryEntry(entryKey) {
        try {
            // 从世界书删除
            await this.executeSlashCommand(`/db-delete source=chat ${entryKey}`);
            
            // 从本地缓存删除
            this.memoryEntries = this.memoryEntries.filter(entry => entry.key !== entryKey);
            this.stats.totalEntries = this.memoryEntries.length;
            
            console.log(`[DMSS Core] 已删除记忆条目: ${entryKey}`);
            
        } catch (error) {
            console.error('[DMSS Core] 删除记忆条目失败:', error);
        }
    }

    /**
     * 清空所有记忆
     */
    async clearAllMemories() {
        try {
            for (let entry of this.memoryEntries) {
                await this.executeSlashCommand(`/db-delete source=chat ${entry.key}`);
            }
            
            this.memoryEntries = [];
            this.stats.totalEntries = 0;
            
            console.log('[DMSS Core] 已清空所有记忆');
            
        } catch (error) {
            console.error('[DMSS Core] 清空记忆失败:', error);
        }
    }
}

// 导出核心类
window.DMSSCore = DMSSCore;