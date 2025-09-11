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
            
            // 导入快速回复集 - 简化为单一方法
            if (packageData.quick_reply_sets && Object.keys(packageData.quick_reply_sets).length > 0) {
                debugLog(`开始导入 ${Object.keys(packageData.quick_reply_sets).length} 个快速回复集`);
                
                for (const [setName, qrSetData] of Object.entries(packageData.quick_reply_sets)) {
                    debugLog(`正在处理快速回复集: ${setName}`);
                    debugLog(`原始数据:`, qrSetData);
                    
                    try {
                        // 构建标准的QR集格式
                        let qrSetToSave;
                        
                        if (Array.isArray(qrSetData)) {
                            // 如果是数组格式（旧格式）
                            debugLog(`检测到数组格式，转换为标准格式`);
                            qrSetToSave = {
                                name: setName,
                                disableSend: false,
                                placeBeforeInput: false,
                                injectInput: false,
                                scope: "global",
                                color: "transparent",
                                onlyBorderColor: false,
                                isVisible: true,
                                qrList: qrSetData.map(reply => ({
                                    id: reply.id || `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                    label: reply.label || reply.name || '',
                                    title: reply.title || '',
                                    message: reply.message || reply.command || reply.text || '',
                                    isHidden: reply.isHidden || false,
                                    executeOnStartup: reply.executeOnStartup || false,
                                    executeOnUser: reply.executeOnUser || false,
                                    executeOnAi: reply.executeOnAi || false,
                                    executeOnChatChange: reply.executeOnChatChange || false,
                                    executeOnGroupMemberDraft: reply.executeOnGroupMemberDraft || false,
                                    executeOnNewChat: reply.executeOnNewChat || false,
                                    executeBeforeGeneration: reply.executeBeforeGeneration || false,
                                    automationId: reply.automationId || '',
                                    contextList: reply.contextList || []
                                }))
                            };
                        } else if (qrSetData.qrList && Array.isArray(qrSetData.qrList)) {
                            // 如果是对象格式（新格式）
                            debugLog(`检测到对象格式，使用标准格式`);
                            qrSetToSave = {
                                name: setName,
                                disableSend: qrSetData.disableSend || false,
                                placeBeforeInput: qrSetData.placeBeforeInput || false,
                                injectInput: qrSetData.injectInput || false,
                                scope: qrSetData.scope || "global",
                                color: qrSetData.color || "transparent",
                                onlyBorderColor: qrSetData.onlyBorderColor || false,
                                isVisible: qrSetData.isVisible !== false,
                                qrList: qrSetData.qrList.map(qr => ({
                                    id: qr.id || `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                    label: qr.label || '',
                                    title: qr.title || '',
                                    message: qr.message || '',
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
                                }))
                            };
                        } else {
                            throw new Error(`不支持的数据格式`);
                        }
                        
                        debugLog(`构建的QR集数据:`, qrSetToSave);
                        debugLog(`QR列表长度: ${qrSetToSave.qrList.length}`);
                        
                        // 保存QR集文件
                        const fileResponse = await fetch('/api/files/write', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                path: `data/default-user/QuickReplies/${setName}.json`,
                                data: JSON.stringify(qrSetToSave, null, 2)
                            })
                        });
                        
                        debugLog(`文件写入响应状态: ${fileResponse.status}`);
                        
                        if (!fileResponse.ok) {
                            const errorText = await fileResponse.text();
                            debugLog(`文件写入失败响应: ${errorText}`);
                            throw new Error(`文件保存失败: ${fileResponse.status} - ${errorText}`);
                        }
                        
                        debugLog(`快速回复集文件保存成功: ${setName}`);
                        
                        // 更新扩展设置
                        const context = SillyTavern.getContext();
                        if (!context.extensionSettings.quickReplyV2) {
                            context.extensionSettings.quickReplyV2 = { config: { setList: [] } };
                        }
                        if (!context.extensionSettings.quickReplyV2.config) {
                            context.extensionSettings.quickReplyV2.config = { setList: [] };
                        }
                        if (!Array.isArray(context.extensionSettings.quickReplyV2.config.setList)) {
                            context.extensionSettings.quickReplyV2.config.setList = [];
                        }
                        
                        // 添加或更新配置条目
                        const existingIndex = context.extensionSettings.quickReplyV2.config.setList.findIndex(
                            item => item.set === setName
                        );
                        
                        const configEntry = {
                            set: setName,
                            isVisible: true
                        };
                        
                        if (existingIndex >= 0) {
                            context.extensionSettings.quickReplyV2.config.setList[existingIndex] = configEntry;
                            debugLog(`更新现有QR集配置: ${setName}`);
                        } else {
                            context.extensionSettings.quickReplyV2.config.setList.push(configEntry);
                            debugLog(`添加新QR集配置: ${setName}`);
                        }
                        
                        importedCount++;
                        debugLog(`快速回复集导入成功: ${setName} (${qrSetToSave.qrList.length} 个回复)`);
                        
                    } catch (setError) {
                        debugLog(`快速回复集 ${setName} 导入失败: ${setError.message}`);
                        debugLog(`错误堆栈: ${setError.stack}`);
                    }
                }
                
                // 保存扩展设置
                try {
                    const context = SillyTavern.getContext();
                    if (context.saveSettingsDebounced) {
                        context.saveSettingsDebounced();
                        debugLog(`扩展设置已保存`);
                    } else {
                        debugLog(`saveSettingsDebounced方法未找到`);
                    }
                } catch (saveError) {
                    debugLog(`保存扩展设置失败: ${saveError.message}`);
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
            
            // 延迟刷新页面让快速回复扩展重新加载
            setTimeout(() => {
                debugLog('准备刷新页面以重新加载快速回复扩展...');
                window.location.reload();
            }, 3000);
            
        } catch (error) {
            showProgress(100);
            showStatus('导入失败: ' + error.message, 'error');
            debugLog('导入过程出现严重错误: ' + error.message);
            debugLog('错误堆栈: ' + error.stack);
        }
    }
    
    // 立即暴露函数到全局作用域，不等待DOM加载
    window.switchPresetTab = switchPresetTab;
    window.switchResourceTab = switchResourceTab;
    window.togglePreset = togglePreset;
    window.toggleRegex = toggleRegex;
    window.toggleQuickReply = toggleQuickReply;
    window.handleFileSelect = handleFileSelect;
    window.triggerFileSelect = triggerFileSelect;
    window.importPackage = importPackage;
    
    // 其他函数（createPackage, loadPresets, loadRegexes, loadQuickReplies等）保持不变...
    // 我只给出了主要的导入相关函数，其他函数保持原样
    
    debugLog('函数已暴露到全局作用域');

})();
