(function() {
    'true';

    // 确保只在顶层窗口运行，避免在iframe中重复执行
    if (window.self !== window.top) {
        return;
    }

    const QUICK_TOOLS_ID = 'quick-tools-message-hider';
    const EVENT_PREFIX = 'QuickTools_';

    // 存储状态，使用SillyTavern的上下文对象来持久化
    let context;

    function getContext() {
        if (typeof SillyTavern === 'object' && SillyTavern.getContext) {
            return SillyTavern.getContext();
        }
        throw new Error('无法获取SillyTavern上下文，请确保在正确的环境中运行。');
    }

    /**
     * SillyTavern的标准命令执行函数
     * @param {string} command - 完整的斜杠命令，例如 "/hide 1-5"
     */
    function callSlashCommand(command) {
        // 这是在SillyTavern扩展中执行命令的唯一标准方式
        SillyTavern.systemRequest('send', {
            type: 'cmd',
            mes: command
        });
        console.log(`[快速交互工具] 已发送命令: ${command}`);
    }

    // 隐藏消息
    function hideMessages(start, end) {
        if (isNaN(start) || isNaN(end) || start <= 0 || end <= 0) {
            SillyTavern.systemRequest('showToast', {
                type: 'error',
                message: '请输入有效的、大于0的楼层号。'
            });
            return;
        }

        if (start > end) {
            [start, end] = [end, start];
        }

        const range = `${start}-${end}`;
        callSlashCommand(`/hide ${range}`);

        // 更新状态
        if (!context.hiddenRanges.some(r => r.start === start && r.end === end)) {
            context.hiddenRanges.push({
                start,
                end
            });
        }

        updateHiddenStatus();
        SillyTavern.systemRequest('showToast', {
            type: 'success',
            message: `已发送隐藏楼层 ${range} 的请求。`
        });
    }

    // 取消隐藏消息
    function unhideMessages(start, end) {
        if (isNaN(start) || isNaN(end) || start <= 0 || end <= 0) {
            SillyTavern.systemRequest('showToast', {
                type: 'error',
                message: '请输入有效的、大于0的楼层号。'
            });
            return;
        }

        if (start > end) {
            [start, end] = [end, start];
        }

        const range = `${start}-${end}`;
        callSlashCommand(`/unhide ${range}`);

        // 更新状态
        context.hiddenRanges = context.hiddenRanges.filter(r => !(r.start === start && r.end === end));

        updateHiddenStatus();
        SillyTavern.systemRequest('showToast', {
            type: 'success',
            message: `已发送取消隐藏楼层 ${range} 的请求。`
        });
    }

    // 显示所有
    function showAllMessages() {
        if (context.hiddenRanges.length === 0) {
            SillyTavern.systemRequest('showToast', {
                type: 'info',
                message: '当前没有已记录的隐藏消息。'
            });
            return;
        }

        const rangesToUnhide = [...context.hiddenRanges];
        for (const range of rangesToUnhide) {
            callSlashCommand(`/unhide ${range.start}-${range.end}`);
        }

        const totalRanges = context.hiddenRanges.length;
        context.hiddenRanges = []; // 清空状态
        updateHiddenStatus();
        SillyTavern.systemRequest('showToast', {
            type: 'success',
            message: `已发送显示全部 ${totalRanges} 个范围的请求。`
        });
    }

    // 更新UI显示
    function updateHiddenStatus() {
        const statusElement = document.getElementById('hidden-status');
        if (!statusElement) return;

        if (!context.hiddenRanges || context.hiddenRanges.length === 0) {
            statusElement.innerHTML = '<span class="status-text">暂无隐藏的消息</span>';
        } else {
            const rangesHtml = context.hiddenRanges.map(range =>
                `<span class="hidden-range">${range.start}-${range.end}楼</span>`
            ).join('');
            statusElement.innerHTML = `<span class="status-text">已隐藏:</span> ${rangesHtml}`;
        }
    }

    // --- 事件监听 ---
    // 这是SillyTavern扩展与HTML交互的标准方式
    document.addEventListener(`${EVENT_PREFIX}hide`, () => {
        const start = parseInt(document.getElementById('start-floor').value);
        const end = parseInt(document.getElementById('end-floor').value);
        hideMessages(start, end);
    });

    document.addEventListener(`${EVENT_PREFIX}unhide`, () => {
        const start = parseInt(document.getElementById('start-floor').value);
        const end = parseInt(document.getElementById('end-floor').value);
        unhideMessages(start, end);
    });

    document.addEventListener(`${EVENT_PREFIX}showAll`, () => {
        showAllMessages();
    });

    // --- 初始化 ---
    // 监听SillyTavern的 'tavern:ready' 事件，确保在所有模块加载完毕后执行
    document.addEventListener('tavern:ready', () => {
        try {
            context = getContext();

            // 初始化状态存储
            if (!context.hiddenRanges) {
                context.hiddenRanges = [];
            }

            // 确保UI已加载
            setTimeout(() => {
                updateHiddenStatus();
            }, 500); // 延迟以确保DOM元素可用

            console.log('[快速交互工具] 脚本加载并初始化完成。');
        } catch (error) {
            console.error('[快速交互工具] 初始化失败:', error);
            SillyTavern.systemRequest('showToast', {
                type: 'error',
                message: '快速交互工具初始化失败，请检查控制台。'
            });
        }
    });

})();
