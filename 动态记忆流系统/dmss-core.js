/**
 * DMSS (Dynamic Memory Stream System) 核心系统
 * 动态记忆流系统 - 支持混合模式存储（Chat-based Chunks + 角色卡索引）
 * 
 * @author Janus
 * @version 1.0.0
 */

class DMSSCore {
    constructor() {
        this.isActive = false;
        this.currentCharacter = null;
        this.memoryChunks = new Map();
        this.characterIndex = new Map();
        this.archiveIndex = new Map();
        
        // 存储区域定义
        this.storageAreas = {
            ARCHIVE: 'archive',    // 档案区
            BACKUP: 'backup'       // 备用区
        };
        
        // 条目类型定义
        this.entryTypes = {
            CHARACTER: 'C',       // 角色
            GROUP: 'G',          // 组织
            ITEM: 'T',           // 物品
            PLOT: 'A',           // 伏笔/约定/线索
            PARALLEL: 'P'        // 并行事件
        };
        
        // 动作类型定义
        this.actionTypes = {
            CREATE: 'CREATE',
            APPEND: 'APPEND',
            MOVE: 'MOVE',
            COMPRESS: 'COMPRESS'
        };
        
        console.log('[DMSS Core] 系统初始化完成');
    }

    /**
     * 激活DMSS系统
     * @param {string} characterName - 角色名称
     */
    activate(characterName) {
        this.isActive = true;
        this.currentCharacter = characterName;
        console.log(`[DMSS Core] 系统已激活，当前角色: ${characterName}`);
        
        // 加载角色记忆数据
        this.loadCharacterMemory(characterName);
    }

    /**
     * 停用DMSS系统
     */
    deactivate() {
        this.isActive = false;
        this.currentCharacter = null;
        console.log('[DMSS Core] 系统已停用');
    }

    /**
     * 处理DMSS指令
     * @param {Array} instructions - DMSS指令数组
     * @returns {Object} 处理结果
     */
    processInstructions(instructions) {
        if (!this.isActive) {
            return { success: false, error: 'DMSS系统未激活' };
        }

        const results = [];
        
        for (const instruction of instructions) {
            try {
                const result = this.executeInstruction(instruction);
                results.push(result);
            } catch (error) {
                console.error('[DMSS Core] 指令执行失败:', error);
                results.push({ success: false, error: error.message });
            }
        }

        return { success: true, results };
    }

    /**
     * 执行单个DMSS指令
     * @param {Object} instruction - 指令对象
     * @returns {Object} 执行结果
     */
    executeInstruction(instruction) {
        const { action, target, payload } = instruction;

        switch (action) {
            case this.actionTypes.CREATE:
                return this.createEntry(target, payload);
            
            case this.actionTypes.APPEND:
                return this.appendToEntry(target, payload);
            
            case this.actionTypes.MOVE:
                return this.moveEntry(target, payload);
            
            case this.actionTypes.COMPRESS:
                return this.compressMemory(target, payload);
            
            default:
                throw new Error(`未知的动作类型: ${action}`);
        }
    }

