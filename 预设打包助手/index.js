// 预设打包助手 JavaScript 文件
(function() {
    'use strict';
    
    console.log('[预设打包助手] 开始加载...');
    
    // 全局变量
    let selectedPresets = [];
    let selectedRegexes = [];
    let selectedQuickReplies = [];
    let packageData = null;
    
    // 调试日志函数
    function debugLog(message) {
        console.log('[预设打包助手]', message);
    }
    
    // 显示状态消息
    function showStatus(message, type = 'info') {
        const statusEl = document.getElementById('preset-status');
        if (!statusEl) return;
        
        statusEl.textContent = message;
        statusEl.className = `preset-status ${type}`;
        statusEl.style.display = 'block';
        
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 4000);
        
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
        document.querySelectorAll('.preset-tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.preset-tab-content').forEach(content => content.classList.remove('active'));
        
        // 激活选中的标签页
        document.querySelector(`[onclick="switchPresetTab('${tab}')"]`).classList.add('active');
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
        
        debugLog(`开始导入，总项目数: ${totalItems}`);
        
        // 导入预设
        if (packageData.presets) {
            const context = SillyTavern.getContext();
            const presetManager = context.getPresetManager();
            
            if (presetManager) {
                for (const [name, preset] of Object.entries(packageData.presets)) {
                    try {
                        const presetToSave = { ...preset };
                        presetToSave.name = name;
                        
                        await presetManager.savePreset(name, presetToSave, { skipUpdate: true });
                        debugLog(`预设导入成功: ${name}`);
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
                    const regexWithNewId = {
                        ...regex,
                        id: crypto.randomUUID ? crypto.randomUUID() : 'regex_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
                    };
                    
                    const existingIndex = newRegexSettings.findIndex(r => r.scriptName === name);
                    if (existingIndex >= 0) {
                        newRegexSettings[existingIndex] = regexWithNewId;
                        debugLog(`正则更新: ${name}`);
                    } else {
                        newRegexSettings.push(regexWithNewId);
                        debugLog(`正则导入: ${name}`);
                    }
                    importedCount++;
                } catch (error) {
                    debugLog(`正则 ${name} 导入失败: ${error.message}`);
                }
            }
            
            context.extensionSettings.regex = newRegexSettings;
            if (context.saveSettingsDebounced) {
                context.saveSettingsDebounced();
            }
            debugLog(`正则设置已更新并保存`);
        }
        
        // 导入快速回复集 - 使用slash命令系统
        if (packageData.quick_reply_sets && Object.keys(packageData.quick_reply_sets).length > 0) {
            debugLog(`开始导入 ${Object.keys(packageData.quick_reply_sets).length} 个快速回复集`);
            
            // 确保Quick Reply扩展已启用
            try {
                if (window.$ && $('#qr--isEnabled').length > 0) {
                    $('#qr--isEnabled').prop('checked', true)[0].dispatchEvent(new Event('click'));
                    debugLog('Quick Reply扩展已启用');
                }
            } catch (enableError) {
                debugLog('启用Quick Reply扩展时出错，继续尝试导入: ' + enableError.message);
            }
            
            for (const [setName, qrSetData] of Object.entries(packageData.quick_reply_sets)) {
                debugLog(`正在处理快速回复集: ${setName}`);
                debugLog(`原始数据:`, qrSetData);
                
                try {
                    // 构建标准的QR集格式
                    let qrSet;
                    
                    if (Array.isArray(qrSetData)) {
                        // 如果是数组格式（旧格式）
                        debugLog(`检测到数组格式，转换为标准格式`);
                        qrSet = {
                            name: setName,
                            disableSend: false,
                            placeBeforeInput: false,
                            injectInput: false,
                            color: "transparent",
                            onlyBorderColor: false,
                            qrList: qrSetData.map(reply => ({
                                id: reply.id || Date.now() + Math.random(),
                                icon: reply.icon || '',
                                showLabel: reply.showLabel !== false,
                                label: reply.label || reply.name || '',
                                title: reply.title || '',
                                message: reply.message || reply.command || reply.text || '',
                                contextList: reply.contextList || [],
                                preventAutoExecute: reply.preventAutoExecute || false,
                                isHidden: reply.isHidden || false,
                                executeOnStartup: reply.executeOnStartup || false,
                                executeOnUser: reply.executeOnUser || false,
                                executeOnAi: reply.executeOnAi || false,
                                executeOnChatChange: reply.executeOnChatChange || false,
                                executeOnGroupMemberDraft: reply.executeOnGroupMemberDraft || false,
                                executeOnNewChat: reply.executeOnNewChat || false,
                                automationId: reply.automationId || ''
                            }))
                        };
                    } else if (qrSetData.qrList && Array.isArray(qrSetData.qrList)) {
                        // 如果是对象格式（新格式）
                        debugLog(`检测到对象格式，使用标准格式`);
                        qrSet = {
                            name: setName,
                            disableSend: qrSetData.disableSend || false,
                            placeBeforeInput: qrSetData.placeBeforeInput || false,
                            injectInput: qrSetData.injectInput || false,
                            color: qrSetData.color || "transparent",
                            onlyBorderColor: qrSetData.onlyBorderColor || false,
                            qrList: qrSetData.qrList.map(qr => ({
                                id: qr.id || Date.now() + Math.random(),
                                icon: qr.icon || '',
                                showLabel: qr.showLabel !== false,
                                label: qr.label || '',
                                title: qr.title || '',
                                message: qr.message || '',
                                contextList: qr.contextList || [],
                                preventAutoExecute: qr.preventAutoExecute || false,
                                isHidden: qr.isHidden || false,
                                executeOnStartup: qr.executeOnStartup || false,
                                executeOnUser: qr.executeOnUser || false,
                                executeOnAi: qr.executeOnAi || false,
                                executeOnChatChange: qr.executeOnChatChange || false,
                                executeOnGroupMemberDraft: qr.executeOnGroupMemberDraft || false,
                                executeOnNewChat: qr.executeOnNewChat || false,
                                automationId: qr.automationId || ''
                            }))
                        };
                    } else {
                        throw new Error(`不支持的数据格式`);
                    }
                    
                    debugLog(`构建的QR集数据:`, qrSet);
                    debugLog(`QR列表长度: ${qrSet.qrList.length}`);
                    
                    // 构建slash命令序列
                    const slashCommands = [];
                    
                    // 启用严格转义
                    slashCommands.push('/parser-flag STRICT_ESCAPING on');
                    
                    // 关闭并删除现有的同名QR集（如果存在）
                    slashCommands.push(`/qr-set-off "${setName}"`);
                    slashCommands.push(`/qr-chat-set-off "${setName}"`);
                    slashCommands.push(`/qr-set-delete ${setName}`);
                    
                    // 创建新的QR集
                    slashCommands.push(
                        `/qr-set-create nosend=${qrSet.disableSend} before=${qrSet.placeBeforeInput} inject=${qrSet.injectInput} ${setName}`
                    );
                    
                    // 创建每个快速回复
                    for (const qr of qrSet.qrList) {
                        // 转义消息内容
                        const escapedMessage = qr.message
                            .replaceAll('"', '\\"')
                            .replaceAll('<user>', '{{user}}')
                            .replaceAll('<char>', '{{char}}')
                            .replaceAll('{{', '\\{\\{');
                        
                        const createCommand = [
                            `/qr-create`,
                            `set=${setName}`,
                            `label=${qr.label}`,
                            qr.icon ? `icon=${qr.icon}` : '',
                            `showlabel=${qr.showLabel}`,
                            `hidden=${qr.isHidden}`,
                            `startup=${qr.executeOnStartup}`,
                            `user=${qr.executeOnUser}`,
                            `bot=${qr.executeOnAi}`,
                            `load=${qr.executeOnChatChange}`,
                            `new=${qr.executeOnNewChat}`,
                            `group=${qr.executeOnGroupMemberDraft}`,
                            `title=${qr.title}`,
                            `"${escapedMessage}"`
                        ].filter(part => part !== '').join(' ');
                        
                        slashCommands.push(createCommand);
                        
                        // 添加上下文关联
                        if (qr.contextList && qr.contextList.length > 0) {
                            for (const context of qr.contextList) {
                                slashCommands.push(
                                    `/qr-contextadd set=${setName} label=${qr.label} id=${qr.id} chain=${context.isChained || false} "${context.set}"`
                                );
                            }
                        }
                    }
                    
                    // 关闭严格转义
                    slashCommands.push('/parser-flag STRICT_ESCAPING off');
                    
                    // 组合所有命令
                    const fullCommand = slashCommands.join(' ||\n') + ' ||';
                    
                    debugLog(`准备执行slash命令序列:`);
                    debugLog(fullCommand);
                    
                    // 执行slash命令
                    if (window.triggerSlash) {
                        await window.triggerSlash(fullCommand);
                        debugLog(`快速回复集导入成功: ${setName} (${qrSet.qrList.length} 个回复)`);
                        importedCount++;
                    } else {
                        throw new Error('triggerSlash函数不可用');
                    }
                    
                } catch (setError) {
                    debugLog(`快速回复集 ${setName} 导入失败: ${setError.message}`);
                    debugLog(`错误堆栈: ${setError.stack}`);
                }
            }
            
            debugLog(`快速回复集导入阶段完成`);
        } else {
            debugLog(`没有快速回复集需要导入`);
        }
        
        showProgress(100);
        showStatus(`导入完成！成功导入 ${importedCount} 个项目`, 'success');
        debugLog(`导入总结: 成功导入 ${importedCount} 个项目`);
        
        // 清理导入数据
        packageData = null;
        const packageFile = document.getElementById('package-file');
        const packageInfo = document.getElementById('package-info');
        if (packageFile) packageFile.value = '';
        if (packageInfo) packageInfo.style.display = 'none';
        
        // 导入成功后不需要刷新页面，因为slash命令会自动更新UI
        setTimeout(() => {
            showStatus('导入完成，快速回复集已可用', 'success');
        }, 1000);
        
    } catch (error) {
        showProgress(100);
        showStatus('导入失败: ' + error.message, 'error');
        debugLog('导入过程出现严重错误: ' + error.message);
        debugLog('错误堆栈: ' + error.stack);
    }
}
