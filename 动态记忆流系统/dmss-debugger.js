/**
 * DMSS调试器模块
 * 动态记忆流系统调试工具
 */

class DMSSDebugger {
    constructor() {
        this.isEnabled = false;
        this.logs = [];
        this.maxLogs = 1000;
        this.debugLevel = 'info'; // debug, info, warn, error
        
        this.init();
    }

    /**
     * 初始化调试器
     */
    init() {
        console.log('[DMSS Debugger] 初始化调试器');
        this.setupConsoleOverride();
    }

    /**
     * 设置控制台重写
     */
    setupConsoleOverride() {
        if (!this.isEnabled) return;

        // 保存原始console方法
        this.originalConsole = {
            log: console.log,
            warn: console.warn,
            error: console.error,
            info: console.info
        };

        // 重写console方法
        console.log = (...args) => {
            this.log('debug', ...args);
            this.originalConsole.log(...args);
        };

        console.warn = (...args) => {
            this.log('warn', ...args);
            this.originalConsole.warn(...args);
        };

        console.error = (...args) => {
            this.log('error', ...args);
            this.originalConsole.error(...args);
        };

        console.info = (...args) => {
            this.log('info', ...args);
            this.originalConsole.info(...args);
        };
    }

    /**
     * 恢复原始控制台
     */
    restoreConsole() {
        if (!this.originalConsole) return;

        console.log = this.originalConsole.log;
        console.warn = this.originalConsole.warn;
        console.error = this.originalConsole.error;
        console.info = this.originalConsole.info;
    }

    /**
     * 记录日志
     */
    log(level, ...args) {
        if (!this.isEnabled) return;

        const timestamp = new Date().toISOString();
        const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');

        const logEntry = {
            timestamp,
            level,
            message,
            stack: level === 'error' ? new Error().stack : null
        };

        this.logs.push(logEntry);

        // 限制日志数量
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // 触发日志更新事件
        this.triggerLogUpdate();
    }

    /**
     * 启用调试器
     */
    enable() {
        this.isEnabled = true;
        this.setupConsoleOverride();
        console.log('[DMSS Debugger] 调试器已启用');
    }

    /**
     * 禁用调试器
     */
    disable() {
        this.isEnabled = false;
        this.restoreConsole();
        console.log('[DMSS Debugger] 调试器已禁用');
    }

    /**
     * 清空日志
     */
    clearLogs() {
        this.logs = [];
        this.triggerLogUpdate();
        console.log('[DMSS Debugger] 日志已清空');
    }

    /**
     * 获取日志
     */
    getLogs(level = null, limit = null) {
        let filteredLogs = this.logs;

        if (level) {
            filteredLogs = filteredLogs.filter(log => log.level === level);
        }

        if (limit) {
            filteredLogs = filteredLogs.slice(-limit);
        }

        return filteredLogs;
    }

    /**
     * 导出日志
     */
    exportLogs(format = 'json') {
        const logs = this.getLogs();
        
        if (format === 'json') {
            const data = JSON.stringify(logs, null, 2);
            this.downloadFile(data, 'dmss-debug-logs.json', 'application/json');
        } else if (format === 'txt') {
            const data = logs.map(log => 
                `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`
            ).join('\n');
            this.downloadFile(data, 'dmss-debug-logs.txt', 'text/plain');
        }
    }