    /**
     * 创建新条目
     * @param {string} target - 目标条目ID
     * @param {Object} payload - 初始内容
     * @returns {Object} 创建结果
     */
    createEntry(target, payload) {
        const entryId = this.generateEntryId(target);
        const entry = {
            id: entryId,
            type: this.getEntryType(target),
            area: this.getEntryArea(target),
            content: payload,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.memoryChunks.set(entryId, entry);
        
        // 更新角色索引
        if (entry.type === this.entryTypes.CHARACTER) {
            this.characterIndex.set(entryId, entry);
        }

        console.log(`[DMSS Core] 创建条目: ${entryId}`);
        return { success: true, entryId, entry };
    }

    /**
     * 向条目追加内容
     * @param {string} target - 目标字段路径
     * @param {Object} payload - 追加内容
     * @returns {Object} 追加结果
     */
    appendToEntry(target, payload) {
        const [entryId, ...fieldPath] = target.split('.');
        const entry = this.memoryChunks.get(entryId);
        
        if (!entry) {
            throw new Error(`条目不存在: ${entryId}`);
        }

        // 导航到目标字段
        let current = entry.content;
        for (let i = 0; i < fieldPath.length - 1; i++) {
            const field = fieldPath[i];
            if (!current[field]) {
                current[field] = {};
            }
            current = current[field];
        }

        const finalField = fieldPath[fieldPath.length - 1];
        if (!current[finalField]) {
            current[finalField] = '';
        }

        // 追加内容
        const timestamp = payload.timestamp || new Date().toLocaleDateString();
        const location = payload.location ? ` [${payload.location}]` : '';
        const newContent = `${current[finalField]}\n${timestamp}${location}: ${payload.content}`;
        current[finalField] = newContent.trim();

        entry.updatedAt = new Date().toISOString();
        this.memoryChunks.set(entryId, entry);

        console.log(`[DMSS Core] 追加内容到: ${target}`);
        return { success: true, entryId, field: finalField };
    }

    /**
     * 移动条目
     * @param {string} target - 目标条目ID
     * @param {Object} payload - 移动参数
     * @returns {Object} 移动结果
     */
    moveEntry(target, payload) {
        const entry = this.memoryChunks.get(target);
        if (!entry) {
            throw new Error(`条目不存在: ${target}`);
        }

        const { from, to, new_id } = payload;
        
        // 更新条目区域
        entry.area = to;
        if (new_id) {
            entry.id = new_id;
            this.memoryChunks.delete(target);
            this.memoryChunks.set(new_id, entry);
        }

        entry.updatedAt = new Date().toISOString();

        console.log(`[DMSS Core] 移动条目: ${target} -> ${to}`);
        return { success: true, entryId: entry.id, from, to };
    }

    /**
     * 压缩记忆
     * @param {string} target - 目标角色.人生履历
     * @param {Object} payload - 压缩参数
     * @returns {Object} 压缩结果
     */
    compressMemory(target, payload) {
        const [characterId, field] = target.split('.');
        const entry = this.memoryChunks.get(characterId);
        
        if (!entry) {
            throw new Error(`角色条目不存在: ${characterId}`);
        }

        const { arc_id, arc_summary, events_to_delete } = payload;
        
        // 创建新的章节总结
        if (!entry.content[field]) {
            entry.content[field] = {};
        }
        
        entry.content[field][arc_id] = arc_summary;
        
        // 删除指定的事件
        if (events_to_delete && Array.isArray(events_to_delete)) {
            events_to_delete.forEach(eventId => {
                delete entry.content[field][eventId];
            });
        }

        entry.updatedAt = new Date().toISOString();
        this.memoryChunks.set(characterId, entry);

        console.log(`[DMSS Core] 压缩记忆: ${characterId}.${field}`);
        return { success: true, characterId, arc_id, deletedEvents: events_to_delete };
    }

    /**
     * 生成条目ID
     * @param {string} target - 目标字符串
     * @returns {string} 生成的ID
     */
    generateEntryId(target) {
        if (target.startsWith('C_') || target.startsWith('G_') || 
            target.startsWith('T_') || target.startsWith('A_') || 
            target.startsWith('P_')) {
            return target;
        }
        
        // 自动生成ID
        const timestamp = Date.now().toString(36);
        return `C_${timestamp}`;
    }

    /**
     * 获取条目类型
     * @param {string} target - 目标字符串
     * @returns {string} 条目类型
     */
    getEntryType(target) {
        if (target.startsWith('C_')) return this.entryTypes.CHARACTER;
        if (target.startsWith('G_')) return this.entryTypes.GROUP;
        if (target.startsWith('T_')) return this.entryTypes.ITEM;
        if (target.startsWith('A_')) return this.entryTypes.PLOT;
        if (target.startsWith('P_')) return this.entryTypes.PARALLEL;
        return this.entryTypes.CHARACTER; // 默认
    }

    /**
     * 获取条目区域
     * @param {string} target - 目标字符串
     * @returns {string} 存储区域
     */
    getEntryArea(target) {
        // 根据ID前缀判断区域
        if (target.startsWith('C_') || target.startsWith('G_') || target.startsWith('T_')) {
            return this.storageAreas.ARCHIVE;
        }
        return this.storageAreas.BACKUP;
    }

    /**
     * 加载角色记忆数据
     * @param {string} characterName - 角色名称
     */
    loadCharacterMemory(characterName) {
        try {
            // 从localStorage加载角色记忆
            const storageKey = `dmss_${characterName}`;
            const storedData = localStorage.getItem(storageKey);
            
            if (storedData) {
                const data = JSON.parse(storedData);
                this.memoryChunks = new Map(data.memoryChunks || []);
                this.characterIndex = new Map(data.characterIndex || []);
                console.log(`[DMSS Core] 已加载角色记忆: ${characterName}`);
            }
        } catch (error) {
            console.error('[DMSS Core] 加载角色记忆失败:', error);
        }
    }

    /**
     * 保存角色记忆数据
     * @param {string} characterName - 角色名称
     */
    saveCharacterMemory(characterName) {
        try {
            const storageKey = `dmss_${characterName}`;
            const data = {
                memoryChunks: Array.from(this.memoryChunks.entries()),
                characterIndex: Array.from(this.characterIndex.entries()),
                lastSaved: new Date().toISOString()
            };
            
            localStorage.setItem(storageKey, JSON.stringify(data));
            console.log(`[DMSS Core] 已保存角色记忆: ${characterName}`);
        } catch (error) {
            console.error('[DMSS Core] 保存角色记忆失败:', error);
        }
    }

    /**
     * 获取角色记忆统计
     * @returns {Object} 统计信息
     */
    getMemoryStats() {
        const stats = {
            totalChunks: this.memoryChunks.size,
            characters: 0,
            groups: 0,
            items: 0,
            plots: 0,
            parallels: 0
        };

        for (const [id, entry] of this.memoryChunks) {
            switch (entry.type) {
                case this.entryTypes.CHARACTER:
                    stats.characters++;
                    break;
                case this.entryTypes.GROUP:
                    stats.groups++;
                    break;
                case this.entryTypes.ITEM:
                    stats.items++;
                    break;
                case this.entryTypes.PLOT:
                    stats.plots++;
                    break;
                case this.entryTypes.PARALLEL:
                    stats.parallels++;
                    break;
            }
        }

        return stats;
    }

    /**
     * 获取所有记忆条目
     * @returns {Array} 记忆条目数组
     */
    getAllEntries() {
        return Array.from(this.memoryChunks.values());
    }

    /**
     * 获取角色条目
     * @param {string} characterId - 角色ID
     * @returns {Object|null} 角色条目
     */
    getCharacterEntry(characterId) {
        return this.memoryChunks.get(characterId) || null;
    }

    /**
     * 清理过期记忆
     * @param {number} daysOld - 天数阈值
     */
    cleanupOldMemories(daysOld = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        
        let cleanedCount = 0;
        for (const [id, entry] of this.memoryChunks) {
            if (new Date(entry.updatedAt) < cutoffDate) {
                this.memoryChunks.delete(id);
                cleanedCount++;
            }
        }
        
        console.log(`[DMSS Core] 清理了 ${cleanedCount} 个过期记忆条目`);
        return cleanedCount;
    }
}

// 导出DMSS核心类
window.DMSSCore = DMSSCore;
