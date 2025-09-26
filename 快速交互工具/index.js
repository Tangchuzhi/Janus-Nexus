(function() {
    'use strict';
    
    console.log('[快速交互工具] 脚本开始加载...');
    
    // 存储隐藏的消息范围
    let hiddenRanges = [];
    
    // 获取SillyTavern的triggerSlash函数
    function getTriggerSlash() {
        // 尝试多种可能的triggerSlash位置
        if (window.triggerSlash && typeof window.triggerSlash === 'function') {
            return window.triggerSlash;
        }
        
        // 检查是否在全局作用域
        if (typeof triggerSlash !== 'undefined' && typeof triggerSlash === 'function') {
            return triggerSlash;
        }
        
        // 检查SillyTavern的其他可能位置
        if (window.SillyTavern && window.SillyTavern.triggerSlash) {
            return window.SillyTavern.triggerSlash;
        }
        
        console.error('[快速交互工具] 未找到triggerSlash函数');
        return null;
    }
    
    // 调用SillyTavern的斜杠命令
    async function callSlashCommand(command) {
        const triggerSlashFn = getTriggerSlash();
        if (!triggerSlashFn) {
            throw new Error('无法找到SillyTavern的命令执行函数');
        }
        
        try {
            console.log(`[快速交互工具] 执行命令: ${command}`);
            await triggerSlashFn(command);
            return true;
        } catch (error) {
            console.error('[快速交互工具] 命令执行失败:', error);
            throw error;
        }
    }
    
    // 隐藏指定范围的消息
    async function hideMessagesInRange(startFloor, endFloor) {
        if (startFloor > endFloor) {
            [startFloor, endFloor] = [endFloor, startFloor];
        }
        
        try {
            const range = `${startFloor}-${endFloor}`;
            await callSlashCommand(`/hide ${range}`);
            
            // 记录隐藏范围
            const existingRangeIndex = hiddenRanges.findIndex(r => r.start === startFloor && r.end === endFloor);
            if (existingRangeIndex === -1) {
                hiddenRanges.push({ start: startFloor, end: endFloor });
            }
            
            updateHiddenStatus();
            toastr.success(`已隐藏楼层 ${range}`, '隐藏成功');
            return true;
        } catch (error) {
            console.error('[快速交互工具] 隐藏消息失败:', error);
            toastr.error(`隐藏失败: ${error.message}`, '隐藏失败');
            return false;
        }
    }
    
    // 取消隐藏指定范围的消息
    async function unhideMessagesInRange(startFloor, endFloor) {
        if (startFloor > endFloor) {
            [startFloor, endFloor] = [endFloor, startFloor];
        }
        
        try {
            const range = `${startFloor}-${endFloor}`;
            await callSlashCommand(`/unhide ${range}`);
            
            // 移除记录的隐藏范围
            hiddenRanges = hiddenRanges.filter(r => !(r.start === startFloor && r.end === endFloor));
            
            updateHiddenStatus();
            toastr.success(`已取消隐藏楼层 ${range}`, '取消隐藏成功');
            return true;
        } catch (error) {
            console.error('[快速交互工具] 取消隐藏消息失败:', error);
            toastr.error(`取消隐藏失败: ${error.message}`, '取消隐藏失败');
            return false;
        }
    }
    
    // 显示所有隐藏的消息
    async function showAllHiddenMessages() {
        if (hiddenRanges.length === 0) {
            toastr.info('没有隐藏的消息', '显示全部');
            return false;
        }
        
        try {
            // 逐个取消隐藏所有范围
            const rangesToUnhide = [...hiddenRanges]; // 创建副本
            
            for (const range of rangesToUnhide) {
                const rangeStr = `${range.start}-${range.end}`;
                await callSlashCommand(`/unhide ${rangeStr}`);
            }
            
            const totalRanges = rangesToUnhide.length;
            hiddenRanges = [];
            updateHiddenStatus();
            
            toastr.success(`已显示所有隐藏的消息 (${totalRanges} 个范围)`, '显示全部成功');
            return true;
        } catch (error) {
            console.error('[快速交互工具] 显示全部消息失败:', error);
            toastr.error(`显示全部失败: ${error.message}`, '显示全部失败');
            return false;
        }
    }
    
    // 更新隐藏状态显示
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
    
    // 全局函数，供HTML调用
    window.hideMessages = async function() {
        const startFloor = parseInt(document.getElementById('start-floor').value);
        const endFloor = parseInt(document.getElementById('end-floor').value);
        
        if (isNaN(startFloor) || isNaN(endFloor)) {
            toastr.error('请输入有效的楼层号', '输入错误');
            return;
        }
        
        if (startFloor <= 0 || endFloor <= 0) {
            toastr.error('楼层号必须大于0', '输入错误');
            return;
        }
        
        await hideMessagesInRange(startFloor, endFloor);
    };
    
    window.unhideMessages = async function() {
        const startFloor = parseInt(document.getElementById('start-floor').value);
        const endFloor = parseInt(document.getElementById('end-floor').value);
        
        if (isNaN(startFloor) || isNaN(endFloor)) {
            toastr.error('请输入有效的楼层号', '输入错误');
            return;
        }
        
        if (startFloor <= 0 || endFloor <= 0) {
            toastr.error('楼层号必须大于0', '输入错误');
            return;
        }
        
        await unhideMessagesInRange(startFloor, endFloor);
    };
    
    window.showAllMessages = async function() {
        await showAllHiddenMessages();
    };
    
    // 初始化状态显示
    setTimeout(() => {
        updateHiddenStatus();
    }, 500);
    
    console.log('[快速交互工具] 脚本加载完成');
})();
