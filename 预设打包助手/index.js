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
            const extensionSettings = context.extensionSettings || {};
            
            // 尝试从不同的QR设置中获取数据
            let qrSets = [];
            
            // 检查新的QR V2设置
            if (extensionSettings.quickReplyV2 && extensionSettings.quickReplyV2.config && extensionSettings.quickReplyV2.config.setList) {
                qrSets = extensionSettings.quickReplyV2.config.setList.map(set => ({
                    name: set.set,
                    visible: set.isVisible,
                    qrCount: 0 // 需要从其他地方获取QR数量
                }));
            }
            // 检查旧的QR设置
            else if (extensionSettings.quickReply) {
                qrSets = [{
                    name: extensionSettings.quickReply.selectedPreset || extensionSettings.quickReply.name || 'Default',
                    visible: true,
                    qrCount: 0
                }];
            }
            
            debugLog(`找到 ${qrSets.length} 个快速回复集`);
            
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
                        <div class="resource-item-desc">快速回复集</div>
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
                        const preset = presetManager.getPresetSettings(presetName);
                        if (preset) {
                            const finalName = tagPrefix ? `${tagPrefix}${presetName}` : presetName;
                            packageObj.presets[finalName] = preset;
                            debugLog(`已打包预设: ${finalName}`);
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
            const quickReplySettings = extensionSettings.quickReplyV2 || {};
            
            for (const setName of selectedQuickReplies) {
                try {
                    const finalSetName = tagPrefix ? `${tagPrefix}${setName}` : setName;
                    
                    // 尝试从QR V2设置中获取QR集
                    let qrSet = null;
                    if (quickReplySettings.config && quickReplySettings.config.setList) {
                        const setConfig = quickReplySettings.config.setList.find(set => set.set === setName);
                        if (setConfig) {
                            qrSet = {
                                name: finalSetName,
                                isVisible: setConfig.isVisible,
                                qrList: [] // QR列表需要从其他地方获取
                            };
                        }
                    }
                    
                    // 如果没有找到，创建一个基本的QR集结构
                    if (!qrSet) {
                        qrSet = {
                            name: finalSetName,
                            isVisible: true,
                            qrList: []
                        };
                    }
                    
                    packageObj.quick_reply_sets[finalSetName] = qrSet;
                    debugLog(`已打包快速回复集: ${finalSetName}`);
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
    
    // 处理文件选择
    function handleFileSelect(event) {
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
                            await presetManager.savePreset(name, preset, { skipUpdate: true });
                            debugLog(`预设导入: ${name}`);
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
                    // 检查是否已存在相同名称的正则
                    const existingIndex = newRegexSettings.findIndex(r => r.scriptName === name);
                    if (existingIndex >= 0) {
                        newRegexSettings[existingIndex] = regex;
                    } else {
                        newRegexSettings.push(regex);
                    }
                    debugLog(`正则导入: ${name}`);
                    importedCount++;
                }
                
                // 更新正则设置
                context.extensionSettings.regex = newRegexSettings;
            }
            
            // 导入快速回复
            if (packageData.quick_reply_sets) {
                const context = SillyTavern.getContext();
                const extensionSettings = context.extensionSettings || {};
                let quickReplySettings = extensionSettings.quickReplyV2 || {};
                
                // 确保QR V2设置结构存在
                if (!quickReplySettings.config) {
                    quickReplySettings.config = { setList: [] };
                }
                if (!quickReplySettings.config.setList) {
                    quickReplySettings.config.setList = [];
                }
                
                for (const [setName, qrSet] of Object.entries(packageData.quick_reply_sets)) {
                    try {
                        // 检查是否已存在相同名称的QR集
                        const existingIndex = quickReplySettings.config.setList.findIndex(set => set.set === setName);
                        if (existingIndex >= 0) {
                            quickReplySettings.config.setList[existingIndex] = {
                                set: setName,
                                isVisible: qrSet.isVisible !== undefined ? qrSet.isVisible : true
                            };
                        } else {
                            quickReplySettings.config.setList.push({
                                set: setName,
                                isVisible: qrSet.isVisible !== undefined ? qrSet.isVisible : true
                            });
                        }
                        
                        debugLog(`快速回复集导入: ${setName}`);
                        importedCount++;
                    } catch (error) {
                        debugLog(`快速回复集 ${setName} 导入失败: ${error.message}`);
                    }
                }
                
                // 更新快速回复设置
                context.extensionSettings.quickReplyV2 = quickReplySettings;
            }
            
            showProgress(100);
            showStatus(`导入完成！成功导入 ${importedCount} 个项目`, 'success');
            debugLog('导入完成');
            
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
        showStatus('正在加载所有资源...', 'info');
        showProgress(10);
        
        await loadPresets();
        showProgress(40);
        
        await loadRegexes();
        showProgress(70);
        
        await loadQuickReplies();
        showProgress(100);
        
        showStatus('资源加载完成', 'success');
    }
    
    // 初始化函数
    function initializePresetHelper() {
        debugLog('预设打包助手初始化完成');
        
        // 将函数暴露到全局作用域
        window.switchPresetTab = switchPresetTab;
        window.switchResourceTab = switchResourceTab;
        window.togglePreset = togglePreset;
        window.toggleRegex = toggleRegex;
        window.toggleQuickReply = toggleQuickReply;
        window.createPackage = createPackage;
        window.handleFileSelect = handleFileSelect;
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
