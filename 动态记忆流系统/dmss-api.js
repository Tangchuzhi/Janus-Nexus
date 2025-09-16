/**
 * DMSS (Dynamic Memory Stream System) API接口
 * 处理与SillyTavern的集成、聊天输出和Slash命令支持
 * 
 * @author Janus
 * @version 1.0.0
 */

class DMSSAPI {
    constructor() {
        this.core = null;
        this.isInitialized = false;
        this.chatOutputEnabled = true;
        this.autoSaveEnabled = true;
        this.saveInterval = 30000; // 30秒自动保存
        
        // 初始化核心系统
        this.init();
        
        console.log('[DMSS API] API接口初始化完成');
    }

    /**
     * 初始化DMSS系统
     */
    init() {
        try {
            // 创建核心系统实例
            this.core = new DMSSCore();
            this.isInitialized = true;
            
            // 设置自动保存
            this.setupAutoSave();
            
            // 注册Slash命令
            this.registerSlashCommands();
            
            console.log('[DMSS API] 系统初始化成功');
        } catch (error) {
            console.error('[DMSS API] 初始化失败:', error);
        }
    }

    /**
     * 处理AI响应中的DMSS指令
     * @param {string} response - AI响应文本
     * @returns {Object} 处理结果
     */
    processAIResponse(response) {
        if (!this.isInitialized || !this.core) {
            return { success: false, error: 'DMSS系统未初始化' };
        }

        try {
            // 提取DMSS指令
            const dmssMatch = response.match(/<DMSS>([\s\S]*?)<\/DMSS>/);
            if (!dmssMatch) {
                return { success: false, error: '未找到DMSS指令' };
            }

            const dmssContent = dmssMatch[1].trim();
            console.log('[DMSS API] 提取到DMSS指令:', dmssContent);

            // 解析JSON指令
            let instructions;
            try {
                instructions = JSON.parse(dmssContent);
            } catch (parseError) {
                console.error('[DMSS API] JSON解析失败:', parseError);
                return { success: false, error: 'DMSS指令格式错误' };
            }

            // 处理指令
            const result = this.core.processInstructions(instructions);
            
            // 自动保存
            if (this.autoSaveEnabled && this.core.currentCharacter) {
                this.core.saveCharacterMemory(this.core.currentCharacter);
            }

            // 输出到聊天区域
            if (this.chatOutputEnabled) {
                this.outputToChat(result, instructions);
            }

            return result;
        } catch (error) {
            console.error('[DMSS API] 处理AI响应失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 输出DMSS结果到聊天区域
     * @param {Object} result - 处理结果
     * @param {Array} instructions - 原始指令
     */
    outputToChat(result, instructions) {
        try {
            const chatContainer = document.querySelector('#chat');
            if (!chatContainer) {
                console.warn('[DMSS API] 未找到聊天容器');
                return;
            }

            // 创建DMSS输出消息
            const dmssMessage = this.createDMSSChatMessage(result, instructions);
            
            // 添加到聊天区域
            chatContainer.appendChild(dmssMessage);
            
            // 滚动到底部
            chatContainer.scrollTop = chatContainer.scrollHeight;
            
        } catch (error) {
            console.error('[DMSS API] 输出到聊天区域失败:', error);
        }
    }

    /**
     * 创建DMSS聊天消息
     * @param {Object} result - 处理结果
     * @param {Array} instructions - 原始指令
     * @returns {HTMLElement} 消息元素
     */
    createDMSSChatMessage(result, instructions) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'dmss-chat-message';
        messageDiv.style.cssText = `
            background: rgba(0, 123, 255, 0.1);
            border-left: 4px solid #007bff;
            padding: 10px;
            margin: 5px 0;
            border-radius: 4px;
            font-size: 12px;
        `;

        const header = document.createElement('div');
        header.innerHTML = `
            <strong style="color: #007bff;">
                <i class="fa-solid fa-brain"></i> DMSS 记忆更新
            </strong>
            <span style="float: right; opacity: 0.7;">
                ${new Date().toLocaleTimeString()}
            </span>
        `;

        const content = document.createElement('div');
        content.style.marginTop = '8px';

        if (result.success) {
            content.innerHTML = this.formatSuccessResult(result, instructions);
        } else {
            content.innerHTML = `
                <div style="color: #dc3545;">
                    <i class="fa-solid fa-exclamation-triangle"></i> 
                    处理失败: ${result.error}
                </div>
            `;
        }

        messageDiv.appendChild(header);
        messageDiv.appendChild(content);

        return messageDiv;
    }

    /**
     * 格式化成功结果
     * @param {Object} result - 处理结果
     * @param {Array} instructions - 原始指令
     * @returns {string} 格式化的HTML
     */
    formatSuccessResult(result, instructions) {
        let html = '<div style="color: #28a745;">';
        
        if (result.results && result.results.length > 0) {
            result.results.forEach((res, index) => {
                const instruction = instructions[index];
                if (res.success) {
                    html += this.formatInstructionResult(instruction, res);
                } else {
                    html += `
                        <div style="color: #dc3545; margin: 4px 0;">
                            <i class="fa-solid fa-times"></i> 
                            ${instruction.action}: ${res.error}
                        </div>
                    `;
                }
            });
        }

        html += '</div>';
        return html;
    }

    /**
     * 格式化单个指令结果
     * @param {Object} instruction - 指令
     * @param {Object} result - 结果
     * @returns {string} 格式化的HTML
     */
    formatInstructionResult(instruction, result) {
        const actionIcons = {
            'CREATE': 'fa-plus',
            'APPEND': 'fa-plus-circle',
            'MOVE': 'fa-arrows-alt',
            'COMPRESS': 'fa-compress'
        };

        const icon = actionIcons[instruction.action] || 'fa-cog';
        
        let html = `
            <div style="margin: 4px 0; padding: 4px; background: rgba(40, 167, 69, 0.1); border-radius: 3px;">
                <i class="fa-solid ${icon}"></i> 
                <strong>${instruction.action}</strong>: ${instruction.target}
        `;

        if (result.entryId) {
            html += `<br><small>条目ID: ${result.entryId}</small>`;
        }

        if (result.field) {
            html += `<br><small>字段: ${result.field}</small>`;
        }

        html += '</div>';
        return html;
    }

    /**
     * 激活DMSS系统
     * @param {string} characterName - 角色名称
     */
    activate(characterName) {
        if (!this.isInitialized || !this.core) {
            console.error('[DMSS API] 系统未初始化');
            return false;
        }

        this.core.activate(characterName);
        this.updateUIStatus();
        return true;
    }

    /**
     * 停用DMSS系统
     */
    deactivate() {
        if (!this.isInitialized || !this.core) {
            return false;
        }

        this.core.deactivate();
        this.updateUIStatus();
        return true;
    }

    /**
     * 更新UI状态显示
     */
    updateUIStatus() {
        try {
            const statusElement = document.getElementById('dmss-system-status');
            const charElement = document.getElementById('dmss-current-char');
            const chunksElement = document.getElementById('dmss-memory-chunks');

            if (statusElement) {
                if (this.core && this.core.isActive) {
                    statusElement.textContent = '已激活';
                    statusElement.className = 'status-active';
                } else {
                    statusElement.textContent = '未激活';
                    statusElement.className = 'status-inactive';
                }
            }

            if (charElement) {
                const currentCharName = this.getCurrentCharacterName();
                charElement.textContent = currentCharName !== '未知角色' ? currentCharName : '无';
            }

            if (chunksElement && this.core) {
                const stats = this.core.getMemoryStats();
                chunksElement.textContent = stats.totalChunks;
            }
        } catch (error) {
            console.error('[DMSS API] 更新UI状态失败:', error);
        }
    }

    /**
     * 注册Slash命令
     */
    registerSlashCommands() {
        // 注册DMSS相关的Slash命令
        if (window.slashCommands) {
            // DMSS激活命令
            window.slashCommands['dmss-activate'] = {
                description: '激活DMSS系统',
                handler: (args) => {
                    const charName = args[0] || this.getCurrentCharacterName();
                    const result = this.activate(charName);
                    return result ? 'DMSS系统已激活' : 'DMSS系统激活失败';
                }
            };

            // DMSS停用命令
            window.slashCommands['dmss-deactivate'] = {
                description: '停用DMSS系统',
                handler: () => {
                    const result = this.deactivate();
                    return result ? 'DMSS系统已停用' : 'DMSS系统停用失败';
                }
            };

            // DMSS状态命令
            window.slashCommands['dmss-status'] = {
                description: '查看DMSS状态',
                handler: () => {
                    const status = this.getStatus();
                    return JSON.stringify(status, null, 2);
                }
            };

            // DMSS清理命令
            window.slashCommands['dmss-cleanup'] = {
                description: '清理过期记忆',
                handler: (args) => {
                    const days = parseInt(args[0]) || 30;
                    const cleanedCount = this.cleanupOldMemories(days);
                    return `已清理 ${cleanedCount} 个过期记忆条目`;
                }
            };

            console.log('[DMSS API] Slash命令注册完成');
        }
    }

    /**
     * 获取当前角色名称
     * @returns {string} 角色名称
     */
    getCurrentCharacterName() {
        try {
            // 从角色选择按钮获取角色名称
            const charButton = document.querySelector("#rm_button_selected_ch > h2");
            if (charButton && charButton.textContent) {
                const charName = charButton.textContent.trim();
                if (charName && charName !== '') {
                    return charName;
                }
            }
            
            return '未知角色';
        } catch (error) {
            console.error('[DMSS API] 获取角色名称失败:', error);
            return '未知角色';
        }
    }

    /**
     * 获取DMSS状态
     * @returns {Object} 状态信息
     */
    getStatus() {
        if (!this.core) {
            return { active: false, error: '系统未初始化' };
        }

        const stats = this.core.getMemoryStats();
        return {
            active: this.core.isActive,
            currentCharacter: this.core.currentCharacter,
            stats: stats,
            lastSaved: this.getLastSavedTime()
        };
    }

    /**
     * 获取最后保存时间
     * @returns {string} 保存时间
     */
    getLastSavedTime() {
        if (!this.core || !this.core.currentCharacter) {
            return '未知';
        }

        try {
            const storageKey = `dmss_${this.core.currentCharacter}`;
            const storedData = localStorage.getItem(storageKey);
            if (storedData) {
                const data = JSON.parse(storedData);
                return data.lastSaved || '未知';
            }
        } catch (error) {
            console.error('[DMSS API] 获取保存时间失败:', error);
        }
        
        return '未知';
    }

    /**
     * 清理过期记忆
     * @param {number} daysOld - 天数阈值
     * @returns {number} 清理数量
     */
    cleanupOldMemories(daysOld = 30) {
        if (!this.core) {
            return 0;
        }

        const cleanedCount = this.core.cleanupOldMemories(daysOld);
        
        // 保存更改
        if (this.core.currentCharacter) {
            this.core.saveCharacterMemory(this.core.currentCharacter);
        }

        this.updateUIStatus();
        return cleanedCount;
    }

    /**
     * 设置自动保存
     */
    setupAutoSave() {
        if (this.saveIntervalId) {
            clearInterval(this.saveIntervalId);
        }

        this.saveIntervalId = setInterval(() => {
            if (this.autoSaveEnabled && this.core && this.core.isActive && this.core.currentCharacter) {
                this.core.saveCharacterMemory(this.core.currentCharacter);
            }
        }, this.saveInterval);
    }

    /**
     * 手动保存
     */
    save() {
        if (!this.core || !this.core.currentCharacter) {
            return false;
        }

        this.core.saveCharacterMemory(this.core.currentCharacter);
        return true;
    }

    /**
     * 导出角色记忆
     * @param {string} characterName - 角色名称
     * @returns {Object} 导出的数据
     */
    exportCharacterMemory(characterName) {
        if (!this.core) {
            return null;
        }

        const allEntries = this.core.getAllEntries();
        const characterEntries = allEntries.filter(entry => 
            entry.type === this.core.entryTypes.CHARACTER
        );

        return {
            character: characterName,
            entries: characterEntries,
            exportedAt: new Date().toISOString(),
            version: '1.0.0'
        };
    }

    /**
     * 销毁DMSS系统
     */
    destroy() {
        if (this.saveIntervalId) {
            clearInterval(this.saveIntervalId);
        }

        if (this.core) {
            this.core.deactivate();
        }

        this.isInitialized = false;
        console.log('[DMSS API] 系统已销毁');
    }
}

// 创建全局DMSS API实例
window.dmssAPI = new DMSSAPI();

// 导出API类
window.DMSSAPI = DMSSAPI;