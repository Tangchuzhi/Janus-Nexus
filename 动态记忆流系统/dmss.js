/**
 * 动态记忆流系统 (Dynamic Memory Stream System - DMSS)
 * 为SillyTavern提供智能记忆管理和上下文注入功能
 */

class DynamicMemoryStreamSystem {
    constructor() {
        this.name = 'DynamicMemoryStreamSystem';
        this.version = '1.0.0';
        this.isEnabled = false;
        this.memoryData = {
            archive: {}, // 档案区
            standby: {}  // 备用区
        };
        this.currentChatId = null;
        this.autoProcessEnabled = true;
        this.compressionThreshold = 5; // 事件数量阈值，超过此数量触发压缩
        
        this.init();
    }

    init() {
        console.log(`[${this.name}] 初始化动态记忆流系统`);
        this.loadMemoryData();
        this.setupEventListeners();
        this.createUI();
        this.registerSlashCommands();
    }

    /**
     * 从酒馆数据库加载记忆数据
     */
    async loadMemoryData() {
        try {
            const chatId = this.getCurrentChatId();
            if (!chatId) return;

            // 使用SillyTavern的扩展设置存储
            const archiveData = await this.getDataBankData('archive', chatId);
            const standbyData = await this.getDataBankData('standby', chatId);
            
            this.memoryData.archive = archiveData || {};
            this.memoryData.standby = standbyData || {};
            
            console.log(`[${this.name}] 记忆数据加载完成`, {
                archive: Object.keys(this.memoryData.archive).length,
                standby: Object.keys(this.memoryData.standby).length
            });
        } catch (error) {
            console.error(`[${this.name}] 加载记忆数据失败:`, error);
        }
    }

    /**
     * 保存记忆数据到酒馆数据库
     */
    async saveMemoryData() {
        try {
            const chatId = this.getCurrentChatId();
            if (!chatId) return;

            // 保存档案区数据
            await this.setDataBankData('archive', chatId, this.memoryData.archive);
            // 保存备用区数据
            await this.setDataBankData('standby', chatId, this.memoryData.standby);
            
            console.log(`[${this.name}] 记忆数据保存完成`);
        } catch (error) {
            console.error(`[${this.name}] 保存记忆数据失败:`, error);
        }
    }

    /**
     * 获取当前聊天ID
     */
    getCurrentChatId() {
        if (window.chatId) {
            return window.chatId;
        }
        
        // 尝试从URL获取聊天ID
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('chatId') || 'default';
    }

