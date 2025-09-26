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
            
            console.log(`[快速交互] 已发送命令: ${command}`);
        } catch (e) {
            console.error('[快速交互] 发送命令失败:', e);
            if (typeof toastr !== 'undefined') {
                toastr.error(`命令执行失败: ${e.message}`);
            }
        }
    }

    // 隐藏消息
    function hideMessages(start, end) {
        if (isNaN(start) || isNaN(end) || start < 0 || end < 0) {
            if (typeof toastr !== 'undefined') {
                toastr.error('请输入有效的、大于等于0的楼层号。');
            }
            return;
        }

        if (start > end) {
            [start, end] = [end, start];
        }

        const range = `${start}-${end}`;
        callSlashCommand(`/hide ${range}`);

        // 更新状态
        if (typeof toastr !== 'undefined') {
            const rangeText = start === 0 && end === 0 ? '开场白' : 
                             start === 0 ? `开场白和楼层 1-${end}` : 
                             `楼层 ${start}-${end}`;
            toastr.success(`已发送隐藏${rangeText}的请求。`);
        }
    }


    // 取消隐藏消息
    function unhideMessages(start, end) {
        if (isNaN(start) || isNaN(end) || start < 0 || end < 0) {
            if (typeof toastr !== 'undefined') {
                toastr.error('请输入有效的、大于等于0的楼层号。');
            }
            return;
        }

        if (start > end) {
            [start, end] = [end, start];
        }

        const range = `${start}-${end}`;
        callSlashCommand(`/unhide ${range}`);

        if (typeof toastr !== 'undefined') {
            const rangeText = start === 0 && end === 0 ? '开场白' : 
                             start === 0 ? `开场白和楼层 1-${end}` : 
                             `楼层 ${start}-${end}`;
            toastr.success(`已发送取消隐藏${rangeText}的请求。`);
        }
    }

    // 显示所有
    function showAllMessages() {
        callSlashCommand('/unhide 0-{{lastMessageId}}');
        if (typeof toastr !== 'undefined') {
            toastr.success('已发送显示全部消息的请求。');
        }
    }

    // 双卡联动工具 - 发送ASK命令
    function sendAskCommand() {
        const characterSelect = document.getElementById('character-select');
        const askPrompt = document.getElementById('ask-prompt');
        
        if (!characterSelect || !askPrompt) {
            console.error('[快速交互] 找不到ASK工具的元素');
            if (typeof toastr !== 'undefined') {
                toastr.error('ASK工具初始化失败，请刷新页面重试。');
            }
            return;
        }
        
        const selectedCharacter = characterSelect.value;
        const prompt = askPrompt.value.trim();
        
        console.log('[快速交互] ASK命令调试:', {
            selectedCharacter,
            prompt,
            promptLength: prompt.length
        });
        
        if (!selectedCharacter) {
            if (typeof toastr !== 'undefined') {
                toastr.error('请选择目标角色。');
            }
            return;
        }
        
        if (!prompt) {
            if (typeof toastr !== 'undefined') {
                toastr.error('请输入互动内容。');
            }
            return;
        }
        
        // 构建ASK命令 - 使用return=none避免显示长内容
        const askCommand = `/ask name=${selectedCharacter} return=none ${prompt}`;
        callSlashCommand(askCommand);
        askPrompt.value = '';
    }

    // 加载角色列表
    function loadCharacterList() {
        try {
            // 尝试从SillyTavern获取角色列表
            if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
                const context = SillyTavern.getContext();
                if (context && context.characters) {
                    populateCharacterSelect(context.characters);
                    return;
                }
            }
            
            // 如果无法从SillyTavern获取，尝试从DOM获取
            const characterElements = document.querySelectorAll('.character_select option, .character-item, [data-character-name]');
            if (characterElements.length > 0) {
                const characters = Array.from(characterElements).map(el => {
                    return {
                        name: el.textContent || el.dataset.characterName || el.value,
                        id: el.value || el.dataset.characterId
                    };
                }).filter(char => char.name && char.name !== '请选择角色...');
                
                populateCharacterSelect(characters);
                return;
            }
            
            // 如果都获取不到，显示提示
            console.warn('[快速交互] 无法获取角色列表，请手动输入角色名');
            
        } catch (error) {
            console.error('[快速交互] 加载角色列表失败:', error);
        }
    }

    // 填充角色选择下拉框
    function populateCharacterSelect(characters) {
        const characterSelect = document.getElementById('character-select');
        if (!characterSelect) return;
        
        // 清空现有选项（保留第一个提示选项）
        characterSelect.innerHTML = '<option value="">请选择角色...</option>';
        
        // 添加角色选项
        characters.forEach(character => {
            const option = document.createElement('option');
            option.value = character.name || character.id;
            option.textContent = character.name || character.id;
            characterSelect.appendChild(option);
        });
        
        console.log(`[快速交互] 已加载 ${characters.length} 个角色`);
    }

    // 一键总结工具 - 保存总结提示词
    function saveSummaryPrompt() {
        const summaryPrompt = document.getElementById('summary-prompt');
        if (!summaryPrompt) {
            console.error('[快速交互] 找不到总结提示词元素');
            return;
        }
        
        const prompt = summaryPrompt.value.trim();
        if (!prompt) {
            if (typeof toastr !== 'undefined') {
                toastr.error('请输入总结提示词。');
            }
            return;
        }
        
        // 保存到SillyTavern的上下文中
        try {
            if (!context.summaryPrompt) {
                context.summaryPrompt = '';
            }
            context.summaryPrompt = prompt;
            
            if (typeof toastr !== 'undefined') {
                toastr.success('总结提示词已保存。');
            }
            console.log('[快速交互] 总结提示词已保存:', prompt);
        } catch (error) {
            console.error('[快速交互] 保存总结提示词失败:', error);
            if (typeof toastr !== 'undefined') {
                toastr.error('保存失败，请重试。');
            }
        }
    }

    // 一键总结工具 - 生成总结
    function generateSummary() {
        const summaryPrompt = document.getElementById('summary-prompt');
        if (!summaryPrompt) {
            console.error('[快速交互] 找不到总结提示词元素');
            return;
        }
        
        const prompt = summaryPrompt.value.trim();
        if (!prompt) {
            if (typeof toastr !== 'undefined') {
                toastr.error('请先输入总结提示词。');
            }
            return;
        }
        
        try {
            // 使用genraw命令生成总结
            const genrawCommand = `/genraw as=system ${prompt}`;
            callSlashCommand(genrawCommand);
            
            if (typeof toastr !== 'undefined') {
                toastr.success('已开始生成总结，请稍候...');
            }
            console.log('[快速交互] 已发送总结生成请求');
        } catch (error) {
            console.error('[快速交互] 生成总结失败:', error);
            if (typeof toastr !== 'undefined') {
                toastr.error('生成总结失败，请重试。');
            }
        }
    }

    // 加载保存的总结提示词
    function loadSummaryPrompt() {
        try {
            const summaryPrompt = document.getElementById('summary-prompt');
            if (!summaryPrompt) return;
            
            // 从SillyTavern上下文加载保存的提示词
            if (context.summaryPrompt) {
                summaryPrompt.value = context.summaryPrompt;
            } else {
                // 设置默认的总结提示词
                const defaultPrompt = `请对以上对话进行总结，包括：
1. 主要话题和情节发展
2. 重要角色和他们的行为
3. 关键事件和转折点
4. 当前状态和后续可能的发展方向

请用简洁明了的语言进行总结，便于理解整个对话的脉络。`;
                summaryPrompt.value = defaultPrompt;
            }
        } catch (error) {
            console.error('[快速交互] 加载总结提示词失败:', error);
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

    document.addEventListener(`${EVENT_PREFIX}ask`, () => {
        sendAskCommand();
    });

    document.addEventListener(`${EVENT_PREFIX}saveSummaryPrompt`, () => {
        saveSummaryPrompt();
    });

    document.addEventListener(`${EVENT_PREFIX}generateSummary`, () => {
        generateSummary();
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
        console.log('[快速交互] 已添加隐藏样式');
    }

    // --- 初始化 ---
    // 采用重试方式等待 SillyTavern 和 DOM 准备就绪
    function tryInit(retry = 0) {
        try {
            context = getContext();


            // 添加隐藏样式
            addHideStyles();

            // 加载角色列表
            setTimeout(() => {
                loadCharacterList();
            }, 500);

            // 加载总结提示词
            setTimeout(() => {
                loadSummaryPrompt();
            }, 600);

            console.log('[快速交互] 脚本加载并初始化完成。');
        } catch (error) {
            if (retry < 20) {
                setTimeout(() => tryInit(retry + 1), 250);
            } else {
                console.error('[快速交互] 初始化失败:', error);
                if (typeof toastr !== 'undefined') {
                    toastr.error('快速交互初始化失败，请检查控制台。');
                }
            }
        }
    }

    // 当脚本加载后即开始尝试初始化
    tryInit();

    // 标签页切换功能
    window.switchTab = function(tabName) {
        // 隐藏所有标签页内容
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // 移除所有标签按钮的active状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 显示选中的标签页
        const targetTab = document.getElementById(tabName + '-tab');
        if (targetTab) {
            targetTab.classList.add('active');
        }
        
        // 激活对应的标签按钮
        const targetBtn = document.querySelector(`[onclick="switchTab('${tabName}')"]`);
        if (targetBtn) {
            targetBtn.classList.add('active');
        }
    };

})();
