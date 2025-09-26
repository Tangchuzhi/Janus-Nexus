(function() {
    'use strict';
    
    console.log('[快速交互工具] 脚本开始加载...');
    
    // 存储隐藏的消息范围
    let hiddenRanges = [];
    
    // 获取聊天消息元素
    function getChatMessages() {
        // 尝试多种可能的聊天容器选择器
        const selectors = [
            '#chat .mes',
            '.mes',
            '#sheld .mes',
            '.chat-container .mes',
            '.messages-container .mes'
        ];
        
        for (const selector of selectors) {
            const messages = document.querySelectorAll(selector);
            if (messages.length > 0) {
                return Array.from(messages);
            }
        }
        
        console.warn('[快速交互工具] 未找到聊天消息元素');
        return [];
    }
    
    // 获取消息的楼层号
    function getMessageFloor(messageElement, index) {
        // 尝试从元素中获取楼层号
        const floorElement = messageElement.querySelector('.mes_count, .message-floor, .floor-number');
        if (floorElement) {
            const floorText = floorElement.textContent.trim();
            const floorNumber = parseInt(floorText.replace(/[^\d]/g, ''));
            if (!isNaN(floorNumber)) {
                return floorNumber;
            }
        }
        
        // 如果没有找到楼层号，使用索引+1作为楼层号
        return index + 1;
    }
    
    // 隐藏指定范围的消息
    function hideMessagesInRange(startFloor, endFloor) {
        if (startFloor > endFloor) {
            [startFloor, endFloor] = [endFloor, startFloor];
        }
        
        const messages = getChatMessages();
        if (messages.length === 0) {
            toastr.warning('未找到聊天消息', '隐藏失败');
            return false;
        }
        
        let hiddenCount = 0;
        
        messages.forEach((message, index) => {
            const floor = getMessageFloor(message, index);
            if (floor >= startFloor && floor <= endFloor) {
                message.style.display = 'none';
                message.setAttribute('data-janus-hidden', 'true');
                message.setAttribute('data-janus-floor', floor.toString());
                hiddenCount++;
            }
        });
        
        if (hiddenCount > 0) {
            // 记录隐藏范围
            const existingRange = hiddenRanges.find(r => r.start === startFloor && r.end === endFloor);
            if (!existingRange) {
                hiddenRanges.push({ start: startFloor, end: endFloor, count: hiddenCount });
            }
            
            updateHiddenStatus();
            toastr.success(`已隐藏 ${hiddenCount} 条消息 (${startFloor}-${endFloor}楼)`, '隐藏成功');
            return true;
        } else {
            toastr.info(`在 ${startFloor}-${endFloor}楼 范围内未找到消息`, '未找到消息');
            return false;
        }
    }
    
    // 取消隐藏指定范围的消息
    function unhideMessagesInRange(startFloor, endFloor) {
        if (startFloor > endFloor) {
            [startFloor, endFloor] = [endFloor, startFloor];
        }
        
        const messages = document.querySelectorAll('[data-janus-hidden="true"]');
        if (messages.length === 0) {
            toastr.info('没有隐藏的消息', '取消隐藏');
            return false;
        }
        
        let unhiddenCount = 0;
        
        messages.forEach(message => {
            const floor = parseInt(message.getAttribute('data-janus-floor'));
            if (floor >= startFloor && floor <= endFloor) {
                message.style.display = '';
                message.removeAttribute('data-janus-hidden');
                message.removeAttribute('data-janus-floor');
                unhiddenCount++;
            }
        });
        
        if (unhiddenCount > 0) {
            // 移除记录的隐藏范围
            hiddenRanges = hiddenRanges.filter(r => !(r.start === startFloor && r.end === endFloor));
            
            updateHiddenStatus();
            toastr.success(`已显示 ${unhiddenCount} 条消息 (${startFloor}-${endFloor}楼)`, '取消隐藏成功');
            return true;
        } else {
            toastr.info(`在 ${startFloor}-${endFloor}楼 范围内未找到隐藏的消息`, '未找到隐藏消息');
            return false;
        }
    }
    
    // 显示所有隐藏的消息
    function showAllHiddenMessages() {
        const hiddenMessages = document.querySelectorAll('[data-janus-hidden="true"]');
        if (hiddenMessages.length === 0) {
            toastr.info('没有隐藏的消息', '显示全部');
            return false;
        }
        
        hiddenMessages.forEach(message => {
            message.style.display = '';
            message.removeAttribute('data-janus-hidden');
            message.removeAttribute('data-janus-floor');
        });
        
        const totalCount = hiddenMessages.length;
        hiddenRanges = [];
        updateHiddenStatus();
        
        toastr.success(`已显示所有隐藏的消息 (${totalCount} 条)`, '显示全部成功');
        return true;
    }
    
    // 更新隐藏状态显示
    function updateHiddenStatus() {
        const statusElement = document.getElementById('hidden-status');
        if (!statusElement) return;
        
        if (hiddenRanges.length === 0) {
            statusElement.innerHTML = '<span class="status-text">暂无隐藏的消息</span>';
        } else {
            const rangesHtml = hiddenRanges.map(range => 
                `<span class="hidden-range">${range.start}-${range.end}楼 (${range.count}条)</span>`
            ).join('');
            statusElement.innerHTML = `<span class="status-text">已隐藏:</span> ${rangesHtml}`;
        }
    }
    
    // 解析命令
    function parseCommand(command) {
        const trimmedCommand = command.trim();
        
        // 解析 /hide 或 /unhide 命令
        const hideMatch = trimmedCommand.match(/^\/hide\s+(\d+)-(\d+)$/i);
        const unhideMatch = trimmedCommand.match(/^\/unhide\s+(\d+)-(\d+)$/i);
        
        if (hideMatch) {
            return {
                action: 'hide',
                startFloor: parseInt(hideMatch[1]),
                endFloor: parseInt(hideMatch[2])
            };
        }
        
        if (unhideMatch) {
            return {
                action: 'unhide',
                startFloor: parseInt(unhideMatch[1]),
                endFloor: parseInt(unhideMatch[2])
            };
        }
        
        return null;
    }
    
    // 全局函数，供HTML调用
    window.hideMessages = function() {
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
        
        hideMessagesInRange(startFloor, endFloor);
    };
    
    window.unhideMessages = function() {
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
        
        unhideMessagesInRange(startFloor, endFloor);
    };
    
    window.showAllMessages = function() {
        showAllHiddenMessages();
    };
    
    window.executeCommand = function() {
        const commandInput = document.getElementById('command-input');
        const command = commandInput.value.trim();
        
        if (!command) {
            toastr.warning('请输入命令', '输入为空');
            return;
        }
        
        const parsedCommand = parseCommand(command);
        
        if (!parsedCommand) {
            toastr.error('无效的命令格式\n正确格式: /hide 1-5 或 /unhide 1-5', '命令错误');
            return;
        }
        
        if (parsedCommand.action === 'hide') {
            hideMessagesInRange(parsedCommand.startFloor, parsedCommand.endFloor);
        } else if (parsedCommand.action === 'unhide') {
            unhideMessagesInRange(parsedCommand.startFloor, parsedCommand.endFloor);
        }
        
        // 清空输入框
        commandInput.value = '';
    };
    
    window.setCommand = function(command) {
        const commandInput = document.getElementById('command-input');
        if (commandInput) {
            commandInput.value = command;
        }
    };
    
    // 添加回车键执行命令
    setTimeout(() => {
        const commandInput = document.getElementById('command-input');
        if (commandInput) {
            commandInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    executeCommand();
                }
            });
        }
    }, 100);
    
    // 初始化状态显示
    setTimeout(() => {
        updateHiddenStatus();
    }, 500);
    
    console.log('[快速交互工具] 脚本加载完成');
})();
