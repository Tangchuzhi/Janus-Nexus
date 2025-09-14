/**
 * DMSS (Dynamic Memory Stream System) 核心模块
 * 动态记忆流系统 - 基于正则表达式捕获和SillyTavern存储系统
 */

class DMSSCore {
    constructor() {
        this.isEnabled = false;
        this.currentChatId = null;
        this.memoryCache = new Map();
        this.regexPattern = /<DMSS>([\s\S]*?)<\/DMSS>/g;
        this.storagePrefix = 'DMSS_';
        this.debugMode = false;
        
        // 初始化
        this.init();
    }

    /**
     * 初始化DMSS核心
     */
    init() {
        console.log('[DMSS Core] 初始化动态记忆流系统');
        this.setupEventListeners();
        this.loadSettings();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 监听聊天切换
        if (typeof this_chid !== 'undefined') {
            this.currentChatId = this_chid;
        }

        // 监听消息发送
        document.addEventListener('DOMContentLoaded', () => {
            this.observeMessageChanges();
        });
    }

    /**
     * 观察消息变化
     */
    observeMessageChanges() {
        const messageObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.scanForDMSSContent(node);
                        }
                    });
                }
            });
        });

        // 观察聊天消息容器
        const chatContainer = document.querySelector('#chat') || document.querySelector('.chat-container');
        if (chatContainer) {
            messageObserver.observe(chatContainer, {
                childList: true,
                subtree: true
            });
        }
    }

    /**
     * 扫描DMSS内容
     */
    scanForDMSSContent(element) {
        if (!this.isEnabled) return;

        const textContent = element.textContent || element.innerText || '';
        const dmssMatches = this.extractDMSSContent(textContent);

        if (dmssMatches.length > 0) {
            console.log('[DMSS Core] 发现DMSS内容:', dmssMatches.length, '个匹配');
            this.processDMSSContent(dmssMatches);
        }
    }

    /**
     * 提取DMSS内容
     */
    extractDMSSContent(text) {
        const matches = [];
        let match;
        
        // 重置正则表达式
        this.regexPattern.lastIndex = 0;
        
        while ((match = this.regexPattern.exec(text)) !== null) {
            matches.push({
                fullMatch: match[0],
                content: match[1].trim(),
                startIndex: match.index,
                endIndex: match.index + match[0].length,
                timestamp: Date.now()
            });
        }
        
        return matches;
    }

    /**
     * 处理DMSS内容
     */
    async processDMSSContent(matches) {
        try {
            for (const match of matches) {
                await this.storeDMSSContent(match);
            }
            
            // 触发更新事件
            this.triggerUpdateEvent();
            
        } catch (error) {
            console.error('[DMSS Core] 处理DMSS内容失败:', error);
        }
    }

    /**
     * 存储DMSS内容
     */
    async storeDMSSContent(match) {
        const chatId = this.getCurrentChatId();
        if (!chatId) {
            console.warn('[DMSS Core] 无法获取当前聊天ID');
            return;
        }

        const storageKey = `${this.storagePrefix}${chatId}`;
        
        try {
            // 获取现有内容
            const existingContent = await this.getStoredContent(storageKey);
            
            // 合并内容
            const mergedContent = this.mergeDMSSContent(existingContent, match.content);
            
            // 存储到SillyTavern的Data Bank
            await this.storeToDataBank(chatId, mergedContent);
            
            // 更新缓存
            this.memoryCache.set(storageKey, mergedContent);
            
            console.log('[DMSS Core] DMSS内容已存储');
            
        } catch (error) {
            console.error('[DMSS Core] 存储DMSS内容失败:', error);
        }
    }

    /**
     * 合并DMSS内容
     */
    mergeDMSSContent(existing, newContent) {
        if (!existing) {
            return newContent;
        }

        // 解析现有内容
        const existingSections = this.parseDMSSSections(existing);
        const newSections = this.parseDMSSSections(newContent);

        // 合并逻辑
        return this.mergeSections(existingSections, newSections);
    }

    /**
     * 解析DMSS段落
     */
    parseDMSSSections(content) {
        const sections = {
            archive: [],
            standby: [],
            metadata: {
                lastUpdated: Date.now(),
                version: 1
            }
        };

        const lines = content.split('\n');
        let currentSection = null;

        for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (trimmedLine.includes('[档案区') || trimmedLine.includes('Permanent Archive')) {
                currentSection = 'archive';
                continue;
            } else if (trimmedLine.includes('[备用区') || trimmedLine.includes('Standby Roster')) {
                currentSection = 'standby';
                continue;
            }

            if (currentSection && trimmedLine) {
                sections[currentSection].push(trimmedLine);
            }
        }

        return sections;
    }

    /**
     * 合并段落
     */
    mergeSections(existingSections, newSections) {
        // 简单的合并策略：新内容追加到现有内容
        const merged = {
            archive: [...existingSections.archive, ...newSections.archive],
            standby: [...existingSections.standby, ...newSections.standby],
            metadata: {
                lastUpdated: Date.now(),
                version: existingSections.metadata.version + 1
            }
        };

        // 重新格式化内容
        return this.formatDMSSContent(merged);
    }

    /**
     * 格式化DMSS内容
     */
    formatDMSSContent(sections) {
        let content = '<DMSS>\n';
        
        if (sections.archive.length > 0) {
            content += '[档案区 | Permanent Archive]\n';
            sections.archive.forEach(item => {
                content += `${item}\n`;
            });
            content += '\n';
        }

        if (sections.standby.length > 0) {
            content += '[备用区 | Standby Roster]\n';
            sections.standby.forEach(item => {
                content += `${item}\n`;
            });
        }

        content += '</DMSS>';
        return content;
    }

    /**
     * 存储到Data Bank
     */
    async storeToDataBank(chatId, content) {
        try {
            // 使用SillyTavern的slash命令存储
            if (typeof window !== 'undefined' && window.stScript) {
                // 使用stScript的API
                await window.stScript.runCommand(`/db-update source=chat name=DMSS_${chatId} "${content}"`);
            } else {
                // 备用方案：使用全局变量
                if (typeof setGlobalVar !== 'undefined') {
                    setGlobalVar(`DMSS_${chatId}`, content);
                }
            }
        } catch (error) {
            console.error('[DMSS Core] 存储到Data Bank失败:', error);
            throw error;
        }
    }

    /**
     * 从存储获取内容
     */
    async getStoredContent(storageKey) {
        try {
            // 先从缓存获取
            if (this.memoryCache.has(storageKey)) {
                return this.memoryCache.get(storageKey);
            }

            // 从Data Bank获取
            if (typeof window !== 'undefined' && window.stScript) {
                const result = await window.stScript.runCommand(`/db-get source=chat name=${storageKey}`);
                if (result && result.trim()) {
                    this.memoryCache.set(storageKey, result);
                    return result;
                }
            }

            // 备用方案：从全局变量获取
            if (typeof getGlobalVar !== 'undefined') {
                const result = getGlobalVar(storageKey);
                if (result) {
                    this.memoryCache.set(storageKey, result);
                    return result;
                }
            }

            return null;
        } catch (error) {
            console.error('[DMSS Core] 获取存储内容失败:', error);
            return null;
        }
    }

    /**
     * 获取当前聊天ID
     */
    getCurrentChatId() {
        if (typeof this_chid !== 'undefined') {
            return this_chid;
        }
        
        // 备用方案：从URL获取
        const urlMatch = window.location.pathname.match(/\/chat\/([^\/]+)/);
        return urlMatch ? urlMatch[1] : null;
    }

    /**
     * 启动DMSS
     */
    start() {
        this.isEnabled = true;
        this.currentChatId = this.getCurrentChatId();
        console.log('[DMSS Core] DMSS已启动，当前聊天:', this.currentChatId);
        this.triggerUpdateEvent();
    }

    /**
     * 停止DMSS
     */
    stop() {
        this.isEnabled = false;
        console.log('[DMSS Core] DMSS已停止');
        this.triggerUpdateEvent();
    }

    /**
     * 重置DMSS
     */
    async reset() {
        const chatId = this.getCurrentChatId();
        if (chatId) {
            const storageKey = `${this.storagePrefix}${chatId}`;
            
            // 清除Data Bank
            try {
                if (typeof window !== 'undefined' && window.stScript) {
                    await window.stScript.runCommand(`/db-delete source=chat name=${storageKey}`);
                }
            } catch (error) {
                console.error('[DMSS Core] 清除Data Bank失败:', error);
            }

            // 清除缓存
            this.memoryCache.delete(storageKey);
        }

        console.log('[DMSS Core] DMSS已重置');
        this.triggerUpdateEvent();
    }

    /**
     * 获取当前记忆内容
     */
    async getCurrentMemory() {
        const chatId = this.getCurrentChatId();
        if (!chatId) return '';

        const storageKey = `${this.storagePrefix}${chatId}`;
        return await this.getStoredContent(storageKey) || '';
    }

    /**
     * 获取记忆统计信息
     */
    async getMemoryStats() {
        const content = await this.getCurrentMemory();
        if (!content) {
            return {
                totalLines: 0,
                archiveCount: 0,
                standbyCount: 0,
                lastUpdated: null
            };
        }

        const sections = this.parseDMSSSections(content);
        return {
            totalLines: content.split('\n').length,
            archiveCount: sections.archive.length,
            standbyCount: sections.standby.length,
            lastUpdated: new Date(sections.metadata.lastUpdated)
        };
    }

    /**
     * 触发更新事件
     */
    triggerUpdateEvent() {
        const event = new CustomEvent('dmssUpdate', {
            detail: {
                enabled: this.isEnabled,
                chatId: this.currentChatId,
                timestamp: Date.now()
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * 加载设置
     */
    loadSettings() {
        try {
            const settings = localStorage.getItem('dmss_settings');
            if (settings) {
                const parsed = JSON.parse(settings);
                this.debugMode = parsed.debugMode || false;
            }
        } catch (error) {
            console.error('[DMSS Core] 加载设置失败:', error);
        }
    }

    /**
     * 保存设置
     */
    saveSettings() {
        try {
            const settings = {
                debugMode: this.debugMode
            };
            localStorage.setItem('dmss_settings', JSON.stringify(settings));
        } catch (error) {
            console.error('[DMSS Core] 保存设置失败:', error);
        }
    }

    /**
     * 设置调试模式
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        this.saveSettings();
        console.log('[DMSS Core] 调试模式:', enabled ? '开启' : '关闭');
    }

    /**
     * 手动处理文本内容
     */
    async processText(text) {
        if (!this.isEnabled) return;

        const matches = this.extractDMSSContent(text);
        if (matches.length > 0) {
            await this.processDMSSContent(matches);
            return matches;
        }
        
        return [];
    }
}

// 导出到全局
if (typeof window !== 'undefined') {
    window.DMSSCore = DMSSCore;
}

console.log('[DMSS Core] 动态记忆流系统核心模块已加载');
