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
     * 执行斜杠命令（/hide、/unhide 等）
     * 通过操作 SillyTavern 的输入框和发送按钮来执行命令
     * @param {string} command - 完整的斜杠命令，例如 "/hide 1-5"
     */
    function callSlashCommand(command) {
        try {
            const textarea = document.querySelector('#send_textarea');
            const sendButton = document.querySelector('#send_but');
            
            if (!textarea || !sendButton) {
                throw new Error('找不到 SillyTavern 的输入框或发送按钮');
            }
            
            // 将命令设置到输入框
            textarea.value = command;
            
            // 触发 input 事件以确保 SillyTavern 检测到变化
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            
            // 点击发送按钮
            sendButton.click();
            
            console.log(`[快速交互工具] 已发送命令: ${command}`);
        } catch (e) {
            console.error('[快速交互工具] 发送命令失败:', e);
            if (typeof toastr !== 'undefined') {
                toastr.error(`命令执行失败: ${e.message}`);
            }
        }
    }

    // 隐藏消息
    function hideMessages(start, end) {
        if (isNaN(start) || isNaN(end) || start <= 0 || end <= 0) {
            if (typeof toastr !== 'undefined') {
                toastr.error('请输入有效的、大于0的楼层号。');
            }
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
        if (typeof toastr !== 'undefined') {
            toastr.success(`已发送隐藏楼层 ${range} 的请求。`);
        }
    }

    // 取消隐藏消息
    function unhideMessages(start, end) {
        if (isNaN(start) || isNaN(end) || start <= 0 || end <= 0) {
            if (typeof toastr !== 'undefined') {
                toastr.error('请输入有效的、大于0的楼层号。');
            }
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
        if (typeof toastr !== 'undefined') {
            toastr.success(`已发送取消隐藏楼层 ${range} 的请求。`);
        }
    }

    // 显示所有
    function showAllMessages() {
        if (context.hiddenRanges.length === 0) {
            if (typeof toastr !== 'undefined') {
                toastr.info('当前没有已记录的隐藏消息。');
            }
            return;
        }

        const rangesToUnhide = [...context.hiddenRanges];
        for (const range of rangesToUnhide) {
            callSlashCommand(`/unhide ${range.start}-${range.end}`);
        }

        const totalRanges = context.hiddenRanges.length;
        context.hiddenRanges = []; // 清空状态
        updateHiddenStatus();
        if (typeof toastr !== 'undefined') {
            toastr.success(`已发送显示全部 ${totalRanges} 个范围的请求。`);
        }
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

    // 添加 CSS 样式来隐藏系统消息
    function addHideStyles() {
        const styleId = 'quick-tools-hide-styles';
        if (document.getElementById(styleId)) return; // 避免重复添加
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* 完全隐藏被标记为系统消息的聊天消息 */
            .mes[is_system="true"] {
                display: none !important;
            }
            
            /* 确保隐藏的消息不会占用空间 */
            .mes[is_system="true"] + .mes {
                margin-top: 0;
            }
        `;
        document.head.appendChild(style);
        console.log('[快速交互工具] 已添加隐藏样式');
    }

    // --- 初始化 ---
    // 采用重试方式等待 SillyTavern 和 DOM 准备就绪
    function tryInit(retry = 0) {
        try {
            context = getContext();

            // 初始化状态存储
            if (!context.hiddenRanges) {
                context.hiddenRanges = [];
            }

            // 添加隐藏样式
            addHideStyles();

            // 确保UI已加载
            setTimeout(() => {
                updateHiddenStatus();
            }, 300);

            console.log('[快速交互工具] 脚本加载并初始化完成。');
        } catch (error) {
            if (retry < 20) {
                setTimeout(() => tryInit(retry + 1), 250);
            } else {
                console.error('[快速交互工具] 初始化失败:', error);
                if (typeof toastr !== 'undefined') {
                    toastr.error('快速交互工具初始化失败，请检查控制台。');
                }
            }
        }
    }

    // 当脚本加载后即开始尝试初始化
    tryInit();

})();
