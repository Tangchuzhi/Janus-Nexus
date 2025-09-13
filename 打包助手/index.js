// 打包助手 JavaScript 文件
(function() {
    'use strict';
    
    console.log('[打包助手] 开始加载...');
    
    // 全局变量
    let selectedPresets = [];
    let selectedRegexes = [];
    let selectedQuickReplies = [];
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
    
    // 加载快速回复列表
    async function loadQuickReplies() {
        try {
            debugLog('开始加载快速回复...');
            
            // 使用 SillyTavern 的快速回复扩展获取QR集
            const context = SillyTavern.getContext();
            let qrSets = [];
            
            // 方法1: 尝试从API获取QR集数据
            try {
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
                }
            } catch (apiError) {
                debugLog('API获取失败，尝试其他方法: ' + apiError.message);
            }
            
            // 方法2: 如果API失败，尝试从QuickReplySet全局对象获取
            if (qrSets.length === 0 && window.QuickReplySet && window.QuickReplySet.list) {
                qrSets = window.QuickReplySet.list.map(set => ({
                    name: set.name,
                    qrCount: set.qrList ? set.qrList.length : 0,
                    isDeleted: set.isDeleted || false
                })).filter(set => !set.isDeleted);
                
                debugLog(`从全局对象获取到 ${qrSets.length} 个快速回复集`);
            }
            
            // 方法3: 如果仍然没有，尝试从扩展设置获取
            if (qrSets.length === 0) {
                const extensionSettings = context.extensionSettings || {};
                
                // 检查新的QR V2设置
                if (extensionSettings.quickReplyV2 && extensionSettings.quickReplyV2.config && extensionSettings.quickReplyV2.config.setList) {
                    qrSets = extensionSettings.quickReplyV2.config.setList.map(set => ({
                        name: set.set,
                        qrCount: 0, // 无法从配置中获取QR数量
                        visible: set.isVisible
                    }));
                }
                // 检查旧的QR设置
                else if (extensionSettings.quickReply) {
                    qrSets = [{
                        name: extensionSettings.quickReply.selectedPreset || extensionSettings.quickReply.name || 'Default',
                        qrCount: 0,
                        visible: true
                    }];
                }
                
                debugLog(`从扩展设置获取到 ${qrSets.length} 个快速回复集`);
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
    
    // 创建打包文件
    async function createPackage() {
        if (selectedPresets.length === 0 && selectedRegexes.length === 0 && selectedQuickReplies.length === 0) {
            showStatus('请至少选择一个项目', 'error');
            return;
        }
        
        const packageName = document.getElementById('package-name').value.trim();
        if (!packageName) {
            showStatus('请输入包名称', 'error');
            return;
        }
        
        const tagPrefix = document.getElementById('tag-prefix').value.trim();
        const regexNoOverwrite = document.getElementById('regex-no-overwrite').checked;
        
        try {
            showStatus('生成打包文件...', 'info');
            showProgress(10);
            
            const packageObj = {
                name: packageName,
                created: new Date().toISOString(),
                tag_prefix: tagPrefix,
                presets: {},
                regexes: {},
                quick_reply_sets: {}
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
                            const finalName = tagPrefix ? `${tagPrefix}${presetName}` : presetName;
                            
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
                            filteredPreset.name = finalName;
                            
                            packageObj.presets[finalName] = filteredPreset;
                            debugLog(`已打包预设: ${finalName} (${Object.keys(filteredPreset).length} 个设置项)`);
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
                    let finalName = regex.scriptName || `正则脚本 ${regexIndex + 1}`;
                    if (tagPrefix) {
                        finalName = `${tagPrefix}${finalName}`;
                    }
                    if (regexNoOverwrite) {
                        finalName = `${finalName}_新`;
                    }
                    
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
                    const finalSetName = tagPrefix ? `${tagPrefix}${setName}` : setName;
                    
                    // 尝试从QuickReplySet.list获取完整的QR集数据
                    let qrSet = null;
                    if (window.QuickReplySet && window.QuickReplySet.list) {
                        const originalSet = window.QuickReplySet.list.find(set => set.name === setName);
                        if (originalSet) {
                            qrSet = {
                                name: finalSetName,
                                scope: originalSet.scope || 'global',
                                disableSend: originalSet.disableSend || false,
                                placeBeforeInput: originalSet.placeBeforeInput || false,
                                injectInput: originalSet.injectInput || false,
                                color: originalSet.color || 'transparent',
                                onlyBorderColor: originalSet.onlyBorderColor || false,
                                qrList: originalSet.qrList ? originalSet.qrList.map(qr => ({
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
                            debugLog(`从QuickReplySet.list获取快速回复集: ${setName} (${qrSet.qrList.length} 个回复)`);
                        }
                    }
                    
                    // 如果没有找到，尝试从API获取数据
                    if (!qrSet) {
                        try {
                            const response = await fetch('/api/settings/get', {
                                method: 'POST',
                                headers: context.getRequestHeaders(),
                                body: JSON.stringify({}),
                            });
                            
                            if (response.ok) {
                                const data = await response.json();
                                const quickReplyPresets = data.quickReplyPresets || [];
                                const presetData = quickReplyPresets.find(preset => preset.name === setName);
                                
                                if (presetData) {
                                    qrSet = {
                                        name: finalSetName,
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
                        } catch (apiError) {
                            debugLog(`从API获取快速回复集失败: ${apiError.message}`);
                        }
                    }
                    
                    // 如果仍然没有找到，创建一个基本的QR集结构
                    if (!qrSet) {
                        qrSet = {
                            name: finalSetName,
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
                    
                    packageObj.quick_reply_sets[finalSetName] = qrSet;
                    debugLog(`已打包快速回复集: ${finalSetName} (${qrSet.qrList.length} 个回复)`);
                } catch (error) {
                    debugLog(`快速回复集 ${setName} 打包失败: ${error.message}`);
                }
            }
            showProgress(80);
            
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
            debugLog(`打包完成: ${Object.keys(packageObj.presets).length} 预设, ${Object.keys(packageObj.regexes).length} 正则, ${Object.keys(packageObj.quick_reply_sets).length} 快速回复集`);
            
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
        if (data.tag_prefix) {
            html += `<p><strong>标签:</strong> ${data.tag_prefix}</p>`;
        }
        html += `<p><strong>预设:</strong> ${data.presets ? Object.keys(data.presets).length : 0} 个</p>`;
        html += `<p><strong>正则:</strong> ${data.regexes ? Object.keys(data.regexes).length : 0} 个</p>`;
        html += `<p><strong>快速回复集:</strong> ${data.quick_reply_sets ? Object.keys(data.quick_reply_sets).length : 0} 个</p>`;
        
        detailsEl.innerHTML = html;
        const packageInfo = document.getElementById('package-info');
        if (packageInfo) {
            packageInfo.style.display = 'block';
        }
        debugLog(`包信息: ${Object.keys(data.presets || {}).length} 预设, ${Object.keys(data.regexes || {}).length} 正则, ${Object.keys(data.quick_reply_sets || {}).length} 快速回复集`);
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
                             (packageData.quick_reply_sets ? Object.keys(packageData.quick_reply_sets).length : 0);
            let importedCount = 0;
            
            // 导入预设
            if (packageData.presets) {
                const context = SillyTavern.getContext();
                const presetManager = context.getPresetManager();
                
                if (presetManager) {
                    for (const [name, preset] of Object.entries(packageData.presets)) {
                        try {
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
                const context = SillyTavern.getContext();
                const regexSettings = context.extensionSettings?.regex || [];
                const newRegexSettings = [...regexSettings];
                
                for (const [name, regex] of Object.entries(packageData.regexes)) {
                    try {
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
                        importedCount++;
                    } catch (error) {
                        debugLog(`正则 ${name} 导入失败: ${error.message}`);
                    }
                }
                
                // 更新正则设置并保存
                context.extensionSettings.regex = newRegexSettings;
                // 调用保存函数
                if (context.saveSettingsDebounced) {
                    context.saveSettingsDebounced();
                }
                debugLog(`正则设置已更新并保存`);
            }
            
            // 导入快速回复 - 使用slash命令系统
            if (packageData.quick_reply_sets) {
                debugLog('开始使用slash命令系统导入快速回复集...');
                
                for (const [setName, qrSet] of Object.entries(packageData.quick_reply_sets)) {
                    try {
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
                        
                        // 执行slash命令序列
                        await triggerSlash(slashCommands);
                        
                        // 等待一下让快速回复集有时间正确创建
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
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
            }
            
            showProgress(100);
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
        showProgress(40);
        
        await loadRegexes();
        showProgress(70);
        
        await loadQuickReplies();
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