    /**
     * 使用酒馆数据库API获取数据
     */
    async getDataBankData(key, chatId) {
        try {
            // 使用SillyTavern的扩展设置存储
            const storageKey = `dms_${key}_${chatId}`;
            
            // 尝试从localStorage获取
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                return JSON.parse(stored);
            }
            
            // 尝试从extension_settings获取
            if (window.extension_settings && window.extension_settings.dms) {
                return window.extension_settings.dms[storageKey] || {};
            }
            
            return {};
        } catch (error) {
            console.error(`[${this.name}] 获取数据库数据失败:`, error);
            return {};
        }
    }

    /**
     * 使用酒馆数据库API设置数据
     */
    async setDataBankData(key, chatId, data) {
        try {
            const storageKey = `dms_${key}_${chatId}`;
            
            // 保存到localStorage
            localStorage.setItem(storageKey, JSON.stringify(data));
            
            // 保存到extension_settings
            if (!window.extension_settings) {
                window.extension_settings = {};
            }
            if (!window.extension_settings.dms) {
                window.extension_settings.dms = {};
            }
            window.extension_settings.dms[storageKey] = data;
            
            // 触发设置保存
            if (window.saveSettingsDebounced) {
                window.saveSettingsDebounced();
            }
            
            console.log(`[${this.name}] 数据保存成功: ${storageKey}`);
        } catch (error) {
            console.error(`[${this.name}] 设置数据库数据失败:`, error);
        }
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 监听消息生成完成事件
        if (window.eventSource) {
            window.eventSource.on(event_types.MESSAGE_RECEIVED, (data) => {
                if (this.autoProcessEnabled && this.isEnabled) {
                    this.processNewMessage(data);
                }
            });
        }

        // 监听用户发送消息事件，自动注入上下文
        if (window.eventSource) {
            window.eventSource.on(event_types.MESSAGE_SENT, (data) => {
                if (this.isEnabled) {
                    setTimeout(() => this.autoInjectContext(), 100);
                }
            });
        }

        // 监听聊天切换事件
        if (window.eventSource) {
            window.eventSource.on(event_types.CHAT_CHANGED, (data) => {
                this.currentChatId = data.chatId;
                this.loadMemoryData();
            });
        }

        // 监听窗口关闭事件，保存数据
        window.addEventListener('beforeunload', () => {
            this.saveMemoryData();
        });

        // 监听页面可见性变化，保存数据
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveMemoryData();
            }
        });
    }

    /**
     * 处理新消息
     */
    async processNewMessage(messageData) {
        try {
            const { message, role } = messageData;
            if (role !== 'assistant') return;

            // 分析消息内容，提取结构化信息
            const extractedInfo = await this.extractStructuredInfo(message);
            
            if (extractedInfo) {
                await this.updateMemorySystem(extractedInfo);
                await this.checkCompressionTrigger();
            }
        } catch (error) {
            console.error(`[${this.name}] 处理新消息失败:`, error);
        }
    }

    /**
     * 从消息中提取结构化信息
     */
    async extractStructuredInfo(message) {
        // 这里可以集成AI分析功能，或者使用规则匹配
        // 暂时使用简单的关键词匹配作为示例
        
        const info = {
            type: 'event',
            timestamp: new Date().toISOString(),
            content: message,
            entities: this.extractEntities(message),
            relationships: this.extractRelationships(message),
            locations: this.extractLocations(message)
        };

        return info;
    }

    /**
     * 提取实体（人物、物品等）
     */
    extractEntities(text) {
        const entities = [];
        
        // 简单的实体提取逻辑
        const npcPattern = /\[C\d+_([^\]]+)\]/g;
        const groupPattern = /\[G\d+_([^\]]+)\]/g;
        const itemPattern = /\[T\d+_([^\]]+)\]/g;
        
        let match;
        while ((match = npcPattern.exec(text)) !== null) {
            entities.push({ type: 'npc', name: match[1], id: match[0] });
        }
        
        while ((match = groupPattern.exec(text)) !== null) {
            entities.push({ type: 'group', name: match[1], id: match[0] });
        }
        
        while ((match = itemPattern.exec(text)) !== null) {
            entities.push({ type: 'item', name: match[1], id: match[0] });
        }
        
        return entities;
    }

    /**
     * 提取关系信息
     */
    extractRelationships(text) {
        const relationships = [];
        
        // 关系关键词匹配
        const relationKeywords = ['朋友', '敌人', '恋人', '同事', '家人', '导师', '学生'];
        
        relationKeywords.forEach(keyword => {
            if (text.includes(keyword)) {
                relationships.push({ type: keyword, context: text });
            }
        });
        
        return relationships;
    }

    /**
     * 提取地点信息
     */
    extractLocations(text) {
        const locations = [];
        
        // 地点关键词匹配
        const locationKeywords = ['城市', '村庄', '森林', '山脉', '河流', '城堡', '宫殿', '学校', '医院'];
        
        locationKeywords.forEach(keyword => {
            if (text.includes(keyword)) {
                locations.push({ name: keyword, context: text });
            }
        });
        
        return locations;
    }

    /**
     * 更新记忆系统
     */
    async updateMemorySystem(info) {
        try {
            // 根据信息类型更新相应的记忆区域
            switch (info.type) {
                case 'event':
                    await this.addEvent(info);
                    break;
                case 'character':
                    await this.updateCharacter(info);
                    break;
                case 'group':
                    await this.updateGroup(info);
                    break;
                case 'item':
                    await this.updateItem(info);
                    break;
            }
            
            await this.saveMemoryData();
        } catch (error) {
            console.error(`[${this.name}] 更新记忆系统失败:`, error);
        }
    }

    /**
     * 添加事件
     */
    async addEvent(eventInfo) {
        const eventId = `E${Date.now()}_${eventInfo.entities[0]?.name || '事件'}`;
        
        this.memoryData.archive[eventId] = {
            type: 'event',
            timestamp: eventInfo.timestamp,
            content: eventInfo.content,
            entities: eventInfo.entities,
            relationships: eventInfo.relationships,
            locations: eventInfo.locations,
            summary: this.generateEventSummary(eventInfo)
        };
    }

    /**
     * 更新角色信息
     */
    async updateCharacter(charInfo) {
        const charId = charInfo.entities.find(e => e.type === 'npc')?.id;
        if (!charId) return;

        if (!this.memoryData.archive[charId]) {
            this.memoryData.archive[charId] = {
                type: 'character',
                coreDrive: '',
                relationships: {},
                lifeHistory: []
            };
        }

        // 更新角色信息
        const char = this.memoryData.archive[charId];
        
        // 更新关系
        charInfo.relationships.forEach(rel => {
            char.relationships[rel.type] = rel.context;
        });

        // 添加人生履历
        char.lifeHistory.push({
            timestamp: charInfo.timestamp,
            content: charInfo.content,
            summary: this.generateEventSummary(charInfo)
        });
    }

    /**
     * 更新组织信息
     */
    async updateGroup(groupInfo) {
        const groupId = groupInfo.entities.find(e => e.type === 'group')?.id;
        if (!groupId) return;

        if (!this.memoryData.archive[groupId]) {
            this.memoryData.archive[groupId] = {
                type: 'group',
                composition: '',
                characteristics: '',
                ideology: '',
                socialStatus: '',
                developmentHistory: []
            };
        }

        // 更新组织信息
        const group = this.memoryData.archive[groupId];
        group.developmentHistory.push({
            timestamp: groupInfo.timestamp,
            content: groupInfo.content,
            summary: this.generateEventSummary(groupInfo)
        });
    }

    /**
     * 更新物品信息
     */
    async updateItem(itemInfo) {
        const itemId = itemInfo.entities.find(e => e.type === 'item')?.id;
        if (!itemId) return;

        if (!this.memoryData.archive[itemId]) {
            this.memoryData.archive[itemId] = {
                type: 'item',
                holder: '',
                eventSummary: '',
                significance: ''
            };
        }

        // 更新物品信息
        const item = this.memoryData.archive[itemId];
        item.eventSummary = itemInfo.content;
        item.significance = this.generateEventSummary(itemInfo);
    }

    /**
     * 生成事件摘要
     */
    generateEventSummary(info) {
        // 简单的摘要生成逻辑
        const entities = info.entities.map(e => e.name).join('、');
        const locations = info.locations.map(l => l.name).join('、');
        
        return `涉及${entities}${locations ? `，地点：${locations}` : ''}的事件`;
    }

    /**
     * 检查是否触发记忆压缩
     */
    async checkCompressionTrigger() {
        const eventCount = Object.values(this.memoryData.archive)
            .filter(item => item.type === 'event').length;
        
        if (eventCount >= this.compressionThreshold) {
            await this.performMemoryCompression();
        }
    }

    /**
     * 执行记忆压缩
     */
    async performMemoryCompression() {
        try {
            console.log(`[${this.name}] 开始执行记忆压缩`);
            
            // 收集所有事件
            const events = Object.entries(this.memoryData.archive)
                .filter(([key, value]) => value.type === 'event')
                .map(([key, value]) => ({ key, ...value }));

            if (events.length === 0) {
                console.log(`[${this.name}] 没有事件需要压缩`);
                return;
            }

            // 按时间排序
            events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            // 分析事件，确定章节边界
            const chapters = this.analyzeEventChapters(events);
            
            // 为每个章节创建ARC条目
            for (const chapter of chapters) {
                const arcId = `ARC_${Date.now()}_${chapter.name}`;
                const arcSummary = this.generateArcSummary(chapter.events);
                
                this.memoryData.archive[arcId] = {
                    type: 'arc',
                    timestamp: new Date().toISOString(),
                    summary: arcSummary,
                    events: chapter.events.map(e => e.key),
                    startTime: chapter.events[0].timestamp,
                    endTime: chapter.events[chapter.events.length - 1].timestamp,
                    name: chapter.name,
                    participants: chapter.participants,
                    locations: chapter.locations,
                    keyEvents: chapter.keyEvents
                };

                // 删除原始事件
                chapter.events.forEach(event => {
                    delete this.memoryData.archive[event.key];
                });

                console.log(`[${this.name}] 创建ARC章节: ${arcId} (${chapter.events.length}个事件)`);
            }

            await this.saveMemoryData();
            console.log(`[${this.name}] 记忆压缩完成，创建了${chapters.length}个ARC章节`);
            
            // 更新UI
            this.updateUI();
        } catch (error) {
            console.error(`[${this.name}] 记忆压缩失败:`, error);
        }
    }

    /**
     * 分析事件章节
     */
    analyzeEventChapters(events) {
        const chapters = [];
        let currentChapter = null;
        
        for (const event of events) {
            // 检查是否是新的章节开始
            if (this.isNewChapterStart(event, currentChapter)) {
                if (currentChapter) {
                    chapters.push(currentChapter);
                }
                currentChapter = {
                    name: this.generateChapterName(event),
                    events: [event],
                    participants: new Set(),
                    locations: new Set(),
                    keyEvents: []
                };
            } else if (currentChapter) {
                currentChapter.events.push(event);
            } else {
                // 如果没有当前章节，创建一个
                currentChapter = {
                    name: this.generateChapterName(event),
                    events: [event],
                    participants: new Set(),
                    locations: new Set(),
                    keyEvents: []
                };
            }
            
            // 更新章节信息
            if (currentChapter) {
                event.entities?.forEach(e => {
                    if (e.type === 'npc') currentChapter.participants.add(e.name);
                });
                event.locations?.forEach(l => currentChapter.locations.add(l.name));
                
                // 检查是否是关键事件
                if (this.isKeyEvent(event)) {
                    currentChapter.keyEvents.push(event);
                }
            }
        }
        
        // 添加最后一个章节
        if (currentChapter) {
            chapters.push(currentChapter);
        }
        
        return chapters;
    }

    /**
     * 判断是否是新章节开始
     */
    isNewChapterStart(event, currentChapter) {
        if (!currentChapter) return true;
        
        // 检查时间间隔（超过1小时可能是新章节）
        const lastEvent = currentChapter.events[currentChapter.events.length - 1];
        const timeDiff = new Date(event.timestamp) - new Date(lastEvent.timestamp);
        const oneHour = 60 * 60 * 1000;
        
        if (timeDiff > oneHour) return true;
        
        // 检查地点变化
        const currentLocations = new Set(event.locations?.map(l => l.name) || []);
        const lastLocations = new Set(lastEvent.locations?.map(l => l.name) || []);
        const locationChanged = currentLocations.size > 0 && lastLocations.size > 0 && 
                               !this.hasCommonElements(currentLocations, lastLocations);
        
        if (locationChanged) return true;
        
        // 检查参与者变化
        const currentParticipants = new Set(event.entities?.filter(e => e.type === 'npc').map(e => e.name) || []);
        const lastParticipants = new Set(lastEvent.entities?.filter(e => e.type === 'npc').map(e => e.name) || []);
        const participantChanged = currentParticipants.size > 0 && lastParticipants.size > 0 && 
                                  !this.hasCommonElements(currentParticipants, lastParticipants);
        
        if (participantChanged) return true;
        
        return false;
    }

    /**
     * 检查两个集合是否有共同元素
     */
    hasCommonElements(set1, set2) {
        for (const item of set1) {
            if (set2.has(item)) return true;
        }
        return false;
    }

    /**
     * 生成章节名称
     */
    generateChapterName(event) {
        const locations = event.locations?.map(l => l.name).join('、') || '未知地点';
        const participants = event.entities?.filter(e => e.type === 'npc').map(e => e.name).join('、') || '未知参与者';
        const date = new Date(event.timestamp).toLocaleDateString('zh-CN');
        
        return `${locations}的${participants}事件_${date}`;
    }

    /**
     * 判断是否是关键事件
     */
    isKeyEvent(event) {
        const keyKeywords = ['重要', '关键', '转折', '决定', '战斗', '死亡', '发现', '揭示', '结束', '开始'];
        const content = event.content.toLowerCase();
        
        return keyKeywords.some(keyword => content.includes(keyword)) || 
               event.relationships?.some(rel => rel.type === '敌人' || rel.type === '恋人');
    }

    /**
     * 生成ARC章节摘要
     */
    generateArcSummary(events) {
        const participants = Array.from(new Set(events.flatMap(e => 
            e.entities?.filter(entity => entity.type === 'npc').map(entity => entity.name) || []
        ))).join('、');
        
        const locations = Array.from(new Set(events.flatMap(e => 
            e.locations?.map(location => location.name) || []
        ))).join('、');
        
        const keyEvents = events.filter(e => this.isKeyEvent(e));
        const keyEventDescriptions = keyEvents.map(e => e.summary || e.content.substring(0, 50) + '...').join('; ');
        
        const startTime = new Date(events[0].timestamp).toLocaleDateString('zh-CN');
        const endTime = new Date(events[events.length - 1].timestamp).toLocaleDateString('zh-CN');
        
        let summary = `[${startTime} - ${endTime}] 包含${events.length}个事件的完整章节`;
        
        if (participants) {
            summary += `，涉及${participants}`;
        }
        
        if (locations) {
            summary += `，地点：${locations}`;
        }
        
        if (keyEventDescriptions) {
            summary += `。关键事件：${keyEventDescriptions}`;
        }
        
        return summary;
    }

    /**
     * 获取相关上下文
     */
    async getRelevantContext(query) {
        try {
            const relevantItems = [];
            
            // 搜索档案区
            Object.entries(this.memoryData.archive).forEach(([key, value]) => {
                if (this.isRelevant(value, query)) {
                    relevantItems.push({ key, ...value, source: 'archive' });
                }
            });

            // 搜索备用区
            Object.entries(this.memoryData.standby).forEach(([key, value]) => {
                if (this.isRelevant(value, query)) {
                    relevantItems.push({ key, ...value, source: 'standby' });
                }
            });

            return relevantItems;
        } catch (error) {
            console.error(`[${this.name}] 获取相关上下文失败:`, error);
            return [];
        }
    }

    /**
     * 判断项目是否相关
     */
    isRelevant(item, query) {
        const queryLower = query.toLowerCase();
        const content = (item.content || item.summary || '').toLowerCase();
        
        return content.includes(queryLower) || 
               item.entities?.some(e => e.name.toLowerCase().includes(queryLower)) ||
               item.locations?.some(l => l.name.toLowerCase().includes(queryLower));
    }

    /**
     * 注入上下文到提示中
     */
    async injectContext(query) {
        try {
            const relevantItems = await this.getRelevantContext(query);
            
            if (relevantItems.length === 0) return '';

            let contextText = '<DMSS>\n';
            
            // 添加档案区内容
            const archiveItems = relevantItems.filter(item => item.source === 'archive');
            if (archiveItems.length > 0) {
                contextText += '[档案区 | Permanent Archive]\n';
                archiveItems.forEach(item => {
                    contextText += this.formatMemoryItem(item);
                });
            }

            // 添加备用区内容
            const standbyItems = relevantItems.filter(item => item.source === 'standby');
            if (standbyItems.length > 0) {
                contextText += '\n[备用区 | Standby Roster]\n';
                standbyItems.forEach(item => {
                    contextText += this.formatMemoryItem(item);
                });
            }

            contextText += '</DMSS>\n';
            return contextText;
        } catch (error) {
            console.error(`[${this.name}] 注入上下文失败:`, error);
            return '';
        }
    }

    /**
     * 自动注入相关上下文到当前对话
     */
    async autoInjectContext() {
        try {
            if (!this.isEnabled) return;
            
            // 获取最近的用户消息
            const recentMessages = this.getRecentMessages(5);
            if (recentMessages.length === 0) return;
            
            // 分析最近消息的内容
            const query = recentMessages.map(msg => msg.content).join(' ');
            
            // 获取相关上下文
            const context = await this.injectContext(query);
            if (!context) return;
            
            // 使用SillyTavern的注入系统
            if (window.injectSystemPrompt) {
                window.injectSystemPrompt(context);
            } else if (window.addSystemPrompt) {
                window.addSystemPrompt(context);
            }
            
            console.log(`[${this.name}] 自动注入上下文完成`);
        } catch (error) {
            console.error(`[${this.name}] 自动注入上下文失败:`, error);
        }
    }

    /**
     * 获取最近的消息
     */
    getRecentMessages(count = 5) {
        try {
            // 尝试从SillyTavern的消息系统获取
            if (window.chat && window.chat.length) {
                return window.chat.slice(-count);
            }
            
            // 尝试从DOM获取
            const messageElements = document.querySelectorAll('.mes');
            const messages = Array.from(messageElements).slice(-count).map(el => {
                const content = el.querySelector('.mes_text')?.textContent || '';
                const role = el.classList.contains('mes_user') ? 'user' : 'assistant';
                return { content, role };
            });
            
            return messages;
        } catch (error) {
            console.error(`[${this.name}] 获取最近消息失败:`, error);
            return [];
        }
    }

    /**
     * 格式化记忆项目
     */
    formatMemoryItem(item) {
        switch (item.type) {
            case 'character':
                const charRelationships = Object.entries(item.relationships || {})
                    .map(([type, context]) => `${type}: ${context}`)
                    .join(', ');
                
                const lifeHistory = (item.lifeHistory || [])
                    .map(h => `- ${h.timestamp}: ${h.summary}`)
                    .join('\n');
                
                return `[${item.key}]: 
核心驱动: ${item.coreDrive || '未设定'} → ${item.coreDriveChange || '无变化'}
关系网: ${charRelationships || '无关系记录'} → ${item.relationshipChange || '无变化'}
人生履历:
${lifeHistory || '无履历记录'}\n\n`;
                
            case 'group':
                return `[${item.key}]: ${item.composition || '未知构成'} | ${item.characteristics || '未知特征'} | ${item.ideology || '未知理念'} | ${item.socialStatus || '未知地位'}\n\n`;
                
            case 'item':
                return `[${item.key}]: ${item.holder || '未知持有者'} | ${item.eventSummary || '无事件摘要'} | ${item.significance || '无意义说明'}\n\n`;
                
            case 'event':
                const eventTime = new Date(item.timestamp).toLocaleDateString('zh-CN');
                return `[${item.key}]@${eventTime}: ${item.summary || item.content.substring(0, 100)}...\n\n`;
                
            case 'arc':
                const arcStartTime = new Date(item.startTime).toLocaleDateString('zh-CN');
                const arcEndTime = new Date(item.endTime).toLocaleDateString('zh-CN');
                const participants = Array.from(item.participants || []).join('、');
                const locations = Array.from(item.locations || []).join('、');
                
                return `[${item.key}]@${arcStartTime}-${arcEndTime}: ${item.summary}
参与人物: ${participants || '无'}
地点: ${locations || '无'}
关键事件: ${(item.keyEvents || []).map(e => e.summary || e.content.substring(0, 50)).join('; ')}\n\n`;
                
            case 'parallel':
                return `[${item.key}]@${item.location || '未知地点'}: ${item.summary || item.content} | ${item.potentialImpact || '无潜在影响'} | ${item.activationCondition || '无激活条件'}\n\n`;
                
            case 'standby_character':
                return `[${item.key}]@${item.lastLocation || '未知位置'}: ${item.currentActivity || '无当前动向'} | ${item.activationCondition || '无激活条件'}\n\n`;
                
            case 'standby_group':
                return `[${item.key}]@${item.base || '未知据点'}: ${item.currentActivity || '无当前动向'} | ${item.activationCondition || '无激活条件'}\n\n`;
                
            case 'standby_item':
                return `[${item.key}]: 潜伏 | ${item.summary || item.content} | ${item.activationCondition || '无激活条件'}\n\n`;
                
            default:
                return `[${item.key}]: ${item.content || item.summary || '无内容'}\n\n`;
        }
    }

    /**
     * 创建用户界面
     */
    createUI() {
        // 创建主容器
        const container = document.createElement('div');
        container.id = 'dms-container';
        container.className = 'dms-container';
        container.innerHTML = `
            <div class="dms-header">
                <h3>动态记忆流系统</h3>
                <div class="dms-controls">
                    <button id="dms-toggle" class="dms-btn">启用</button>
                    <button id="dms-compress" class="dms-btn">压缩记忆</button>
                    <button id="dms-export" class="dms-btn">导出</button>
                    <button id="dms-import" class="dms-btn">导入</button>
                    <button id="dms-close" class="dms-btn">关闭</button>
                </div>
            </div>
            <div class="dms-content">
                <div class="dms-stats">
                    <div class="dms-stat">
                        <span class="dms-stat-label">档案区:</span>
                        <span class="dms-stat-value" id="dms-archive-count">0</span>
                    </div>
                    <div class="dms-stat">
                        <span class="dms-stat-label">备用区:</span>
                        <span class="dms-stat-value" id="dms-standby-count">0</span>
                    </div>
                    <div class="dms-stat">
                        <span class="dms-stat-label">状态:</span>
                        <span class="dms-status-indicator inactive" id="dms-status-indicator"></span>
                    </div>
                </div>
                <div class="dms-search">
                    <input type="text" id="dms-search-input" placeholder="搜索记忆内容..." class="dms-search-input">
                    <button id="dms-search-btn" class="dms-btn">搜索</button>
                </div>
                <div class="dms-memory-view" id="dms-memory-view">
                    <div class="dms-loading">加载中...</div>
                </div>
            </div>
        `;

        // 添加到页面
        const targetElement = document.querySelector('#extensionsMenu') || 
                             document.querySelector('#extensions_settings') || 
                             document.body;
        targetElement.appendChild(container);

        // 绑定事件
        this.bindUIEvents();
        
        // 初始更新UI
        this.updateUI();
    }

    /**
     * 绑定UI事件
     */
    bindUIEvents() {
        const toggleBtn = document.getElementById('dms-toggle');
        const compressBtn = document.getElementById('dms-compress');
        const exportBtn = document.getElementById('dms-export');
        const importBtn = document.getElementById('dms-import');
        const closeBtn = document.getElementById('dms-close');
        const searchBtn = document.getElementById('dms-search-btn');
        const searchInput = document.getElementById('dms-search-input');

        toggleBtn?.addEventListener('click', () => {
            this.toggleSystem();
        });

        compressBtn?.addEventListener('click', () => {
            this.performMemoryCompression();
        });

        exportBtn?.addEventListener('click', () => {
            this.exportMemoryData();
        });

        importBtn?.addEventListener('click', () => {
            this.importMemoryData();
        });

        closeBtn?.addEventListener('click', () => {
            this.hideUI();
        });

        searchBtn?.addEventListener('click', () => {
            this.searchMemory(searchInput?.value || '');
        });

        searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchMemory(searchInput.value);
            }
        });
    }

    /**
     * 切换系统状态
     */
    toggleSystem() {
        this.isEnabled = !this.isEnabled;
        const toggleBtn = document.getElementById('dms-toggle');
        const statusIndicator = document.getElementById('dms-status-indicator');
        
        if (toggleBtn) {
            toggleBtn.textContent = this.isEnabled ? '禁用' : '启用';
            toggleBtn.className = this.isEnabled ? 'dms-btn dms-btn-active' : 'dms-btn';
        }
        
        if (statusIndicator) {
            statusIndicator.className = this.isEnabled ? 'dms-status-indicator active' : 'dms-status-indicator inactive';
        }
        
        console.log(`[${this.name}] 系统${this.isEnabled ? '启用' : '禁用'}`);
    }

    /**
     * 搜索记忆
     */
    async searchMemory(query) {
        if (!query.trim()) {
            this.updateUI();
            return;
        }

        try {
            const relevantItems = await this.getRelevantContext(query);
            this.displaySearchResults(relevantItems, query);
        } catch (error) {
            console.error(`[${this.name}] 搜索记忆失败:`, error);
        }
    }

    /**
     * 显示搜索结果
     */
    displaySearchResults(results, query) {
        const memoryView = document.getElementById('dms-memory-view');
        if (!memoryView) return;

        if (results.length === 0) {
            memoryView.innerHTML = `<div class="dms-empty">未找到与"${query}"相关的记忆内容</div>`;
            return;
        }

        let html = `<div class="dms-search-results">
            <h4>搜索结果: "${query}" (${results.length}个结果)</h4>
            <div class="dms-items">`;
        
        results.forEach(item => {
            html += `<div class="dms-item dms-item-${item.type}">`;
            html += `<div class="dms-item-header">${item.key} (${item.source === 'archive' ? '档案区' : '备用区'})</div>`;
            html += `<div class="dms-item-content">${this.formatMemoryItem(item)}</div>`;
            html += '</div>';
        });
        
        html += '</div></div>';
        memoryView.innerHTML = html;
    }

    /**
     * 导出记忆数据
     */
    exportMemoryData() {
        const data = {
            archive: this.memoryData.archive,
            standby: this.memoryData.standby,
            timestamp: new Date().toISOString(),
            version: this.version
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `dms_memory_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    /**
     * 导入记忆数据
     */
    importMemoryData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    this.memoryData.archive = data.archive || {};
                    this.memoryData.standby = data.standby || {};
                    this.saveMemoryData();
                    this.updateUI();
                    console.log(`[${this.name}] 记忆数据导入成功`);
                } catch (error) {
                    console.error(`[${this.name}] 导入记忆数据失败:`, error);
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }

    /**
     * 显示UI
     */
    showUI() {
        const container = document.getElementById('dms-container');
        if (container) {
            container.classList.add('dms-visible');
            this.updateUI();
        }
    }

    /**
     * 隐藏UI
     */
    hideUI() {
        const container = document.getElementById('dms-container');
        if (container) {
            container.classList.remove('dms-visible');
        }
    }

    /**
     * 更新UI显示
     */
    updateUI() {
        const archiveCount = document.getElementById('dms-archive-count');
        const standbyCount = document.getElementById('dms-standby-count');
        const memoryView = document.getElementById('dms-memory-view');

        if (archiveCount) {
            archiveCount.textContent = Object.keys(this.memoryData.archive).length;
        }

        if (standbyCount) {
            standbyCount.textContent = Object.keys(this.memoryData.standby).length;
        }

        if (memoryView) {
            memoryView.innerHTML = this.generateMemoryViewHTML();
        }
    }

    /**
     * 生成记忆视图HTML
     */
    generateMemoryViewHTML() {
        let html = '<div class="dms-memory-sections">';
        
        // 档案区
        html += '<div class="dms-section">';
        html += '<h4>档案区</h4>';
        html += '<div class="dms-items">';
        
        Object.entries(this.memoryData.archive).forEach(([key, value]) => {
            html += `<div class="dms-item dms-item-${value.type}">`;
            html += `<div class="dms-item-header">${key}</div>`;
            html += `<div class="dms-item-content">${this.formatMemoryItem(value)}</div>`;
            html += '</div>';
        });
        
        html += '</div></div>';

        // 备用区
        html += '<div class="dms-section">';
        html += '<h4>备用区</h4>';
        html += '<div class="dms-items">';
        
        Object.entries(this.memoryData.standby).forEach(([key, value]) => {
            html += `<div class="dms-item dms-item-${value.type}">`;
            html += `<div class="dms-item-header">${key}</div>`;
            html += `<div class="dms-item-content">${this.formatMemoryItem(value)}</div>`;
            html += '</div>';
        });
        
        html += '</div></div>';
        html += '</div>';
        
        return html;
    }

    /**
     * 注册斜杠命令
     */
    registerSlashCommands() {
        // 等待SillyTavern的斜杠命令系统加载
        if (window.SlashCommandParser) {
            this.addSlashCommands();
        } else {
            // 如果还没加载，等待加载完成
            const checkSlashCommands = () => {
                if (window.SlashCommandParser) {
                    this.addSlashCommands();
                } else {
                    setTimeout(checkSlashCommands, 100);
                }
            };
            checkSlashCommands();
        }
    }

    /**
     * 添加斜杠命令
     */
    addSlashCommands() {
        try {
            // 启用/禁用DMSS
            window.SlashCommandParser.addCommand({
                name: 'dms-enable',
                description: '启用动态记忆流系统',
                handler: () => {
                    this.isEnabled = true;
                    this.toggleSystem();
                    return '动态记忆流系统已启用';
                }
            });

            // 禁用DMSS
            window.SlashCommandParser.addCommand({
                name: 'dms-disable',
                description: '禁用动态记忆流系统',
                handler: () => {
                    this.isEnabled = false;
                    this.toggleSystem();
                    return '动态记忆流系统已禁用';
                }
            });

            // 手动压缩记忆
            window.SlashCommandParser.addCommand({
                name: 'dms-compress',
                description: '手动执行记忆压缩',
                handler: async () => {
                    await this.performMemoryCompression();
                    return '记忆压缩完成';
                }
            });

            // 获取相关上下文
            window.SlashCommandParser.addCommand({
                name: 'dms-context',
                description: '获取相关上下文',
                handler: async (query) => {
                    const context = await this.injectContext(query);
                    return context || '未找到相关上下文';
                }
            });

            // 显示DMSS界面
            window.SlashCommandParser.addCommand({
                name: 'dms-show',
                description: '显示动态记忆流系统界面',
                handler: () => {
                    this.showUI();
                    return '动态记忆流系统界面已显示';
                }
            });

            // 隐藏DMSS界面
            window.SlashCommandParser.addCommand({
                name: 'dms-hide',
                description: '隐藏动态记忆流系统界面',
                handler: () => {
                    this.hideUI();
                    return '动态记忆流系统界面已隐藏';
                }
            });

            console.log(`[${this.name}] 斜杠命令注册完成`);
        } catch (error) {
            console.error(`[${this.name}] 注册斜杠命令失败:`, error);
        }
    }
}

// 初始化系统
let dmsSystem = null;

// 等待DOM加载完成
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        dmsSystem = new DynamicMemoryStreamSystem();
    });
} else {
    dmsSystem = new DynamicMemoryStreamSystem();
}

// 导出到全局作用域
window.DynamicMemoryStreamSystem = DynamicMemoryStreamSystem;
window.dmsSystem = dmsSystem;
