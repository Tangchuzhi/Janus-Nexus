// 打包助手 JavaScript 文件
(function() {
    'use strict';
    
    console.log('[打包助手] 开始加载...');
    
    // 全局变量
    let selectedPresets = [];
    let selectedRegexes = [];
    let selectedQuickReplies = [];
    let selectedWorldBooks = [];
    let selectedCharacters = [];
    let packageData = null;
    
    // 调试日志函数
    function debugLog(message) {
        console.log('[打包助手]', message);
    }
    
    // 实现triggerSlash函数，用于执行slash命令序列
    async function triggerSlash(commandText) {
        debugLog('triggerSlash被调用');
        
        try {
            // 检查是否有SillyTavern的slash命令执行函数
            if (window.executeSlashCommands && typeof window.executeSlashCommands === 'function') {
                debugLog('使用window.executeSlashCommands执行命令');
                return await window.executeSlashCommands(commandText, true, null, false);
            }
            
            // 检查是否有SillyTavern全局对象
            if (window.SillyTavern && window.SillyTavern.executeSlashCommands) {
                debugLog('使用SillyTavern.executeSlashCommands执行命令');
                return await window.SillyTavern.executeSlashCommands(commandText, true, null, false);
            }
            
            // 尝试从script.js导入
            if (typeof executeSlashCommands === 'function') {
                debugLog('使用全局executeSlashCommands执行命令');
                return await executeSlashCommands(commandText, true, null, false);
            }
            
            // 备用方法：逐行执行命令
            debugLog('使用备用方法逐行执行命令');
            const commands = commandText.split('||\n').filter(cmd => cmd.trim());
            const results = [];
            
            for (const command of commands) {
                const trimmedCmd = command.trim();
                if (trimmedCmd) {
                    try {
                        debugLog(`执行命令: ${trimmedCmd}`);
                        
                        // 尝试通过不同的方式执行命令
                        let result = null;
                        
                        if (window.executeSlashCommands) {
                            result = await window.executeSlashCommands(trimmedCmd, true, null, false);
                        } else if (window.SillyTavern && window.SillyTavern.executeSlashCommands) {
                            result = await window.SillyTavern.executeSlashCommands(trimmedCmd, true, null, false);
                        } else {
                            // 最后的备用方法：模拟用户输入
                            const textarea = document.querySelector('#send_textarea');
                            if (textarea) {
                                textarea.value = trimmedCmd;
                                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                                
                                // 触发发送
                                const sendButton = document.querySelector('#send_but');
                                if (sendButton) {
                                    sendButton.click();
                                }
                                
                                // 等待命令执行完成
                                await new Promise(resolve => setTimeout(resolve, 1000));
                            }
                        }
                        
                        results.push(result);
                    } catch (cmdError) {
                        debugLog(`命令执行失败: ${trimmedCmd} - ${cmdError.message}`);
                        results.push(null);
                    }
                }
            }
            
            return results;
            
        } catch (error) {
            debugLog(`triggerSlash执行失败: ${error.message}`);
            throw error;
        }
    }
    
    // 显示状态消息 - 使用toastr系统通知
    function showStatus(message, type = 'info') {
        // 使用toastr显示通知
        switch(type) {
            case 'success':
                toastr.success(message, '操作成功', {
                    timeOut: 3000,
                    extendedTimeOut: 1000,
                    positionClass: 'toast-top-center',
                    preventDuplicates: true
                });
                break;
            case 'error':
                toastr.error(message, '操作失败', {
                    timeOut: 5000,
                    extendedTimeOut: 2000,
                    positionClass: 'toast-top-center',
                    preventDuplicates: true
                });
                break;
            case 'info':
            default:
                toastr.info(message, '提示', {
                    timeOut: 3000,
                    extendedTimeOut: 1000,
                    positionClass: 'toast-top-center',
                    preventDuplicates: true
                });
                break;
        }
        
        debugLog(`状态: ${type.toUpperCase()} - ${message}`);
    }
    
    // 显示进度条
    function showProgress(percent) {
        const progressEl = document.getElementById('preset-progress');
        const progressBar = document.getElementById('progress-bar');
        
        if (!progressEl || !progressBar) return;
        
        progressEl.style.display = 'block';
        progressBar.style.width = percent + '%';
        
        if (percent >= 100) {
            setTimeout(() => {
                progressEl.style.display = 'none';
            }, 800);
        }
    }
    
    // 切换标签页
    function switchPresetTab(tab) {
        // 移除所有活动状态
        document.querySelectorAll('.preset-helper-category-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.preset-tab-content').forEach(content => content.classList.remove('active'));
        
        // 激活选中的标签页
        document.querySelector(`[data-category="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}-tab`).classList.add('active');
        
        debugLog(`切换到标签页: ${tab}`);
    }
    
    // 切换资源标签页
    function switchResourceTab(tab) {
        document.querySelectorAll('.resource-tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.resource-content').forEach(content => content.classList.remove('active'));
        
        document.querySelector(`[onclick="switchResourceTab('${tab}')"]`).classList.add('active');
        document.getElementById(`${tab}-content`).classList.add('active');
        
        debugLog(`切换到资源标签页: ${tab}`);
    }
    
    // 加载预设列表
    async function loadPresets() {
        try {
            debugLog('开始加载预设...');
            
            // 使用 SillyTavern 的预设管理器获取预设列表
            const context = SillyTavern.getContext();
            const presetManager = context.getPresetManager();
            
            if (!presetManager) {
                debugLog('预设管理器未找到');
                const container = document.getElementById('presets-list');
                if (container) {
                    container.innerHTML = '<div class="empty-state">预设管理器未找到</div>';
                }
                return;
            }
            
            const allPresets = presetManager.getAllPresets();
            debugLog(`找到 ${allPresets.length} 个预设`);
            
            const container = document.getElementById('presets-list');
            if (!container) return;
            
            container.innerHTML = '';
            
            if (allPresets.length === 0) {
                container.innerHTML = '<div class="empty-state">未找到预设</div>';
                return;
            }
            
            allPresets.forEach(preset => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'resource-item';
                itemDiv.innerHTML = `
                    <input type="checkbox" id="preset-${preset}" onchange="togglePreset('${preset}')">
                    <div class="resource-item-info">
                        <div class="resource-item-name">${preset}</div>
                        <div class="resource-item-desc">预设配置</div>
                    </div>
                `;
                container.appendChild(itemDiv);
            });
            
        } catch (error) {
            debugLog('预设加载错误: ' + error.message);
            const container = document.getElementById('presets-list');
            if (container) {
                container.innerHTML = `<div class="empty-state">加载失败: ${error.message}</div>`;
            }
        }
    }
    
    // 加载正则列表
    async function loadRegexes() {
        try {
            debugLog('开始加载正则...');
            
            // 使用 SillyTavern 的正则扩展获取正则脚本
            const context = SillyTavern.getContext();
            const extensionSettings = context.extensionSettings || {};
            // 仅读取，不修改全局正则
            const regexScripts = extensionSettings.regex || [];
            
            debugLog(`找到 ${regexScripts.length} 个正则脚本`);
            
            const container = document.getElementById('regexes-list');
            if (!container) return;
            
            container.innerHTML = '';
            
            if (regexScripts.length === 0) {
                container.innerHTML = '<div class="empty-state">未找到正则脚本</div>';
                return;
            }
            
            regexScripts.forEach((script, index) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'resource-item';
                itemDiv.innerHTML = `
                    <input type="checkbox" id="regex-${index}" onchange="toggleRegex('${index}')">
                    <div class="resource-item-info">
                        <div class="resource-item-name">${script.scriptName || `正则脚本 ${index + 1}`}</div>
                        <div class="resource-item-desc">${script.findRegex ? script.findRegex.substring(0, 30) + '...' : '正则表达式'}</div>
                    </div>
                `;
                container.appendChild(itemDiv);
            });
            
        } catch (error) {
            debugLog('正则加载错误: ' + error.message);
            const container = document.getElementById('regexes-list');
            if (container) {
                container.innerHTML = `<div class="empty-state">加载失败: ${error.message}</div>`;
            }
        }
    }
    
    // 加载世界书列表
    async function loadWorldBooks() {
        try {
            debugLog('开始加载世界书...');
            
            // 使用 SillyTavern 的 API 获取世界书列表
            const context = SillyTavern.getContext();
            
            // 从API获取世界书数据
            const response = await fetch('/api/settings/get', {
                method: 'POST',
                headers: context.getRequestHeaders(),
                body: JSON.stringify({}),
            });
            
            if (response.ok) {
                const data = await response.json();
                const worldNames = data.world_names || [];
                
                debugLog(`从API获取到 ${worldNames.length} 个世界书`);
                
                const container = document.getElementById('worldbooks-list');
                if (!container) return;
                
                container.innerHTML = '';
                
                if (worldNames.length === 0) {
                    container.innerHTML = '<div class="empty-state">未找到世界书</div>';
                    return;
                }
                
                // 为每个世界书获取详细信息
                for (const worldName of worldNames) {
                    try {
                        const worldResponse = await fetch('/api/worldinfo/get', {
                            method: 'POST',
                            headers: context.getRequestHeaders(),
                            body: JSON.stringify({ name: worldName }),
                        });
                        
                        if (worldResponse.ok) {
                            const worldData = await worldResponse.json();
                            const entryCount = worldData.entries ? Object.keys(worldData.entries).length : 0;
                            
                            const itemDiv = document.createElement('div');
                            itemDiv.className = 'resource-item';
                            itemDiv.innerHTML = `
                                <input type="checkbox" id="worldbook-${worldName}" onchange="toggleWorldBook('${worldName}')">
                                <div class="resource-item-info">
                                    <div class="resource-item-name">${worldName}</div>
                                    <div class="resource-item-desc">${entryCount} 个条目</div>
                                </div>
                            `;
                            container.appendChild(itemDiv);
                        } else {
                            debugLog(`获取世界书 ${worldName} 详情失败`);
                        }
                    } catch (worldError) {
                        debugLog(`获取世界书 ${worldName} 详情出错: ${worldError.message}`);
                    }
                }
            } else {
                debugLog('API获取失败: ' + response.status);
                const container = document.getElementById('worldbooks-list');
                if (container) {
                    container.innerHTML = '<div class="empty-state">获取世界书失败</div>';
                }
            }
            
        } catch (error) {
            debugLog('世界书加载错误: ' + error.message);
            const container = document.getElementById('worldbooks-list');
            if (container) {
                container.innerHTML = `<div class="empty-state">加载失败: ${error.message}</div>`;
            }
        }
    }
    
    // 加载角色卡列表
    async function loadCharacters() {
        try {
            debugLog('开始加载角色卡...');
            
            // 使用 SillyTavern 的 API 获取角色卡列表
            const context = SillyTavern.getContext();
            
            // 从API获取所有角色卡数据
            const response = await fetch('/api/characters/all', {
                method: 'POST',
                headers: context.getRequestHeaders(),
                body: JSON.stringify({}),
            });
            
            if (response.ok) {
                const characters = await response.json();
                
                debugLog(`从API获取到 ${characters.length} 个角色卡`);
                
                const container = document.getElementById('characters-list');
                if (!container) return;
                
                container.innerHTML = '';
                
                if (characters.length === 0) {
                    container.innerHTML = '<div class="empty-state">未找到角色卡</div>';
                    return;
                }
                
                characters.forEach(character => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'resource-item';
                    itemDiv.innerHTML = `
                        <input type="checkbox" id="character-${character.avatar}" onchange="toggleCharacter('${character.avatar}')">
                        <div class="resource-item-info">
                            <div class="resource-item-name">${character.name || character.data?.name || '未命名角色'}</div>
                            <div class="resource-item-desc">${character.data?.description ? character.data.description.substring(0, 50) + '...' : '角色卡'}</div>
                        </div>
                    `;
                    container.appendChild(itemDiv);
                });
            } else {
                debugLog('API获取失败: ' + response.status);
                const container = document.getElementById('characters-list');
                if (container) {
                    container.innerHTML = '<div class="empty-state">获取角色卡失败</div>';
                }
            }
            
        } catch (error) {
            debugLog('角色卡加载错误: ' + error.message);
            const container = document.getElementById('characters-list');
            if (container) {
                container.innerHTML = `<div class="empty-state">加载失败: ${error.message}</div>`;
            }
        }
    }
    
    // 加载快速回复列表
    async function loadQuickReplies() {
        try {
            debugLog('开始加载快速回复...');
            
            // 使用 SillyTavern 的快速回复扩展获取QR集
            const context = SillyTavern.getContext();
            let qrSets = [];
            
            // 从API获取QR集数据
            const response = await fetch('/api/settings/get', {
                method: 'POST',
                headers: context.getRequestHeaders(),
                body: JSON.stringify({}),
            });
            
            if (response.ok) {
                const data = await response.json();
                const quickReplyPresets = data.quickReplyPresets || [];
                
                qrSets = quickReplyPresets.map(set => ({
                    name: set.name || '未命名',
                    qrCount: set.qrList ? set.qrList.length : 0,
                    isDeleted: set.isDeleted || false,
                    version: set.version || 1
                })).filter(set => !set.isDeleted);
                
                debugLog(`从API获取到 ${qrSets.length} 个快速回复集`);
            } else {
                debugLog('API获取失败: ' + response.status);
            }
            
            debugLog(`最终找到 ${qrSets.length} 个快速回复集`);
            
            const container = document.getElementById('quickreplies-list');
            if (!container) return;
            
            container.innerHTML = '';
            
            if (qrSets.length === 0) {
                container.innerHTML = '<div class="empty-state">未找到快速回复集</div>';
                return;
            }
            
            qrSets.forEach(set => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'resource-item';
                itemDiv.innerHTML = `
                    <input type="checkbox" id="qrset-${set.name}" onchange="toggleQuickReply('${set.name}')">
                    <div class="resource-item-info">
                        <div class="resource-item-name">${set.name}</div>
                        <div class="resource-item-desc">${set.qrCount} 个回复</div>
                    </div>
                `;
                container.appendChild(itemDiv);
            });
            
        } catch (error) {
            debugLog('快速回复加载错误: ' + error.message);
            const container = document.getElementById('quickreplies-list');
            if (container) {
                container.innerHTML = `<div class="empty-state">加载失败: ${error.message}</div>`;
            }
        }
    }
    
    // 切换预设选择
    function togglePreset(name) {
        if (selectedPresets.includes(name)) {
            selectedPresets = selectedPresets.filter(n => n !== name);
        } else {
            selectedPresets.push(name);
        }
        debugLog(`预设选择: ${selectedPresets.length} 个`);
    }
    
    // 切换正则选择
    function toggleRegex(index) {
        if (selectedRegexes.includes(index)) {
            selectedRegexes = selectedRegexes.filter(n => n !== index);
        } else {
            selectedRegexes.push(index);
        }
        debugLog(`正则选择: ${selectedRegexes.length} 个`);
    }
    
    // 切换快速回复选择
    function toggleQuickReply(name) {
        if (selectedQuickReplies.includes(name)) {
            selectedQuickReplies = selectedQuickReplies.filter(n => n !== name);
        } else {
            selectedQuickReplies.push(name);
        }
        debugLog(`快速回复选择: ${selectedQuickReplies.length} 个`);
    }
    
    // 切换世界书选择
    function toggleWorldBook(name) {
        if (selectedWorldBooks.includes(name)) {
            selectedWorldBooks = selectedWorldBooks.filter(n => n !== name);
        } else {
            selectedWorldBooks.push(name);
        }
        debugLog(`世界书选择: ${selectedWorldBooks.length} 个`);
    }
    
    // 切换角色卡选择
    function toggleCharacter(name) {
        if (selectedCharacters.includes(name)) {
            selectedCharacters = selectedCharacters.filter(n => n !== name);
        } else {
            selectedCharacters.push(name);
        }
        debugLog(`角色卡选择: ${selectedCharacters.length} 个`);
    }
    
    // 创建打包文件
    async function createPackage() {
        if (selectedPresets.length === 0 && selectedRegexes.length === 0 && selectedQuickReplies.length === 0 && selectedWorldBooks.length === 0 && selectedCharacters.length === 0) {
            showStatus('请至少选择一个项目', 'error');
            return;
        }
        
        const packageName = document.getElementById('package-name').value.trim();
        if (!packageName) {
            showStatus('请输入包名称', 'error');
            return;
        }
        
        
        try {
            showStatus('生成打包文件...', 'info');
            showProgress(10);
            
            const packageObj = {
                name: packageName,
                created: new Date().toISOString(),
                presets: {},
                regexes: {},
                quick_reply_sets: {},
                world_books: {},
                characters: {}
            };
            
            // 打包预设
            const context = SillyTavern.getContext();
            const presetManager = context.getPresetManager();
            
            if (presetManager) {
                for (const presetName of selectedPresets) {
                    try {
                        // 使用 getCompletionPresetByName 获取预设的完整内容
                        const preset = presetManager.getCompletionPresetByName(presetName);
                        if (preset) {
                            
                            // 过滤掉API相关的设置
                            const filteredPreset = { ...preset };
                            const apiKeys = [
                                'api_server', 'preset', 'streaming', 'truncation_length', 'n',
                                'streaming_url', 'stopping_strings', 'can_use_tokenization',
                                'can_use_streaming', 'preset_settings_novel', 'preset_settings',
                                'streaming_novel', 'nai_preamble', 'model_novel', 'streaming_kobold',
                                'enabled', 'bind_to_context', 'seed', 'legacy_api', 'mancer_model',
                                'togetherai_model', 'ollama_model', 'vllm_model', 'aphrodite_model',
                                'server_urls', 'type', 'custom_model', 'bypass_status_check',
                                'infermaticai_model', 'dreamgen_model', 'openrouter_model',
                                'featherless_model', 'max_tokens_second', 'openrouter_providers',
                                'openrouter_allow_fallbacks', 'tabby_model', 'derived', 'generic_model',
                                'include_reasoning', 'global_banned_tokens', 'send_banned_tokens',
                                'auto_parse', 'add_to_prompts', 'auto_expand', 'show_hidden', 'max_additions',
                                'custom_url', 'api_url', 'base_url', 'endpoint_url', 'server_url'
                            ];
                            
                            // 删除API相关的键
                            apiKeys.forEach(key => {
                                if (filteredPreset.hasOwnProperty(key)) {
                                    delete filteredPreset[key];
                                }
                            });
                            
                            // 确保预设名称正确
                            filteredPreset.name = presetName;
                            
                            packageObj.presets[presetName] = filteredPreset;
                            debugLog(`已打包预设: ${presetName} (${Object.keys(filteredPreset).length} 个设置项)`);
                        } else {
                            debugLog(`预设 ${presetName} 未找到`);
                        }
                    } catch (error) {
                        debugLog(`预设 ${presetName} 打包失败: ${error.message}`);
                    }
                }
            } else {
                debugLog('预设管理器未找到，跳过预设打包');
            }
            showProgress(30);
            
            // 打包正则
            const regexSettings = SillyTavern.getContext().extensionSettings?.regex || [];
            
            for (const regexIndex of selectedRegexes) {
                const regex = regexSettings[regexIndex];
                if (regex) {
                    const finalName = regex.scriptName || `正则脚本 ${regexIndex + 1}`;
                    
                    packageObj.regexes[finalName] = {
                        ...regex,
                        scriptName: finalName
                    };
                    debugLog(`已打包正则: ${finalName}`);
                }
            }
            showProgress(60);
            
            // 打包快速回复
            const extensionSettings = context.extensionSettings || {};
            
            for (const setName of selectedQuickReplies) {
                try {
                    
                    // 从API获取快速回复集数据
                    const response = await fetch('/api/settings/get', {
                        method: 'POST',
                        headers: context.getRequestHeaders(),
                        body: JSON.stringify({}),
                    });
                    
                    let qrSet = null;
                    if (response.ok) {
                        const data = await response.json();
                        const quickReplyPresets = data.quickReplyPresets || [];
                        const presetData = quickReplyPresets.find(preset => preset.name === setName);
                        
                        if (presetData) {
                            qrSet = {
                                name: setName,
                                scope: presetData.scope || 'global',
                                disableSend: presetData.disableSend || false,
                                placeBeforeInput: presetData.placeBeforeInput || false,
                                injectInput: presetData.injectInput || false,
                                color: presetData.color || 'transparent',
                                onlyBorderColor: presetData.onlyBorderColor || false,
                                qrList: presetData.qrList ? presetData.qrList.map(qr => ({
                                    id: qr.id,
                                    label: qr.label,
                                    title: qr.title,
                                    message: qr.message,
                                    isHidden: qr.isHidden || false,
                                    executeOnStartup: qr.executeOnStartup || false,
                                    executeOnUser: qr.executeOnUser || false,
                                    executeOnAi: qr.executeOnAi || false,
                                    executeOnChatChange: qr.executeOnChatChange || false,
                                    executeOnGroupMemberDraft: qr.executeOnGroupMemberDraft || false,
                                    executeOnNewChat: qr.executeOnNewChat || false,
                                    executeBeforeGeneration: qr.executeBeforeGeneration || false,
                                    automationId: qr.automationId || '',
                                    contextList: qr.contextList || []
                                })) : []
                            };
                            debugLog(`从API获取快速回复集: ${setName} (${qrSet.qrList.length} 个回复)`);
                        }
                    }
                    
                    // 如果没有找到，创建一个基本的QR集结构
                    if (!qrSet) {
                        qrSet = {
                            name: setName,
                            scope: 'global',
                            disableSend: false,
                            placeBeforeInput: false,
                            injectInput: false,
                            color: 'transparent',
                            onlyBorderColor: false,
                            qrList: []
                        };
                        debugLog(`创建空快速回复集: ${setName}`);
                    }
                    
                    packageObj.quick_reply_sets[setName] = qrSet;
                    debugLog(`已打包快速回复集: ${setName} (${qrSet.qrList.length} 个回复)`);
                } catch (error) {
                    debugLog(`快速回复集 ${setName} 打包失败: ${error.message}`);
                }
            }
            showProgress(70);
            
            // 打包世界书
            for (const worldName of selectedWorldBooks) {
                try {
                    debugLog(`开始打包世界书: ${worldName}`);
                    
                    // 获取世界书数据 - 使用与加载时相同的方法
                    const worldResponse = await fetch('/api/worldinfo/get', {
                        method: 'POST',
                        headers: context.getRequestHeaders(),
                        body: JSON.stringify({ name: worldName }),
                    });
                    
                    debugLog(`世界书API响应状态: ${worldResponse.status}`);
                    
                    if (worldResponse.ok) {
                        const worldData = await worldResponse.json();
                        debugLog(`获取到世界书数据:`, worldData);
                        
                        // 确保世界书名称正确
                        const worldBookToSave = { ...worldData };
                        worldBookToSave.name = worldName;
                        
                        packageObj.world_books[worldName] = worldBookToSave;
                        debugLog(`已打包世界书: ${worldName} (${Object.keys(worldData.entries || {}).length} 个条目)`);
                    } else {
                        const errorText = await worldResponse.text();
                        debugLog(`世界书 ${worldName} 获取失败: ${worldResponse.status} - ${errorText}`);
                    }
                } catch (error) {
                    debugLog(`世界书 ${worldName} 打包失败: ${error.message}`);
                }
            }
            showProgress(80);
            
            // 打包角色卡（输出与原版一致的结构：直接为角色对象，扩展字段中包含 regex_scripts / TavernHelper_scripts / world 引用）
            for (const characterAvatar of selectedCharacters) {
                try {
                    debugLog(`开始打包角色卡: ${characterAvatar}`);
                    
                    // 获取角色卡完整数据
                    const characterResponse = await fetch('/api/characters/get', {
                        method: 'POST',
                        headers: context.getRequestHeaders(),
                        body: JSON.stringify({ avatar_url: characterAvatar }),
                    });
                    
                    debugLog(`角色卡API响应状态: ${characterResponse.status}`);
                    
                    if (characterResponse.ok) {
                        const characterData = await characterResponse.json();
                        debugLog(`获取到角色卡数据:`, characterData);
                        
                        // 确定最终名称
                        const originalName = characterData.name || characterData.data?.name || characterAvatar.replace('.png', '');
                        
                        // 直接输出角色对象（不使用 bound_* 包装）
                        const characterObject = { ...characterData };
                        characterObject.name = originalName;
                        if (!characterObject.data) characterObject.data = {};
                        characterObject.data.name = originalName;
                        if (!characterObject.data.extensions) characterObject.data.extensions = {};
                        
                        // 保留世界书引用，不打包到 bound_*
                        const worldName = characterData.data?.extensions?.world || characterData.extensions?.world;
                        if (worldName) {
                            debugLog(`角色卡 ${originalName} 绑定了世界书: ${worldName}`);
                            // 角色卡内部绑定的世界书引用保持原名称
                            characterObject.data.extensions.world = worldName;
                        }
                        
                        // 写入正则脚本到扩展字段（不使用 bound_*）
                        const regexScripts = characterData.data?.extensions?.regex_scripts || characterData.extensions?.regex_scripts || [];
                        if (regexScripts.length > 0) {
                            debugLog(`角色卡 ${originalName} 包含 ${regexScripts.length} 个正则脚本`);
                            // 角色卡内部绑定的正则脚本保持原名称
                            characterObject.data.extensions.regex_scripts = regexScripts;
                            debugLog(`已写入 regex_scripts 至角色扩展: ${regexScripts.length} 个`);
                        }
                        
                        // 写入 TavernHelper 脚本到扩展字段（不使用 bound_*）
                        const tavernHelperScripts = characterData.data?.extensions?.TavernHelper_scripts || characterData.extensions?.TavernHelper_scripts || [];
                        if (tavernHelperScripts.length > 0) {
                            debugLog(`角色卡 ${originalName} 包含 ${tavernHelperScripts.length} 个TavernHelper脚本`);
                            // 角色卡内部绑定的TavernHelper脚本保持原名称
                            characterObject.data.extensions.TavernHelper_scripts = tavernHelperScripts;
                            debugLog(`已写入 TavernHelper_scripts 至角色扩展: ${tavernHelperScripts.length} 个`);
                        }
                        
                        // 注意：角色卡不绑定快速回复集，跳过快速回复集打包
                        
                        packageObj.characters[originalName] = characterObject;
                        debugLog(`已打包完整角色卡: ${originalName} (regex_scripts: ${characterObject.data?.extensions?.regex_scripts?.length || 0}, TavernHelper_scripts: ${characterObject.data?.extensions?.TavernHelper_scripts?.length || 0})`);
                    } else {
                        const errorText = await characterResponse.text();
                        debugLog(`角色卡 ${characterAvatar} 获取失败: ${characterResponse.status} - ${errorText}`);
                    }
                } catch (error) {
                    debugLog(`角色卡 ${characterAvatar} 打包失败: ${error.message}`);
                }
            }
            showProgress(90);
            
            // 生成并下载文件
            const jsonStr = JSON.stringify(packageObj, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = packageName + '.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showProgress(100);
            showStatus('打包完成', 'success');
            debugLog(`打包完成: ${Object.keys(packageObj.presets).length} 预设, ${Object.keys(packageObj.regexes).length} 正则, ${Object.keys(packageObj.quick_reply_sets).length} 快速回复集, ${Object.keys(packageObj.world_books).length} 世界书, ${Object.keys(packageObj.characters).length} 角色卡`);
            
        } catch (error) {
            showProgress(100);
            showStatus('打包失败: ' + error.message, 'error');
            debugLog('打包错误: ' + error.stack);
        }
    }
    
    // 触发文件选择
    function triggerFileSelect() {
        debugLog('触发文件选择');
        const fileInput = document.getElementById('package-file');
        if (fileInput) {
            fileInput.click();
        } else {
            debugLog('文件输入元素未找到');
        }
    }
    
    // 处理文件选择
    function handleFileSelect(event) {
        debugLog('handleFileSelect 被调用', event);
        const file = event.target.files[0];
        if (!file) {
            debugLog('未选择文件');
            return;
        }
        
        debugLog(`选择文件: ${file.name}`);
        event.target.value = '';
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                packageData = JSON.parse(e.target.result);
                debugLog('文件解析成功');
                displayPackageInfo(packageData);
            } catch (error) {
                showStatus('文件格式错误', 'error');
                debugLog('解析错误: ' + error.message);
                packageData = null;
                const packageInfo = document.getElementById('package-info');
                if (packageInfo) {
                    packageInfo.style.display = 'none';
                }
            }
        };
        
        reader.onerror = function() {
            showStatus('文件读取失败', 'error');
            debugLog('读取错误');
        };
        
        reader.readAsText(file);
    }
    
    // 显示包信息
    function displayPackageInfo(data) {
        const detailsEl = document.getElementById('package-details');
        if (!detailsEl) return;
        
        let html = `<p><strong>名称:</strong> ${data.name || '未知'}</p>`;
        html += `<p><strong>创建:</strong> ${data.created ? new Date(data.created).toLocaleString() : '未知'}</p>`;
        html += `<p><strong>预设:</strong> ${data.presets ? Object.keys(data.presets).length : 0} 个</p>`;
        html += `<p><strong>正则:</strong> ${data.regexes ? Object.keys(data.regexes).length : 0} 个</p>`;
        html += `<p><strong>快速回复集:</strong> ${data.quick_reply_sets ? Object.keys(data.quick_reply_sets).length : 0} 个</p>`;
        html += `<p><strong>世界书:</strong> ${data.world_books ? Object.keys(data.world_books).length : 0} 个</p>`;
        html += `<p><strong>角色卡:</strong> ${data.characters ? Object.keys(data.characters).length : 0} 个</p>`;
        
        detailsEl.innerHTML = html;
        const packageInfo = document.getElementById('package-info');
        if (packageInfo) {
            packageInfo.style.display = 'block';
        }
        debugLog(`包信息: ${Object.keys(data.presets || {}).length} 预设, ${Object.keys(data.regexes || {}).length} 正则, ${Object.keys(data.quick_reply_sets || {}).length} 快速回复集, ${Object.keys(data.world_books || {}).length} 世界书, ${Object.keys(data.characters || {}).length} 角色卡`);
    }
    
    // 导入包
    async function importPackage() {
        if (!packageData) {
            showStatus('请先选择文件', 'error');
            return;
        }
        
        try {
            showStatus('导入中...', 'info');
            let totalItems = (packageData.presets ? Object.keys(packageData.presets).length : 0) + 
                             (packageData.regexes ? Object.keys(packageData.regexes).length : 0) +
                             (packageData.quick_reply_sets ? Object.keys(packageData.quick_reply_sets).length : 0) +
                             (packageData.world_books ? Object.keys(packageData.world_books).length : 0) +
                             (packageData.characters ? Object.keys(packageData.characters).length : 0);
            let importedCount = 0;
            
            // 保护：记录导入前的全局世界书启用列表，导入后恢复，避免无关世界被设为全局
            const context = SillyTavern.getContext();
            let originalGlobalWorlds = [];
            try {
                const settingsResp = await fetch('/api/settings/get', {
                    method: 'POST',
                    headers: context.getRequestHeaders(),
                    body: JSON.stringify({}),
                });
                if (settingsResp.ok) {
                    const data = await settingsResp.json();
                    originalGlobalWorlds = data?.world_info?.globalSelect || [];
                    debugLog(`导入前全局世界启用数: ${originalGlobalWorlds.length}`);
                }
            } catch (e) {
                debugLog(`获取导入前世界选择失败: ${e.message}`);
            }
            
            // 导入预设
            if (packageData.presets) {
                const context = SillyTavern.getContext();
                const presetManager = context.getPresetManager();
                const presetEntries = Object.entries(packageData.presets);
                
                if (presetManager) {
                    for (let i = 0; i < presetEntries.length; i++) {
                        const [name, preset] = presetEntries[i];
                        try {
                            showStatus(`正在导入 预设：${i + 1}/${presetEntries.length}`, 'info');
                            
                            // 确保预设名称正确
                            const presetToSave = { ...preset };
                            presetToSave.name = name;
                            
                            await presetManager.savePreset(name, presetToSave, { skipUpdate: true });
                            debugLog(`预设导入: ${name} (${Object.keys(presetToSave).length} 个设置项)`);
                            importedCount++;
                        } catch (error) {
                            debugLog(`预设 ${name} 导入失败: ${error.message}`);
                        }
                    }
                } else {
                    debugLog('预设管理器未找到，跳过预设导入');
                }
            }
            
            // 导入正则
            if (packageData.regexes && Object.keys(packageData.regexes).length > 0) {
                debugLog('开始导入全局正则...');
                debugLog(`发现 ${Object.keys(packageData.regexes).length} 个全局正则需要导入`);
                const regexEntries = Object.entries(packageData.regexes);
                
                // 批量处理正则，避免频繁保存设置
                const context = SillyTavern.getContext();
                const regexSettings = context.extensionSettings?.regex || [];
                const newRegexSettings = [...regexSettings];
                let regexImportCount = 0;
                
                for (let i = 0; i < regexEntries.length; i++) {
                    const [name, regex] = regexEntries[i];
                    
                    try {
                        showStatus(`正在导入 正则：${i + 1}/${regexEntries.length}`, 'info');
                        
                        // 为导入的正则生成新的唯一ID，避免与现有正则冲突
                        const regexWithNewId = {
                            ...regex,
                            id: crypto.randomUUID ? crypto.randomUUID() : 'regex_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
                        };
                        
                        // 检查是否已存在相同名称的正则
                        const existingIndex = newRegexSettings.findIndex(r => r.scriptName === name);
                        if (existingIndex >= 0) {
                            newRegexSettings[existingIndex] = regexWithNewId;
                            debugLog(`正则更新: ${name} (新ID: ${regexWithNewId.id})`);
                        } else {
                            newRegexSettings.push(regexWithNewId);
                            debugLog(`正则导入: ${name} (新ID: ${regexWithNewId.id})`);
                        }
                        
                        regexImportCount++;
                        debugLog(`正则 ${name} 导入成功`);
                    } catch (error) {
                        debugLog(`正则 ${name} 导入失败: ${error.message}`);
                        debugLog(`正则导入错误详情:`, error);
                        // 失败时不增加计数
                    }
                }
                
                // 批量更新全局正则设置（只保存一次）
                if (regexImportCount > 0) {
                    try {
                        // 直接修改 SillyTavern 的扩展设置，这种方式会自动保存
                        context.extensionSettings.regex = newRegexSettings;
                        debugLog(`已更新 ${regexImportCount} 个正则到 extensionSettings.regex`);
                        
                        // 正则设置已通过直接修改 extensionSettings 自动保存
                        importedCount += regexImportCount;
                        debugLog(`正则设置已自动保存，计入成功计数: ${regexImportCount} 个`);
                    } catch (saveError) {
                        debugLog(`批量保存正则设置失败: ${saveError.message}`);
                    }
                } else {
                    debugLog('没有正则需要导入');
                }
                
                debugLog(`全局正则导入完成，共导入 ${regexImportCount} 个正则`);
                
                // 等待一下确保正则设置完全保存
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            // 导入快速回复 - 使用slash命令系统
            if (packageData.quick_reply_sets) {
                debugLog('开始使用slash命令系统导入快速回复集...');
                const qrEntries = Object.entries(packageData.quick_reply_sets);
                
                for (let i = 0; i < qrEntries.length; i++) {
                    const [setName, qrSet] = qrEntries[i];
                    try {
                        showStatus(`正在导入 快速回复集：${i + 1}/${qrEntries.length}`, 'info');
                        debugLog(`准备导入快速回复集: ${setName}`);
                        
                        // 构建slash命令序列
                        let slashCommands = '';
                        
                        // 1. 启用严格转义
                        slashCommands += '/parser-flag STRICT_ESCAPING on ||\n';
                        
                        // 2. 创建新的快速回复集（不删除原有的，与预设和正则保持一致）
                        slashCommands += `/qr-set-create nosend=${qrSet.disableSend || false} before=${qrSet.placeBeforeInput || false} inject=${qrSet.injectInput || false} ${setName} ||\n`;
                        
                        // 3. 创建快速回复项
                        if (qrSet.qrList && qrSet.qrList.length > 0) {
                            for (const qr of qrSet.qrList) {
                                // 转义消息内容
                                const escapedMessage = (qr.message || '')
                                    .replace(/"/g, '\\"')
                                    .replace(/<user>/g, '{{user}}')
                                    .replace(/<char>/g, '{{char}}')
                                    .replace(/\{\{/g, '\\{\\{');
                                
                                // 构建qr-create命令
                                slashCommands += `/qr-create set=${setName} label="${qr.label || ''}" `;
                                
                                // 添加可选参数
                                if (qr.icon) slashCommands += `icon=${qr.icon} `;
                                slashCommands += `showlabel=${qr.showLabel !== false} `;
                                slashCommands += `hidden=${qr.isHidden || false} `;
                                slashCommands += `startup=${qr.executeOnStartup || false} `;
                                slashCommands += `user=${qr.executeOnUser || false} `;
                                slashCommands += `bot=${qr.executeOnAi || false} `;
                                slashCommands += `load=${qr.executeOnChatChange || false} `;
                                slashCommands += `new=${qr.executeOnNewChat || false} `;
                                slashCommands += `group=${qr.executeOnGroupMemberDraft || false} `;
                                slashCommands += `generation=${qr.executeBeforeGeneration || false} `;
                                if (qr.title && qr.title.trim()) {
                                    slashCommands += `title="${qr.title}" `;
                                }
                                slashCommands += `"${escapedMessage}" ||\n`;
                            }
                            
                            // 4. 添加上下文菜单项
                            for (const qr of qrSet.qrList) {
                                if (qr.contextList && qr.contextList.length > 0) {
                                    for (const context of qr.contextList) {
                                        slashCommands += `/qr-contextadd set=${setName} label=${qr.label || ''} id=${qr.id || 0} chain=${context.isChained || false} "${context.set || ''}" ||\n`;
                                    }
                                }
                            }
                        }
                        
                        // 5. 关闭严格转义
                        slashCommands += '/parser-flag STRICT_ESCAPING off ||\n';
                        
                        debugLog(`执行slash命令序列:\n${slashCommands}`);
                        debugLog(`快速回复集 ${setName} 包含 ${qrSet.qrList ? qrSet.qrList.length : 0} 个回复`);
                        if (qrSet.qrList && qrSet.qrList.length > 0) {
                            qrSet.qrList.forEach((qr, index) => {
                                debugLog(`回复 ${index + 1}: label="${qr.label}", title="${qr.title}", message="${qr.message}"`);
                            });
                        }
                        
                        // 执行slash命令序列 - 使用更安全的方式
                        try {
                            // 确保在聊天界面执行slash命令
                            const chatTextarea = document.querySelector('#send_textarea');
                            if (!chatTextarea) {
                                throw new Error('未找到聊天输入框，无法执行slash命令');
                            }
                            
                            // 清空输入框
                            chatTextarea.value = '';
                            chatTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                            
                            // 逐行执行命令，避免堆积
                            const commands = slashCommands.split('||\n').filter(cmd => cmd.trim());
                            for (let j = 0; j < commands.length; j++) {
                                const command = commands[j].trim();
                                if (command) {
                                    debugLog(`执行命令 ${j + 1}/${commands.length}: ${command.substring(0, 50)}...`);
                                    
                                    // 设置命令到输入框
                                    chatTextarea.value = command;
                                    chatTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                                    
                                    // 触发发送
                                    const sendButton = document.querySelector('#send_but');
                                    if (sendButton && !sendButton.disabled) {
                                        sendButton.click();
                                    } else {
                                        // 使用Enter键发送
                                        chatTextarea.dispatchEvent(new KeyboardEvent('keydown', {
                                            key: 'Enter',
                                            code: 'Enter',
                                            keyCode: 13,
                                            which: 13,
                                            bubbles: true
                                        }));
                                    }
                                    
                                    // 等待命令执行完成
                                    await new Promise(resolve => setTimeout(resolve, 300));
                                }
                            }
                            
                            // 清空输入框
                            chatTextarea.value = '';
                            chatTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                            
                            debugLog(`slash命令序列执行完成: ${setName}`);
                        } catch (slashError) {
                            debugLog(`slash命令执行失败: ${slashError.message}`);
                            throw slashError;
                        }
                        
                        // 等待一下让快速回复集有时间正确创建
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        // 验证快速回复集是否创建成功
                        let verificationSuccess = false;
                        try {
                            // 检查QuickReplySet.list中是否存在该集
                            if (window.QuickReplySet && window.QuickReplySet.list) {
                                const createdSet = window.QuickReplySet.list.find(set => set.name === setName);
                                if (createdSet) {
                                    verificationSuccess = true;
                                    debugLog(`验证成功: 快速回复集 ${setName} 已创建，包含 ${createdSet.qrList ? createdSet.qrList.length : 0} 个回复`);
                                } else {
                                    debugLog(`验证失败: 快速回复集 ${setName} 未在QuickReplySet.list中找到`);
                                }
                            } else {
                                debugLog('无法验证: QuickReplySet.list不存在');
                                verificationSuccess = true; // 假设成功，因为无法验证
                            }
                        } catch (verifyError) {
                            debugLog(`验证过程出错: ${verifyError.message}`);
                            verificationSuccess = true; // 假设成功，避免验证错误影响导入
                        }
                        
                        if (verificationSuccess) {
                            debugLog(`快速回复集 ${setName} 导入成功`);
                            importedCount++;
                        } else {
                            debugLog(`快速回复集 ${setName} 导入可能失败，但继续处理其他集`);
                        }
                        
                    } catch (error) {
                        debugLog(`快速回复集 ${setName} 导入失败: ${error.message}`);
                    }
                }
                
                debugLog(`快速回复集导入完成，共导入 ${Object.keys(packageData.quick_reply_sets).length} 个集`);
                
                // 等待一下确保快速回复集完全创建
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            // 导入世界书
            if (packageData.world_books) {
                debugLog('开始导入世界书...');
                debugLog(`发现 ${Object.keys(packageData.world_books).length} 个世界书需要导入`);
                const worldEntries = Object.entries(packageData.world_books);
                
                for (let i = 0; i < worldEntries.length; i++) {
                    const [worldName, worldData] = worldEntries[i];
                    try {
                        showStatus(`正在导入 世界书：${i + 1}/${worldEntries.length}`, 'info');
                        debugLog(`准备导入世界书: ${worldName}`);
                        debugLog(`世界书条目数量: ${Object.keys(worldData.entries || {}).length}`);
                        
                        // 使用API直接创建/更新世界书
                        const editResponse = await fetch('/api/worldinfo/edit', {
                            method: 'POST',
                            headers: context.getRequestHeaders(),
                            body: JSON.stringify({ name: worldName, data: worldData }),
                        });
                        
                        if (editResponse.ok) {
                            const result = await editResponse.json();
                            debugLog(`世界书 ${worldName} 导入成功:`, result);
                            importedCount++;
                        } else {
                            const errorText = await editResponse.text();
                            debugLog(`世界书 ${worldName} 导入失败: ${editResponse.status} - ${errorText}`);
                        }
                        
                    } catch (error) {
                        debugLog(`世界书 ${worldName} 导入失败: ${error.message}`);
                        debugLog(`错误堆栈:`, error.stack);
                    }
                }
                
                debugLog(`世界书导入完成，共导入 ${Object.keys(packageData.world_books).length} 个世界书`);
            } else {
                debugLog('没有发现世界书数据需要导入');
            }
            
            // 导入角色卡（完整JSON格式，包含绑定的世界书和正则）
            if (packageData.characters) {
                debugLog('开始导入角色卡...');
                debugLog(`发现 ${Object.keys(packageData.characters).length} 个角色卡需要导入`);
                
                // 确保context变量可用
                const context = SillyTavern.getContext();
                debugLog('Context获取成功:', context);
                
                const characterEntries = Object.entries(packageData.characters);
                for (let i = 0; i < characterEntries.length; i++) {
                    const [characterName, characterPackage] = characterEntries[i];
                    try {
                        debugLog(`准备导入角色卡: ${characterName}`);
                        showStatus(`正在导入 角色卡：${i + 1}/${characterEntries.length}`, 'info');
                        
                        // 检查是否是新的完整格式（包含character字段）
                        const characterData = characterPackage.character || characterPackage;
                        const isNewFormat = characterPackage.character !== undefined;
                        
                        if (isNewFormat) {
                            debugLog(`检测到完整格式角色卡包，包含绑定内容`);
                            debugLog(`绑定世界书: ${characterPackage.bound_worldbooks?.length || 0} 个`);
                            debugLog(`绑定正则: ${characterPackage.bound_regexes?.length || 0} 个`);
                            debugLog(`TavernHelper脚本: ${characterPackage.bound_tavernhelper_scripts?.length || 0} 个`);
                        }
                        
                        // 跳过世界书的立即导入，保留原生点击角色后由酒馆弹窗接管导入
                        
                        // 暂存正则脚本数据，在角色卡创建后处理
                        let pendingRegexScripts = [];
                        if (isNewFormat && characterPackage.bound_regexes) {
                            debugLog(`准备导入 ${characterPackage.bound_regexes.length} 个正则脚本到局部正则分类`);
                            pendingRegexScripts = characterPackage.bound_regexes.map(regexData => ({
                                ...regexData,
                                id: crypto.randomUUID ? crypto.randomUUID() : 'regex_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
                            }));
                        }
                        
                        // 注意：角色卡不绑定快速回复集，跳过快速回复集导入
                        
                        // 注意：TavernHelper脚本由酒馆助手扩展自己处理，不需要手动导入
                        // 酒馆助手扩展会监听角色卡导入，自动处理TavernHelper_scripts字段
                        
                        // 现在导入角色卡本身
                        debugLog('使用API创建角色卡');
                        
                        // 构建角色卡数据，确保格式正确，包含所有字段
                        const characterToImport = {
                            ch_name: characterData.name || characterData.data?.name || characterName,
                            description: characterData.data?.description || characterData.description || '',
                            personality: characterData.data?.personality || characterData.personality || '',
                            scenario: characterData.data?.scenario || characterData.scenario || '',
                            first_mes: characterData.data?.first_mes || characterData.first_mes || '',
                            mes_example: characterData.data?.mes_example || characterData.mes_example || '',
                            creator_notes: characterData.data?.creator_notes || characterData.creatorcomment || '',
                            creator: characterData.data?.creator || characterData.creator || '',
                            tags: characterData.data?.tags || characterData.tags || [],
                            talkativeness: characterData.data?.extensions?.talkativeness || characterData.talkativeness || 0.5,
                            create_date: characterData.create_date || new Date().toISOString(),
                            chat: characterData.chat || `${characterName} - ${new Date().toISOString()}`,
                            // 添加额外开场白
                            alternate_greetings: characterData.data?.alternate_greetings || characterData.alternate_greetings || [],
                            // 添加系统提示词
                            system_prompt: characterData.data?.system_prompt || characterData.system_prompt || '',
                            // 添加历史后指令
                            post_history_instructions: characterData.data?.post_history_instructions || characterData.post_history_instructions || '',
                            // 添加角色版本
                            character_version: characterData.data?.character_version || characterData.character_version || '',
                            // 添加组专用开场白
                            group_only_greetings: characterData.data?.group_only_greetings || characterData.group_only_greetings || [],
                            // 添加扩展字段（世界书、正则等）
                            extensions: characterData.data?.extensions || characterData.extensions || {},
                            // 添加角色书（内置世界书）
                            character_book: characterData.data?.character_book || characterData.character_book || null,
                            // 添加世界书引用（外部世界书）
                            world: characterData.data?.extensions?.world || characterData.extensions?.world || '',
                            // 添加深度提示
                            depth_prompt_prompt: characterData.data?.extensions?.depth_prompt?.prompt || characterData.extensions?.depth_prompt?.prompt || '',
                            depth_prompt_depth: characterData.data?.extensions?.depth_prompt?.depth || characterData.extensions?.depth_prompt?.depth || 4,
                            depth_prompt_role: characterData.data?.extensions?.depth_prompt?.role || characterData.extensions?.depth_prompt?.role || 'system'
                        };
                        
                        // 检查世界书绑定情况
                        const hasCharacterBook = characterToImport.character_book && characterToImport.character_book.entries && characterToImport.character_book.entries.length > 0;
                        const hasWorldReference = characterToImport.world && characterToImport.world.trim() !== '';
                        
                        debugLog(`角色卡世界书绑定检查: character_book=${hasCharacterBook ? '有' : '无'}, world引用=${hasWorldReference ? characterToImport.world : '无'}`);
                        
                        // 检查外部世界书引用是否在包内存在
                        if (hasWorldReference) {
                            const referencedWorld = characterToImport.world;
                            const worldExistsInPackage = packageData.world_books && packageData.world_books[referencedWorld];
                            if (!worldExistsInPackage) {
                                debugLog(`警告: 角色卡引用的外部世界书 "${referencedWorld}" 在包内不存在，可能导致绑定失效`);
                            } else {
                                debugLog(`确认: 角色卡引用的外部世界书 "${referencedWorld}" 在包内存在`);
                            }
                        }
                        
                        // 添加头像文件名到导入数据
                        if (characterData.avatar && characterData.avatar !== 'none') {
                            characterToImport.file_name = characterData.avatar.replace('.png', '');
                        }
                        
                        debugLog(`角色卡导入数据:`, {
                            name: characterToImport.ch_name,
                            alternate_greetings_count: characterToImport.alternate_greetings?.length || 0,
                            extensions: characterToImport.extensions,
                            character_book: characterToImport.character_book ? '存在' : '不存在',
                            world: characterToImport.world,
                            avatar: characterToImport.file_name || '默认头像'
                        });
                        
                        // 使用create API创建角色卡，添加超时处理
                        debugLog(`开始创建角色卡: ${characterName}`);
                        const createResponse = await Promise.race([
                            fetch('/api/characters/create', {
                                method: 'POST',
                                headers: context.getRequestHeaders(),
                                body: JSON.stringify(characterToImport),
                            }),
                            new Promise((_, reject) => 
                                setTimeout(() => reject(new Error('角色卡创建超时')), 30000)
                            )
                        ]);
                        
                        debugLog(`角色卡创建API响应状态: ${createResponse.status}`);
                        
                        if (createResponse.ok) {
                            const result = await createResponse.text();
                            debugLog(`角色卡 ${characterName} 导入成功:`, result);
                            importedCount++;

                            // 等待一下让角色卡完全创建
                            await new Promise(resolve => setTimeout(resolve, 500));

                            // 重新获取角色列表，找到 avatar（writeExtensionField 需要 avatar）
                            let createdAvatar = '';
                            try {
                                const charactersResponse = await fetch('/api/characters/all', {
                                    method: 'POST',
                                    headers: context.getRequestHeaders(),
                                    body: JSON.stringify({}),
                                });
                                if (charactersResponse.ok) {
                                    const charactersData = await charactersResponse.json();
                                    const list = charactersData.characters || charactersData || [];
                                    const found = list.find(c => (c.name === characterToImport.ch_name) || (c.data?.name === characterToImport.ch_name));
                                    if (found && found.avatar && found.avatar !== 'none') {
                                        createdAvatar = found.avatar;
                                    }
                                }
                            } catch (lookupErr) {
                                debugLog(`获取新角色头像失败: ${lookupErr.message}`);
                            }

                            // 二次处理：将包内的局部正则、酒馆助手脚本、角色书，写入角色扩展字段
                            try {
                                const pkgCharacterData = characterData; // 来自包的原始角色数据
                                const scopedRegex = pkgCharacterData?.data?.extensions?.regex_scripts || [];
                                const helperScripts = pkgCharacterData?.data?.extensions?.TavernHelper_scripts || [];
                                const characterBook = pkgCharacterData?.data?.character_book || null;

                                // 仅当找到 avatar 时才调用合并接口
                                if (createdAvatar) {
                                    // 写入局部正则
                                    if (Array.isArray(scopedRegex) && scopedRegex.length > 0) {
                                        const payload = {
                                            avatar: createdAvatar,
                                            data: { extensions: { regex_scripts: scopedRegex } },
                                        };
                                        const mergeResp = await fetch('/api/characters/merge-attributes', {
                                            method: 'POST',
                                            headers: context.getRequestHeaders(),
                                            body: JSON.stringify(payload),
                                        });
                                        if (mergeResp.ok) debugLog(`已写入局部正则 ${scopedRegex.length} 个到角色`);
                                        else debugLog(`写入局部正则失败: ${mergeResp.status}`);
                                    }

                                    // 写入TavernHelper脚本
                                    if (Array.isArray(helperScripts) && helperScripts.length > 0) {
                                        const payload2 = {
                                            avatar: createdAvatar,
                                            data: { extensions: { TavernHelper_scripts: helperScripts } },
                                        };
                                        const mergeResp2 = await fetch('/api/characters/merge-attributes', {
                                            method: 'POST',
                                            headers: context.getRequestHeaders(),
                                            body: JSON.stringify(payload2),
                                        });
                                        if (mergeResp2.ok) debugLog(`已写入TavernHelper局部脚本 ${helperScripts.length} 个到角色`);
                                        else debugLog(`写入TavernHelper脚本失败: ${mergeResp2.status}`);
                                    }

                                    // 写入角色书（character_book）
                                    if (characterBook && characterBook.entries && characterBook.entries.length > 0) {
                                        const payload3 = {
                                            avatar: createdAvatar,
                                            data: { character_book: characterBook },
                                        };
                                        const mergeResp3 = await fetch('/api/characters/merge-attributes', {
                                            method: 'POST',
                                            headers: context.getRequestHeaders(),
                                            body: JSON.stringify(payload3),
                                        });
                                        if (mergeResp3.ok) debugLog(`已写入角色书 ${characterBook.entries.length} 个条目到角色`);
                                        else debugLog(`写入角色书失败: ${mergeResp3.status}`);
                                    }
                                } else {
                                    debugLog('未获取到新角色的avatar，跳过局部正则、脚本与角色书写入');
                                }
                            } catch (scopedErr) {
                                debugLog(`写入局部正则/脚本/角色书出错: ${scopedErr.message}`);
                            }
                        } else {
                            const errorText = await createResponse.text();
                            debugLog(`角色卡 ${characterName} 导入失败: ${createResponse.status} - ${errorText}`);
                            showStatus(`角色卡 ${characterName} 导入失败: ${createResponse.status}`, 'error');
                            // 继续处理下一个角色卡，不中断整个导入流程
                        }
                        
                    } catch (error) {
                        debugLog(`角色卡 ${characterName} 导入失败: ${error.message}`);
                        debugLog(`错误堆栈:`, error.stack);
                        showStatus(`角色卡 ${characterName} 导入异常: ${error.message}`, 'error');
                    }
                }
                
                debugLog(`角色卡导入完成，共导入 ${Object.keys(packageData.characters).length} 个角色卡`);
            } else {
                debugLog('没有发现角色卡数据需要导入');
            }
            
            // 恢复导入前的全局世界书选择
            try {
                if (Array.isArray(originalGlobalWorlds)) {
                    const restoreResponse = await fetch('/api/settings/set', {
                        method: 'POST',
                        headers: context.getRequestHeaders(),
                        body: JSON.stringify({
                            world_info: { globalSelect: originalGlobalWorlds }
                        }),
                    });
                    
                    if (restoreResponse.ok) {
                        debugLog('已恢复导入前的全局世界书启用列表');
                    } else {
                        debugLog(`恢复全局世界书启用列表失败: ${restoreResponse.status} ${restoreResponse.statusText}`);
                    }
                }
            } catch (e) {
                debugLog(`恢复全局世界书启用列表失败: ${e.message}`);
                // 这个错误不影响导入结果，只是无法完全恢复全局世界书状态
            }

            showProgress(100);
            
            // 详细统计各模块导入情况
            const presetCount = packageData.presets ? Object.keys(packageData.presets).length : 0;
            const regexCount = packageData.regexes ? Object.keys(packageData.regexes).length : 0;
            const qrCount = packageData.quick_reply_sets ? Object.keys(packageData.quick_reply_sets).length : 0;
            const worldCount = packageData.world_books ? Object.keys(packageData.world_books).length : 0;
            const charCount = packageData.characters ? Object.keys(packageData.characters).length : 0;
            const totalExpected = presetCount + regexCount + qrCount + worldCount + charCount;
            
            debugLog(`导入统计详情:`);
            debugLog(`- 预设: ${presetCount} 个`);
            debugLog(`- 正则: ${regexCount} 个`);
            debugLog(`- 快速回复集: ${qrCount} 个`);
            debugLog(`- 世界书: ${worldCount} 个`);
            debugLog(`- 角色卡: ${charCount} 个`);
            debugLog(`- 总计预期: ${totalExpected} 个`);
            debugLog(`- 实际导入: ${importedCount} 个`);
            
            showStatus(`导入完成！成功导入 ${importedCount} 个项目，即将自动刷新页面`, 'success');
            debugLog('导入完成');
            
            // 导入成功后自动刷新页面
            setTimeout(() => {
                debugLog('准备刷新页面...');
                window.location.reload();
            }, 5000); // 5秒后刷新，让用户看到成功消息
            
            packageData = null;
            const packageFile = document.getElementById('package-file');
            const packageInfo = document.getElementById('package-info');
            if (packageFile) packageFile.value = '';
            if (packageInfo) packageInfo.style.display = 'none';
            
        } catch (error) {
            showProgress(100);
            showStatus('导入失败: ' + error.message, 'error');
            debugLog('导入错误: ' + error.stack);
        }
    }
    
    // 加载所有资源
    async function loadAllResources() {
        showProgress(10);
        
        await loadPresets();
        showProgress(20);
        
        await loadRegexes();
        showProgress(40);
        
        await loadQuickReplies();
        showProgress(60);
        
        await loadWorldBooks();
        showProgress(80);
        
        await loadCharacters();
        showProgress(100);
    }
    
    // 初始化函数
    function initializePresetHelper() {
        debugLog('打包助手初始化完成');
        
        // 将函数暴露到全局作用域
        window.switchPresetTab = switchPresetTab;
        window.switchResourceTab = switchResourceTab;
        window.togglePreset = togglePreset;
        window.toggleRegex = toggleRegex;
        window.toggleQuickReply = toggleQuickReply;
        window.toggleWorldBook = toggleWorldBook;
        window.toggleCharacter = toggleCharacter;
        window.createPackage = createPackage;
        window.handleFileSelect = handleFileSelect;
        window.triggerFileSelect = triggerFileSelect;
        window.importPackage = importPackage;
        
        
        // 加载资源
        loadAllResources();
    }
    
    // 等待 DOM 加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePresetHelper);
    } else {
        initializePresetHelper();
    }
    
})();

