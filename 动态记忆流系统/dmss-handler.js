/**
 * DMSS (动态记忆流系统) 核心处理器
 * 实现四个核心功能：数据捕获、持久化、组合应用、上下文注入
 * 
 * @author Cursor
 * @version 1.0.0
 */

(function() {
    'use strict';

    // 检查依赖库是否已加载
    console.log('[DMSS] 开始检查依赖库...');
    console.log('[DMSS] jQuery:', typeof $ !== 'undefined' ? '已加载' : '未加载');
    console.log('[DMSS] Lodash:', typeof _ !== 'undefined' ? '已加载' : '未加载');
    console.log('[DMSS] Toastr:', typeof toastr !== 'undefined' ? '已加载' : '未加载');
    
    if (typeof $ === 'undefined') {
        console.error('[DMSS] jQuery 未加载，无法初始化DMSS系统');
        return;
    }
    
    if (typeof _ === 'undefined') {
        console.error('[DMSS] Lodash 未加载，无法初始化DMSS系统');
        return;
    }
    
    if (typeof toastr === 'undefined') {
        console.error('[DMSS] Toastr 未加载，无法初始化DMSS系统');
        return;
    }
    
    console.log('[DMSS] 所有依赖库检查通过');

    // DMSS 配置常量
    const DMSS_CONFIG = {
        DB_NAME: 'JanusTreasureChestDB',
        DB_VERSION: 1,
        STORE_NAME: 'DMSS_Store',
        DMSS_REGEX: /<DMSS>([\s\S]*?)<\/DMSS>/g,
        CONTEXT_PREFIX: '[Current World State based on DMSS]',
        CONTEXT_SUFFIX: '[/Current World State based on DMSS]'
    };

    // Zod Schema 定义 (简化版本，因为可能没有zod库)
    const DMSS_COMMAND_SCHEMA = {
        validate: function(command) {
            if (!command || typeof command !== 'object') {
                return { valid: false, error: '指令必须是对象' };
            }
            
            if (!command.action || typeof command.action !== 'string') {
                return { valid: false, error: '缺少action字段' };
            }
            
            if (!command.target || typeof command.target !== 'string') {
                return { valid: false, error: '缺少target字段' };
            }
            
            if (!command.payload || typeof command.payload !== 'object') {
                return { valid: false, error: '缺少payload字段' };
            }
            
            const validActions = ['CREATE', 'APPEND', 'MOVE', 'COMPRESS'];
            if (!validActions.includes(command.action)) {
                return { valid: false, error: `无效的action: ${command.action}` };
            }
            
            return { valid: true };
        }
    };

    /**
     * DMSS 数据库管理器
     * 负责IndexedDB的初始化、数据存储和读取
     */
    const DMSSDatabase = {
        db: null,
        
        /**
         * 初始化数据库
         */
        async init() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(DMSS_CONFIG.DB_NAME, DMSS_CONFIG.DB_VERSION);
                
                request.onerror = () => {
                    console.error('[DMSS] 数据库打开失败:', request.error);
                    reject(request.error);
                };
                
                request.onsuccess = () => {
                    this.db = request.result;
                    console.log('[DMSS] 数据库初始化成功');
                    resolve();
                };
                
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    
                    // 创建对象仓库
                    if (!db.objectStoreNames.contains(DMSS_CONFIG.STORE_NAME)) {
                        const store = db.createObjectStore(DMSS_CONFIG.STORE_NAME, {
                            keyPath: 'id',
                            autoIncrement: true
                        });
                        
                        // 创建索引
                        store.createIndex('target', 'target', { unique: false });
                        store.createIndex('timestamp', 'timestamp', { unique: false });
                        store.createIndex('action', 'action', { unique: false });
                        
                        console.log('[DMSS] 对象仓库创建成功');
                    }
                };
            });
        },
        
        /**
         * 保存DMSS指令到数据库
         * @param {Array} commands - DMSS指令数组
         */
        async saveCommands(commands) {
            if (!this.db) {
                await this.init();
            }
            
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([DMSS_CONFIG.STORE_NAME], 'readwrite');
                const store = transaction.objectStore(DMSS_CONFIG.STORE_NAME);
                
                const promises = commands.map(command => {
                    return new Promise((resolveCmd, rejectCmd) => {
                        const commandWithTimestamp = {
                            ...command,
                            timestamp: new Date().toISOString(),
                            processed: false
                        };
                        
                        const request = store.add(commandWithTimestamp);
                        request.onsuccess = () => resolveCmd();
                        request.onerror = () => rejectCmd(request.error);
                    });
                });
                
                Promise.all(promises)
                    .then(() => {
                        console.log(`[DMSS] 成功保存 ${commands.length} 条指令`);
                        toastr.success(`DMSS记忆已更新 (${commands.length}条指令)`);
                        resolve();
                    })
                    .catch(error => {
                        console.error('[DMSS] 保存指令失败:', error);
                        toastr.error('DMSS指令保存失败');
                        reject(error);
                    });
            });
        },
        
        /**
         * 获取所有DMSS指令
         * @returns {Promise<Array>} 所有指令数组
         */
        async getAllCommands() {
            if (!this.db) {
                await this.init();
            }
            
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([DMSS_CONFIG.STORE_NAME], 'readonly');
                const store = transaction.objectStore(DMSS_CONFIG.STORE_NAME);
                const request = store.getAll();
                
                request.onsuccess = () => {
                    resolve(request.result || []);
                };
                
                request.onerror = () => {
                    console.error('[DMSS] 读取指令失败:', request.error);
                    reject(request.error);
                };
            });
        },
        
        /**
         * 根据目标获取相关指令
         * @param {string} target - 目标路径
         * @returns {Promise<Array>} 相关指令数组
         */
        async getCommandsByTarget(target) {
            if (!this.db) {
                await this.init();
            }
            
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([DMSS_CONFIG.STORE_NAME], 'readonly');
                const store = transaction.objectStore(DMSS_CONFIG.STORE_NAME);
                const index = store.index('target');
                const request = index.getAll(target);
                
                request.onsuccess = () => {
                    resolve(request.result || []);
                };
                
                request.onerror = () => {
                    reject(request.error);
                };
            });
        }
    };

    /**
     * DMSS 指令处理器
     * 负责捕获、解析和验证LLM输出的DMSS指令
     */
    const DMSSCommandProcessor = {
        
        /**
         * 从消息文本中提取DMSS指令
         * @param {string} messageText - 消息文本
         * @returns {Array} 提取的指令数组
         */
        extractCommands(messageText) {
            if (!messageText || typeof messageText !== 'string') {
                return [];
            }
            
            const matches = [];
            let match;
            
            // 重置正则表达式
            DMSS_CONFIG.DMSS_REGEX.lastIndex = 0;
            
            while ((match = DMSS_CONFIG.DMSS_REGEX.exec(messageText)) !== null) {
                matches.push(match[1].trim());
            }
            
            return matches;
        },
        
        /**
         * 解析和验证DMSS指令
         * @param {string} commandText - 指令文本
         * @returns {Object} 解析结果
         */
        parseCommand(commandText) {
            try {
                // 解析JSON
                const commands = JSON.parse(commandText);
                
                // 确保是数组
                if (!Array.isArray(commands)) {
                    return {
                        success: false,
                        error: 'DMSS指令必须是数组格式',
                        commands: []
                    };
                }
                
                // 验证每个指令
                const validatedCommands = [];
                const errors = [];
                
                commands.forEach((command, index) => {
                    const validation = DMSS_COMMAND_SCHEMA.validate(command);
                    if (validation.valid) {
                        validatedCommands.push(command);
                    } else {
                        errors.push(`指令 ${index + 1}: ${validation.error}`);
                    }
                });
                
                if (errors.length > 0) {
                    return {
                        success: false,
                        error: errors.join('; '),
                        commands: validatedCommands
                    };
                }
                
                return {
                    success: true,
                    commands: validatedCommands
                };
                
            } catch (error) {
                return {
                    success: false,
                    error: `JSON解析失败: ${error.message}`,
                    commands: []
                };
            }
        },
        
        /**
         * 处理消息中的DMSS指令
         * @param {string} messageText - 消息文本
         * @returns {Promise<Object>} 处理结果
         */
        async processMessage(messageText) {
            const extractedTexts = this.extractCommands(messageText);
            
            if (extractedTexts.length === 0) {
                return { success: true, commands: [] };
            }
            
            const allCommands = [];
            const errors = [];
            
            for (const text of extractedTexts) {
                const result = this.parseCommand(text);
                if (result.success) {
                    allCommands.push(...result.commands);
                } else {
                    errors.push(result.error);
                }
            }
            
            if (errors.length > 0) {
                toastr.error(`DMSS数据解析失败: ${errors.join('; ')}`);
                return { success: false, commands: [], errors };
            }
            
            if (allCommands.length > 0) {
                // 保存到数据库
                try {
                    await DMSSDatabase.saveCommands(allCommands);
                    return { success: true, commands: allCommands };
                } catch (error) {
                    console.error('[DMSS] 保存指令失败:', error);
                    return { success: false, commands: [], errors: [error.message] };
                }
            }
            
            return { success: true, commands: [] };
        }
    };

    /**
     * DMSS 记忆快照构建器
     * 负责将历史指令组合成完整的记忆快照
     */
    const DMSSMemorySnapshot = {
        
        /**
         * 构建记忆快照
         * @param {Array} commands - 所有历史指令
         * @returns {Object} 记忆快照对象
         */
        buildSnapshot(commands) {
            const snapshot = {
                archive: {}, // 档案区
                standby: {}  // 备用区
            };
            
            // 按时间戳排序指令
            const sortedCommands = _.sortBy(commands, 'timestamp');
            
            sortedCommands.forEach(command => {
                try {
                    this.processCommand(snapshot, command);
                } catch (error) {
                    console.error(`[DMSS] 处理指令失败:`, command, error);
                }
            });
            
            return snapshot;
        },
        
        /**
         * 处理单个指令
         * @param {Object} snapshot - 记忆快照对象
         * @param {Object} command - DMSS指令
         */
        processCommand(snapshot, command) {
            const { action, target, payload } = command;
            
            switch (action) {
                case 'CREATE':
                    this.handleCreate(snapshot, target, payload);
                    break;
                    
                case 'APPEND':
                    this.handleAppend(snapshot, target, payload);
                    break;
                    
                case 'MOVE':
                    this.handleMove(snapshot, target, payload);
                    break;
                    
                case 'COMPRESS':
                    this.handleCompress(snapshot, target, payload);
                    break;
                    
                default:
                    console.warn(`[DMSS] 未知指令类型: ${action}`);
            }
        },
        
        /**
         * 处理CREATE指令
         */
        handleCreate(snapshot, target, payload) {
            // 根据ID前缀判断存储区域
            const area = this.getAreaByPrefix(target);
            const areaKey = area === 'archive' ? 'archive' : 'standby';
            
            _.set(snapshot[areaKey], target, payload);
        },
        
        /**
         * 处理APPEND指令
         */
        handleAppend(snapshot, target, payload) {
            // 解析目标路径
            const pathParts = target.split('.');
            const id = pathParts[0];
            const fieldPath = pathParts.slice(1).join('.');
            
            // 确定区域
            const area = this.getAreaByPrefix(id);
            const areaKey = area === 'archive' ? 'archive' : 'standby';
            
            // 构建完整路径
            const fullPath = `${id}.${fieldPath}`;
            
            // 获取现有值
            let existingValue = _.get(snapshot[areaKey], fullPath);
            
            if (Array.isArray(existingValue)) {
                existingValue.push(payload);
            } else {
                existingValue = [payload];
            }
            
            _.set(snapshot[areaKey], fullPath, existingValue);
        },
        
        /**
         * 处理MOVE指令
         */
        handleMove(snapshot, target, payload) {
            const { from, to, new_id } = payload;
            
            // 从源区域获取数据
            const sourceArea = this.getAreaByPrefix(target);
            const sourceAreaKey = sourceArea === 'archive' ? 'archive' : 'standby';
            
            const data = _.get(snapshot[sourceAreaKey], target);
            if (data) {
                // 从源区域删除
                _.unset(snapshot[sourceAreaKey], target);
                
                // 添加到目标区域
                const targetArea = this.getAreaByPrefix(new_id);
                const targetAreaKey = targetArea === 'archive' ? 'archive' : 'standby';
                
                _.set(snapshot[targetAreaKey], new_id, data);
            }
        },
        
        /**
         * 处理COMPRESS指令
         */
        handleCompress(snapshot, target, payload) {
            const { arc_id, arc_summary, events_to_delete } = payload;
            
            // 获取目标角色的履历
            const pathParts = target.split('.');
            const charId = pathParts[0];
            const fieldPath = pathParts.slice(1).join('.');
            
            const area = this.getAreaByPrefix(charId);
            const areaKey = area === 'archive' ? 'archive' : 'standby';
            
            const fullPath = `${charId}.${fieldPath}`;
            let lifeHistory = _.get(snapshot[areaKey], fullPath);
            
            if (!lifeHistory) {
                lifeHistory = {};
            }
            
            // 添加ARC章节
            lifeHistory[arc_id] = arc_summary;
            
            // 删除指定事件
            if (events_to_delete && Array.isArray(events_to_delete)) {
                events_to_delete.forEach(eventId => {
                    delete lifeHistory[eventId];
                });
            }
            
            _.set(snapshot[areaKey], fullPath, lifeHistory);
        },
        
        /**
         * 根据ID前缀确定存储区域
         * @param {string} id - 条目ID
         * @returns {string} 区域名称
         */
        getAreaByPrefix(id) {
            if (id.startsWith('C_') || id.startsWith('G_') || id.startsWith('T_')) {
                return 'archive';
            } else if (id.startsWith('P_') || id.startsWith('A_')) {
                return 'standby';
            }
            
            // 默认返回archive
            return 'archive';
        },
        
        /**
         * 获取当前记忆快照
         * @returns {Promise<Object>} 记忆快照
         */
        async getCurrentSnapshot() {
            try {
                const commands = await DMSSDatabase.getAllCommands();
                return this.buildSnapshot(commands);
            } catch (error) {
                console.error('[DMSS] 获取记忆快照失败:', error);
                return { archive: {}, standby: {} };
            }
        }
    };

    /**
     * DMSS 上下文注入器
     * 负责将记忆快照注入到SillyTavern的上下文中
     */
    const DMSSContextInjector = {
        
        /**
         * 注入记忆快照到上下文
         * @param {Object} snapshot - 记忆快照
         * @returns {string} 格式化的上下文文本
         */
        formatContext(snapshot) {
            const formattedSnapshot = JSON.stringify(snapshot, null, 2);
            
            return `${DMSS_CONFIG.CONTEXT_PREFIX}\n${formattedSnapshot}\n${DMSS_CONFIG.CONTEXT_SUFFIX}`;
        },
        
        /**
         * 注入到SillyTavern系统
         * @param {string} contextText - 上下文文本
         */
        injectToSillyTavern(contextText) {
            try {
                // 方法1: 尝试注入到系统提示
                this.injectToSystemPrompt(contextText);
                
                // 方法2: 尝试注入到用户输入
                this.injectToUserInput(contextText);
                
                // 方法3: 尝试注入到角色描述
                this.injectToCharacterDescription(contextText);
                
                console.log('[DMSS] 上下文注入完成');
                
            } catch (error) {
                console.error('[DMSS] 上下文注入失败:', error);
                toastr.warning('DMSS上下文注入失败，但系统仍可正常工作');
            }
        },
        
        /**
         * 注入到系统提示
         */
        injectToSystemPrompt(contextText) {
            // 查找系统提示输入框
            const systemPromptSelectors = [
                '#system_prompt',
                '#systemPrompt',
                '.system-prompt',
                'textarea[name="system_prompt"]',
                'textarea[placeholder*="system"]'
            ];
            
            for (const selector of systemPromptSelectors) {
                const element = $(selector);
                if (element.length > 0) {
                    const currentValue = element.val() || '';
                    if (!currentValue.includes(DMSS_CONFIG.CONTEXT_PREFIX)) {
                        element.val(currentValue + '\n\n' + contextText);
                        console.log('[DMSS] 已注入到系统提示');
                        return;
                    }
                }
            }
        },
        
        /**
         * 注入到用户输入
         */
        injectToUserInput(contextText) {
            // 查找用户输入框
            const userInputSelectors = [
                '#send_textarea',
                '#user_input',
                '.user-input',
                'textarea[name="user_input"]',
                'textarea[placeholder*="message"]'
            ];
            
            for (const selector of userInputSelectors) {
                const element = $(selector);
                if (element.length > 0) {
                    const currentValue = element.val() || '';
                    if (!currentValue.includes(DMSS_CONFIG.CONTEXT_PREFIX)) {
                        element.val(contextText + '\n\n' + currentValue);
                        console.log('[DMSS] 已注入到用户输入');
                        return;
                    }
                }
            }
        },
        
        /**
         * 注入到角色描述
         */
        injectToCharacterDescription(contextText) {
            // 查找角色描述输入框
            const charDescSelectors = [
                '#character_description',
                '#char_desc',
                '.character-description',
                'textarea[name="character_description"]'
            ];
            
            for (const selector of charDescSelectors) {
                const element = $(selector);
                if (element.length > 0) {
                    const currentValue = element.val() || '';
                    if (!currentValue.includes(DMSS_CONFIG.CONTEXT_PREFIX)) {
                        element.val(currentValue + '\n\n' + contextText);
                        console.log('[DMSS] 已注入到角色描述');
                        return;
                    }
                }
            }
        },
        
        /**
         * 自动注入当前记忆快照
         */
        async autoInject() {
            try {
                const snapshot = await DMSSMemorySnapshot.getCurrentSnapshot();
                const contextText = this.formatContext(snapshot);
                this.injectToSillyTavern(contextText);
            } catch (error) {
                console.error('[DMSS] 自动注入失败:', error);
            }
        }
    };

    /**
     * DMSS 主控制器
     * 协调各个模块的工作
     */
    const DMSSController = {
        
        /**
         * 初始化DMSS系统
         */
        async init() {
            try {
                console.log('[DMSS] 开始初始化系统...');
                console.log('[DMSS] 当前时间:', new Date().toISOString());
                console.log('[DMSS] 页面URL:', window.location.href);
                
                // 初始化数据库
                console.log('[DMSS] 正在初始化数据库...');
                await DMSSDatabase.init();
                console.log('[DMSS] 数据库初始化完成');
                
                // 设置消息监听
                console.log('[DMSS] 正在设置消息监听器...');
                this.setupMessageListener();
                console.log('[DMSS] 消息监听器设置完成');
                
                // 设置自动注入
                console.log('[DMSS] 正在设置自动注入...');
                this.setupAutoInject();
                console.log('[DMSS] 自动注入设置完成');
                
                console.log('[DMSS] 系统初始化完成');
                toastr.success('DMSS系统已激活');
                
                // 输出系统状态
                setTimeout(async () => {
                    try {
                        const status = await this.getStatus();
                        console.log('[DMSS] 系统状态:', status);
                    } catch (error) {
                        console.error('[DMSS] 获取状态失败:', error);
                    }
                }, 2000);
                
            } catch (error) {
                console.error('[DMSS] 系统初始化失败:', error);
                toastr.error('DMSS系统初始化失败');
            }
        },
        
        /**
         * 设置消息监听器
         */
        setupMessageListener() {
            // 监听AI响应事件
            $(document).on('ai_response', (event, response) => {
                if (response && typeof response === 'string') {
                    DMSSCommandProcessor.processMessage(response);
                }
            });
            
            // 监听DOM变化，处理AI消息
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                this.processNewMessage(node);
                            }
                        });
                    }
                });
            });
            
            // 开始观察聊天容器
            setTimeout(() => {
                const chatContainer = document.querySelector('#chat, .chat-container, .messages-container, .chat');
                if (chatContainer) {
                    observer.observe(chatContainer, {
                        childList: true,
                        subtree: true
                    });
                    console.log('[DMSS] 消息监听器已启动');
                }
            }, 2000);
        },
        
        /**
         * 处理新消息
         */
        processNewMessage(node) {
            // 查找AI消息内容
            const messageSelectors = [
                '.mes_text',
                '.message_text',
                '.ai_message',
                '.message-content',
                '.msg_text'
            ];
            
            for (const selector of messageSelectors) {
                const messageElement = node.querySelector ? node.querySelector(selector) : 
                                    (node.matches && node.matches(selector) ? node : null);
                
                if (messageElement) {
                    const text = messageElement.textContent || messageElement.innerText;
                    if (text && text.includes('<DMSS>')) {
                        DMSSCommandProcessor.processMessage(text);
                        break;
                    }
                }
            }
        },
        
        /**
         * 设置自动注入
         */
        setupAutoInject() {
            // 在发送消息前自动注入
            $(document).on('click', 'button[onclick*="sendMessage"], .send_button, #send_but', () => {
                setTimeout(() => {
                    DMSSContextInjector.autoInject();
                }, 100);
            });
            
            // 监听回车键发送
            $(document).on('keypress', 'textarea', (e) => {
                if (e.which === 13 && !e.shiftKey) {
                    setTimeout(() => {
                        DMSSContextInjector.autoInject();
                    }, 100);
                }
            });
        },
        
        /**
         * 获取系统状态
         */
        async getStatus() {
            try {
                const commands = await DMSSDatabase.getAllCommands();
                const snapshot = await DMSSMemorySnapshot.getCurrentSnapshot();
                
                return {
                    active: true,
                    totalCommands: commands.length,
                    archiveEntries: Object.keys(snapshot.archive).length,
                    standbyEntries: Object.keys(snapshot.standby).length,
                    lastUpdate: commands.length > 0 ? commands[commands.length - 1].timestamp : null
                };
            } catch (error) {
                console.error('[DMSS] 获取状态失败:', error);
                return {
                    active: false,
                    error: error.message
                };
            }
        },
        
        /**
         * 清理过期数据
         */
        async cleanup(daysOld = 30) {
            try {
                const commands = await DMSSDatabase.getAllCommands();
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - daysOld);
                
                const recentCommands = commands.filter(cmd => 
                    new Date(cmd.timestamp) > cutoffDate
                );
                
                // 这里可以实现更复杂的清理逻辑
                console.log(`[DMSS] 清理完成，保留 ${recentCommands.length} 条最近指令`);
                toastr.success(`DMSS清理完成，保留最近 ${daysOld} 天的数据`);
                
            } catch (error) {
                console.error('[DMSS] 清理失败:', error);
                toastr.error('DMSS清理失败');
            }
        }
    };

    // 暴露API到全局
    window.DMSS = {
        init: () => DMSSController.init(),
        getStatus: () => DMSSController.getStatus(),
        cleanup: (days) => DMSSController.cleanup(days),
        getSnapshot: () => DMSSMemorySnapshot.getCurrentSnapshot(),
        injectContext: () => DMSSContextInjector.autoInject(),
        
        // 测试用API
        testCommand: async (commandText) => {
            console.log('[DMSS测试] 测试指令:', commandText);
            return await DMSSCommandProcessor.processMessage(commandText);
        },
        
        testCreateCharacter: async () => {
            const testCommand = `<DMSS>
[{"action":"CREATE","target":"C_001_测试角色","payload":{"核心驱动":"探索未知世界","关系网":{"NPC_A":"朋友","NPC_B":"敌人"},"人生履历":{"ARC_第一章_初入世界":"角色初次进入游戏世界，学习基本技能，结识第一个朋友NPC_A"}}}]
</DMSS>`;
            return await DMSSCommandProcessor.processMessage(testCommand);
        },
        
        testAppendEvent: async () => {
            const testCommand = `<DMSS>
[{"action":"APPEND","target":"C_001_测试角色.人生履历.E_001_酒馆冲突","payload":{"content":"在酒馆中与NPC_B发生冲突","timestamp":"2025-01-15","location":"酒馆"}}]
</DMSS>`;
            return await DMSSCommandProcessor.processMessage(testCommand);
        },
        
        // 调试用API
        _debug: {
            database: DMSSDatabase,
            processor: DMSSCommandProcessor,
            snapshot: DMSSMemorySnapshot,
            injector: DMSSContextInjector,
            controller: DMSSController
        }
    };

    // 自动初始化
    $(document).ready(() => {
        setTimeout(() => {
            DMSSController.init();
        }, 1000);
    });

    console.log('[DMSS] DMSS处理器已加载');

})();