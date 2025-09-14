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
            processedMessages: 0,
            errors: 0,
            warnings: 0
        };
        this.logLevel = 'info'; // debug, info, warn, error
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1秒
        
        this.log('info', '核心模块已初始化');
    }

    /**
     * 日志记录函数
     */
    log(level, message, data = null) {
        const levels = { debug: 0, info: 1, warn: 2, error: 3 };
        const currentLevel = levels[this.logLevel] || 1;
        const messageLevel = levels[level] || 1;

        if (messageLevel >= currentLevel) {
            const timestamp = new Date().toISOString();
            const logMessage = `[DMSS Core] [${timestamp}] [${level.toUpperCase()}] ${message}`;
            
            if (data) {
                console.log(logMessage, data);
            } else {
                console.log(logMessage);
            }

            // 记录错误和警告统计
            if (level === 'error') {
                this.stats.errors++;
            } else if (level === 'warn') {
                this.stats.warnings++;
            }
        }
    }

    /**
     * 启动DMSS系统
     */
    async start() {
        try {
            if (this.isEnabled) {
                this.log('warn', '系统已在运行中');
                return;
            }

            this.isEnabled = true;
            
            // 确保DMSS世界书存在
            await this.ensureDMSSLorebookExists();
            
            await this.loadMemoryEntries();
            this.log('info', '系统已启动');
        } catch (error) {
            this.log('error', '启动系统失败', error);
            this.isEnabled = false;
            throw error;
        }
    }

    /**
     * 停止DMSS系统
     */
    stop() {
        try {
            this.isEnabled = false;
            this.log('info', '系统已停止');
        } catch (error) {
            this.log('error', '停止系统失败', error);
        }
    }

    /**
     * 重置DMSS系统
     */
    async reset() {
        try {
            this.memoryEntries = [];
            this.lastProcessedMessage = null;
            this.stats = {
                totalEntries: 0,
                lastUpdate: null,
                processedMessages: 0,
                errors: 0,
                warnings: 0
            };
            this.log('info', '系统已重置');
        } catch (error) {
            this.log('error', '重置系统失败', error);
            throw error;
        }
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
     * 确保DMSS全局lorebook存在
     */
    async ensureDMSSLorebookExists() {
        try {
            // 首先检查是否已有DMSS全局lorebook
            const globalBooksCommand = '/getglobalbooks';
            const globalBooks = await this.executeSlashCommand(globalBooksCommand);
            
            this.log('debug', '当前全局lorebook列表', globalBooks);
            
            // 检查是否包含DMSS
            if (globalBooks && globalBooks.includes('DMSS')) {
                this.log('info', 'DMSS全局lorebook已存在');
                return true;
            }
            
            // 如果不存在，尝试创建第一个条目来初始化lorebook
            this.log('info', 'DMSS全局lorebook不存在，正在创建...');
            
            try {
                // 使用createentry命令创建第一个条目来初始化DMSS lorebook
                const initCommand = '/createentry file=DMSS key=DMSS_System_Init "DMSS系统初始化条目 - 此条目用于初始化DMSS全局lorebook"';
                await this.executeSlashCommand(initCommand);
                
                this.log('info', 'DMSS全局lorebook创建成功！');
                
                // 显示系统提示
                if (typeof toastr !== 'undefined') {
                    toastr.success('DMSS世界书已创建！', '系统提示', { timeOut: 3000 });
                }
                
                return true;
            } catch (error) {
                this.log('error', '无法创建DMSS全局lorebook', error);
                
                // 显示错误提示
                if (typeof toastr !== 'undefined') {
                    toastr.error('创建DMSS世界书失败，请手动在SillyTavern中创建名为"DMSS"的全局lorebook', '错误', { timeOut: 5000 });
                }
                
                return false;
            }
            
        } catch (error) {
            this.log('error', '检查DMSS全局lorebook失败', error);
            return false;
        }
    }

    /**
     * 存储DMSS条目到全局lorebook
     */
    async storeDMSSEntry(content) {
        try {
            // 确保DMSS全局lorebook存在
            await this.ensureDMSSLorebookExists();
            
            // 生成唯一的时间戳ID，包含角色名
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const charName = this.getCurrentCharacterName();
            const entryKey = `${charName}_${timestamp}`;
            
            // 创建摘要
            const summary = this.generateSummary(content);
            
            // 存储到全局lorebook
            const entryData = {
                content: content,
                summary: summary,
                timestamp: new Date().toISOString(),
                key: entryKey,
                character: charName
            };

            // 使用酒馆的slash命令存储到DMSS全局lorebook
            // 注意：createentry命令的格式是 /createentry file=文件名 key=键名 内容
            const command = `/createentry file=DMSS key=${entryKey} ${JSON.stringify(entryData)}`;
            await this.executeSlashCommand(command);
            
            // 更新本地缓存
            this.memoryEntries.push(entryData);
            this.stats.totalEntries++;
            
            this.log('info', `已存储DMSS条目到全局lorebook: ${entryKey}`);
            
            // 显示成功提示
            if (typeof toastr !== 'undefined') {
                toastr.success(`已保存记忆: ${entryKey}`, 'DMSS', { timeOut: 2000 });
            }
            
        } catch (error) {
            this.log('error', '存储DMSS条目到全局lorebook失败', error);
            
            // 显示错误提示
            if (typeof toastr !== 'undefined') {
                toastr.error('保存记忆失败', 'DMSS错误', { timeOut: 3000 });
            }
        }
    }

    /**
     * 获取当前角色名
     */
    getCurrentCharacterName() {
        try {
            // 尝试从SillyTavern获取当前角色名
            if (window.chat && window.chat.length > 0) {
                const lastMessage = window.chat[window.chat.length - 1];
                if (lastMessage && lastMessage.name) {
                    return lastMessage.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
                }
            }
            
            // 尝试从DOM获取角色名
            const charNameElement = document.querySelector('#char_name') || 
                                  document.querySelector('.char_name') ||
                                  document.querySelector('[data-char-name]');
            
            if (charNameElement) {
                return charNameElement.textContent.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
            }
            
            // 默认返回Unknown
            return 'Unknown';
        } catch (error) {
            this.log('warn', '获取角色名失败，使用默认值', error);
            return 'Unknown';
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
     * 从全局lorebook加载记忆条目
     */
    async loadMemoryEntries() {
        try {
            // 使用slash命令获取DMSS lorebook中的所有条目
            // 注意：这里需要使用findentry命令来查找DMSS相关的条目
            const entries = await this.executeSlashCommand('/findentry file=DMSS field=key DMSS');
            
            if (entries && Array.isArray(entries)) {
                this.memoryEntries = [];
                for (const entryUID of entries) {
                    try {
                        // 获取条目内容
                        const getCommand = `/getentryfield file=DMSS field=content ${entryUID}`;
                        const content = await this.executeSlashCommand(getCommand);
                        
                        if (content) {
                            const entryData = JSON.parse(content);
                            this.memoryEntries.push(entryData);
                        }
                    } catch (error) {
                        this.log('warn', `加载条目 ${entryUID} 失败`, error);
                    }
                }
                
                this.stats.totalEntries = this.memoryEntries.length;
                this.log('info', `从DMSS lorebook加载了 ${this.memoryEntries.length} 个记忆条目`);
            } else {
                this.log('info', 'DMSS lorebook中没有找到记忆条目');
            }
            
        } catch (error) {
            this.log('error', '从DMSS lorebook加载记忆条目失败', error);
            // 如果加载失败，使用空数组
            this.memoryEntries = [];
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
     * 执行酒馆slash命令（带重试机制）
     */
    async executeSlashCommand(command, retryCount = 0) {
        try {
            this.log('debug', `执行命令: ${command}`, { retryCount });
            
            // 尝试使用SillyTavern的slash命令系统
            if (window.executeSlashCommand) {
                const result = await window.executeSlashCommand(command);
                this.log('debug', '命令执行成功', { command, result });
                return result;
            }
            
            // 如果直接调用不可用，尝试通过事件系统
            if (window.dispatchEvent) {
                const event = new CustomEvent('dmss-slash-command', {
                    detail: { command: command }
                });
                window.dispatchEvent(event);
                this.log('debug', '通过事件系统发送命令', { command });
            }
            
            // 尝试通过jQuery触发（如果可用）
            if (window.$ && window.$.fn.trigger) {
                window.$('body').trigger('dmss-slash-command', { command: command });
                this.log('debug', '通过jQuery发送命令', { command });
            }
            
            // 模拟执行结果（用于测试）
            const result = this.simulateSlashCommand(command);
            this.log('debug', '使用模拟执行', { command, result });
            return result;
            
        } catch (error) {
            this.log('error', '执行slash命令失败', { command, retryCount, error });
            
            // 重试机制
            if (retryCount < this.maxRetries) {
                this.log('warn', `重试执行命令 (${retryCount + 1}/${this.maxRetries})`, { command });
                await this.delay(this.retryDelay * (retryCount + 1));
                return await this.executeSlashCommand(command, retryCount + 1);
            }
            
            throw error;
        }
    }

    /**
     * 延迟函数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
            // 首先找到条目的UID
            const findCommand = `/findentry file=DMSS field=key ${entryKey}`;
            const entryUID = await this.executeSlashCommand(findCommand);
            
            if (entryUID) {
                // 使用setentryfield命令删除条目（设置为空内容）
                await this.executeSlashCommand(`/setentryfield file=DMSS uid=${entryUID} field=content ""`);
                
                // 从本地缓存删除
                this.memoryEntries = this.memoryEntries.filter(entry => entry.key !== entryKey);
                this.stats.totalEntries = this.memoryEntries.length;
                
                this.log('info', `已从DMSS lorebook删除记忆条目: ${entryKey}`);
            } else {
                this.log('warn', `未找到要删除的条目: ${entryKey}`);
            }
            
        } catch (error) {
            this.log('error', '从DMSS lorebook删除记忆条目失败', error);
        }
    }

    /**
     * 清空所有记忆
     */
    async clearAllMemories() {
        try {
            // 获取所有DMSS条目
            const entries = await this.executeSlashCommand('/findentry file=DMSS field=key DMSS');
            
            if (entries && Array.isArray(entries)) {
                for (const entryUID of entries) {
                    try {
                        // 清空每个条目的内容
                        await this.executeSlashCommand(`/setentryfield file=DMSS uid=${entryUID} field=content ""`);
                    } catch (error) {
                        this.log('warn', `清空条目 ${entryUID} 失败`, error);
                    }
                }
            }
            
            this.memoryEntries = [];
            this.stats.totalEntries = 0;
            
            this.log('info', '已清空DMSS lorebook中的所有记忆');
            
        } catch (error) {
            this.log('error', '清空DMSS lorebook记忆失败', error);
        }
    }
}

// 导出核心类
window.DMSSCore = DMSSCore;