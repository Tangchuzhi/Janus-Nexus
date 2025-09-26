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
            return;
        }
        
        const selectedCharacter = characterSelect.value;
        const prompt = askPrompt.value.trim();
        
        if (!selectedCharacter) {
            if (typeof toastr !== 'undefined') {
                toastr.error('请选择目标角色。');
            }
            return;
        }
        
        if (!prompt) {
            if (typeof toastr !== 'undefined') {
                toastr.error('请输入询问内容。');
            }
            return;
        }
        
        // 构建ASK命令
        const askCommand = `/ask name=${selectedCharacter} return=toast-text ${prompt}`;
        callSlashCommand(askCommand);
        
        if (typeof toastr !== 'undefined') {
            toastr.success(`已向 ${selectedCharacter} 发送询问。`);
        }
        
        // 清空输入框
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

})();
