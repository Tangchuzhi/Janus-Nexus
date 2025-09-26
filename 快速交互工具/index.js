(function() {
    'use strict';
    console.log('[快速交互工具] 脚本已加载并采用标准事件驱动模式。');
    function dispatchCommand(command) {
        const event = new CustomEvent('st:slash_command', {
            detail: {
                command: command,
            },
        });
        document.dispatchEvent(event);

        console.log(`[快速交互工具] 已派发命令事件: ${command}`);
    }

    let hiddenRanges = [];

    function updateHiddenStatus() {
        const statusElement = document.getElementById('hidden-status');
        if (!statusElement) return;

        if (hiddenRanges.length === 0) {
            statusElement.innerHTML = '<span class="status-text">暂无隐藏的消息</span>';
        } else {
            const rangesHtml = hiddenRanges.map(range =>
                `<span class="hidden-range">${range.start}-${range.end}楼</span>`
            ).join('');
            statusElement.innerHTML = `<span class="status-text">已隐藏:</span> ${rangesHtml}`;
        }
    }

    // --- 将你的UI交互函数与新的命令派发机制连接起来 ---

    // 隐藏消息
    window.hideMessages = function() {
        const startFloor = parseInt(document.getElementById('start-floor').value);
        const endFloor = parseInt(document.getElementById('end-floor').value);

        if (isNaN(startFloor) || isNaN(endFloor) || startFloor <= 0 || endFloor <= 0) {
            toastr.error('请输入有效的、大于0的楼层号', '输入错误');
            return;
        }

        const [start, end] = startFloor > endFloor ? [endFloor, startFloor] : [startFloor, endFloor];
        const range = `${start}-${end}`;

        // 使用新的派发函数
        dispatchCommand(`/hide ${range}`);

        // 更新本地状态
        if (!hiddenRanges.some(r => r.start === start && r.end === end)) {
            hiddenRanges.push({ start, end });
        }
        updateHiddenStatus();

        toastr.success(`已发送隐藏请求: ${range}楼`, '操作成功');
    };

    // 取消隐藏消息
    window.unhideMessages = function() {
        const startFloor = parseInt(document.getElementById('start-floor').value);
        const endFloor = parseInt(document.getElementById('end-floor').value);

        if (isNaN(startFloor) || isNaN(endFloor) || startFloor <= 0 || endFloor <= 0) {
            toastr.error('请输入有效的、大于0的楼层号', '输入错误');
            return;
        }

        const [start, end] = startFloor > endFloor ? [endFloor, startFloor] : [startFloor, endFloor];
        const range = `${start}-${end}`;

        // 使用新的派发函数
        dispatchCommand(`/unhide ${range}`);

        // 更新本地状态
        hiddenRanges = hiddenRanges.filter(r => !(r.start === start && r.end === end));
        updateHiddenStatus();

        toastr.success(`已发送取消隐藏请求: ${range}楼`, '操作成功');
    };

    // 显示所有（基于本脚本记录的）
    window.showAllMessages = function() {
        if (hiddenRanges.length === 0) {
            toastr.info('根据记录，没有需要取消隐藏的消息', '提示');
            return;
        }

        // 创建一个副本进行迭代，同时清空原数组
        const rangesToUnhide = [...hiddenRanges];
        hiddenRanges = [];

        // 批量发送取消隐藏命令
        for (const range of rangesToUnhide) {
            dispatchCommand(`/unhide ${range.start}-${range.end}`);
        }

        updateHiddenStatus();
        toastr.success(`已为 ${rangesToUnhide.length} 个范围发送“显示全部”请求`, '操作成功');
    };

    // 初始加载时更新一次状态显示
    document.addEventListener('DOMContentLoaded', () => {
        // 可以在这里从localStorage加载之前保存的hiddenRanges
        // 例如: hiddenRanges = JSON.parse(localStorage.getItem('myPluginHiddenRanges')) || [];
        updateHiddenStatus();
    });

    console.log('[快速交互工具] UI功能已绑定到 window 对象。');
})();