    /**
     * 下载文件
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    /**
     * 显示调试面板
     */
    showDebugPanel() {
        const modalId = 'dmss-debug-modal';
        this.closeModal(modalId);

        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'dmss-modal';
        modal.innerHTML = `
            <div class="dmss-modal-content debug-modal">
                <div class="dmss-modal-header">
                    <h3><i class="fa-solid fa-bug"></i> DMSS调试面板</h3>
                    <button class="dmss-modal-close" onclick="window.dmssDebugger.closeModal('${modalId}')">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </div>
                
                <div class="dmss-modal-body">
                    <div class="debug-controls">
                        <div class="debug-control-group">
                            <label>调试级别:</label>
                            <select id="debug-level-select" onchange="window.dmssDebugger.setDebugLevel(this.value)">
                                <option value="debug">Debug</option>
                                <option value="info" selected>Info</option>
                                <option value="warn">Warn</option>
                                <option value="error">Error</option>
                            </select>
                        </div>
                        
                        <div class="debug-control-group">
                            <button onclick="window.dmssDebugger.clearLogs()" class="dmss-btn warning">
                                <i class="fa-solid fa-trash"></i> 清空日志
                            </button>
                            <button onclick="window.dmssDebugger.exportLogs('json')" class="dmss-btn secondary">
                                <i class="fa-solid fa-download"></i> 导出JSON
                            </button>
                            <button onclick="window.dmssDebugger.exportLogs('txt')" class="dmss-btn secondary">
                                <i class="fa-solid fa-download"></i> 导出TXT
                            </button>
                        </div>
                        
                        <div class="debug-control-group">
                            <button onclick="window.dmssDebugger.scanChat()" class="dmss-btn primary">
                                <i class="fa-solid fa-search"></i> 扫描最新消息
                            </button>
                            <button onclick="window.dmssDebugger.forceScanChat()" class="dmss-btn primary">
                                <i class="fa-solid fa-search-plus"></i> 强制扫描聊天
                            </button>
                            <button onclick="window.dmssDebugger.testDMSS()" class="dmss-btn test-btn">
                                <i class="fa-solid fa-vial"></i> 测试功能
                            </button>
                        </div>
                    </div>
                    
                    <div class="debug-logs-container">
                        <div class="debug-logs-header">
                            <span>调试日志 (${this.logs.length} 条)</span>
                            <button onclick="window.dmssDebugger.refreshLogs()" class="dmss-btn small">
                                <i class="fa-solid fa-refresh"></i> 刷新
                            </button>
                        </div>
                        <div id="debug-logs-content" class="debug-logs-content">
                            ${this.renderLogs()}
                        </div>
                    </div>
                </div>
                
                <div class="dmss-modal-footer">
                    <button onclick="window.dmssDebugger.closeModal('${modalId}')" class="dmss-btn">
                        <i class="fa-solid fa-times"></i> 关闭
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.addDebugStyles();
    }

    /**
     * 渲染日志
     */
    renderLogs() {
        if (this.logs.length === 0) {
            return '<div class="no-logs">暂无调试日志</div>';
        }

        return this.logs.slice(-50).map(log => `
            <div class="debug-log-entry level-${log.level}">
                <div class="log-timestamp">${new Date(log.timestamp).toLocaleTimeString()}</div>
                <div class="log-level">${log.level.toUpperCase()}</div>
                <div class="log-message">${this.escapeHtml(log.message)}</div>
                ${log.stack ? `<div class="log-stack">${this.escapeHtml(log.stack)}</div>` : ''}
            </div>
        `).join('');
    }

    /**
     * HTML转义
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 刷新日志显示
     */
    refreshLogs() {
        const content = document.getElementById('debug-logs-content');
        if (content) {
            content.innerHTML = this.renderLogs();
            content.scrollTop = content.scrollHeight;
        }
    }

    /**
     * 设置调试级别
     */
    setDebugLevel(level) {
        this.debugLevel = level;
        console.log(`[DMSS Debugger] 调试级别设置为: ${level}`);
    }

    /**
     * 关闭模态框
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
        }
    }

    /**
     * 触发日志更新事件
     */
    triggerLogUpdate() {
        const event = new CustomEvent('dmssDebugLogUpdate', {
            detail: {
                logs: this.logs,
                count: this.logs.length
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * 添加调试样式
     */
    addDebugStyles() {
        if (document.getElementById('dmss-debug-styles')) return;

        const style = document.createElement('style');
        style.id = 'dmss-debug-styles';
        style.textContent = `
            .debug-modal .dmss-modal-content {
                width: 1000px;
                height: 600px;
            }

            .debug-controls {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                padding: 10px;
                background: var(--SmartThemeChatTintColor, rgba(0, 0, 0, 0.05));
                border-radius: 6px;
            }

            .debug-control-group {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .debug-control-group label {
                font-size: 12px;
                color: var(--SmartThemeTextColor, #666);
            }

            .debug-control-group select {
                padding: 4px 8px;
                border: 1px solid var(--SmartThemeBorderColor, #ddd);
                border-radius: 4px;
                background: var(--SmartThemeBodyColor, #fff);
                color: var(--SmartThemeTextColor, #333);
                font-size: 12px;
            }

            .debug-logs-container {
                flex: 1;
                display: flex;
                flex-direction: column;
                border: 1px solid var(--SmartThemeBorderColor, #ddd);
                border-radius: 6px;
                overflow: hidden;
            }

            .debug-logs-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 15px;
                background: var(--SmartThemeChatTintColor, rgba(0, 0, 0, 0.1));
                border-bottom: 1px solid var(--SmartThemeBorderColor, #ddd);
                font-size: 12px;
                font-weight: bold;
                color: var(--SmartThemeTextColor, #333);
            }

            .debug-logs-content {
                flex: 1;
                overflow-y: auto;
                padding: 10px;
                background: var(--SmartThemeBodyColor, #fff);
                font-family: 'Courier New', monospace;
                font-size: 11px;
                line-height: 1.4;
            }

            .debug-log-entry {
                margin-bottom: 8px;
                padding: 8px;
                border-radius: 4px;
                border-left: 4px solid;
                background: var(--SmartThemeChatTintColor, rgba(0, 0, 0, 0.02));
            }

            .debug-log-entry.level-debug {
                border-left-color: #6c757d;
            }

            .debug-log-entry.level-info {
                border-left-color: #17a2b8;
            }

            .debug-log-entry.level-warn {
                border-left-color: #ffc107;
            }

            .debug-log-entry.level-error {
                border-left-color: #dc3545;
                background: rgba(220, 53, 69, 0.05);
            }

            .log-timestamp {
                font-size: 10px;
                color: var(--SmartThemeTextColor, #666);
                opacity: 0.7;
            }

            .log-level {
                font-weight: bold;
                font-size: 10px;
                margin: 2px 0;
            }

            .log-message {
                color: var(--SmartThemeTextColor, #333);
                word-break: break-all;
            }

            .log-stack {
                margin-top: 5px;
                padding: 5px;
                background: rgba(0, 0, 0, 0.05);
                border-radius: 3px;
                font-size: 10px;
                color: var(--SmartThemeTextColor, #666);
                white-space: pre-wrap;
            }

            .no-logs {
                text-align: center;
                color: var(--SmartThemeTextColor, #666);
                opacity: 0.6;
                padding: 40px;
                font-style: italic;
            }

            .dmss-btn.small {
                padding: 4px 8px;
                font-size: 10px;
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * 测试DMSS功能
     */
    testDMSS() {
        console.log('[DMSS Debugger] 开始测试DMSS功能');
        
        const testContent = `
<DMSS>
[档案区 | Permanent Archive]
[C001_测试角色]: 
核心驱动: 测试驱动 → 因测试事件改变 → 新驱动
关系网: 朋友 → 因测试关系变化 → 挚友
人生履历:
- [ARC_测试章节]@2024-01-01: 测试事件摘要
- [E001_测试事件]@2024-01-01: 测试事件详情

[备用区 | Standby Roster]
[P001_并行事件]@测试地点: 测试并行事件 | 潜在影响 | 激活条件
</DMSS>
        `;

        // 模拟处理DMSS内容
        if (window.dmssUI && window.dmssUI.core) {
            window.dmssUI.core.processText(testContent).then(matches => {
                console.log('[DMSS Debugger] 测试完成，捕获到', matches.length, '个DMSS内容');
            }).catch(error => {
                console.error('[DMSS Debugger] 测试失败:', error);
            });
        } else {
            console.warn('[DMSS Debugger] DMSS核心未初始化，无法进行测试');
        }
    }

    /**
     * 手动扫描聊天
     */
    scanChat() {
        console.log('[DMSS Debugger] 开始手动扫描聊天');
        
        if (window.dmssUI && window.dmssUI.core) {
            window.dmssUI.core.scanLatestMessages().then(() => {
                console.log('[DMSS Debugger] 手动扫描完成');
            }).catch(error => {
                console.error('[DMSS Debugger] 手动扫描失败:', error);
            });
        } else {
            console.warn('[DMSS Debugger] DMSS核心未初始化，无法进行扫描');
        }
    }

    /**
     * 强制扫描整个聊天
     */
    forceScanChat() {
        console.log('[DMSS Debugger] 开始强制扫描整个聊天');
        
        if (window.dmssUI && window.dmssUI.core) {
            window.dmssUI.core.forceScanChat().then(() => {
                console.log('[DMSS Debugger] 强制扫描完成');
            }).catch(error => {
                console.error('[DMSS Debugger] 强制扫描失败:', error);
            });
        } else {
            console.warn('[DMSS Debugger] DMSS核心未初始化，无法进行强制扫描');
        }
    }
}

// 导出到全局
if (typeof window !== 'undefined') {
    window.DMSSDebugger = DMSSDebugger;
}

console.log('[DMSS Debugger] 动态记忆流系统调试器模块已加载');
