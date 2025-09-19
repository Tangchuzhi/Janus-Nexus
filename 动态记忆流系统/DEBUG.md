# DMSS系统调试指南

## 问题诊断步骤

### 1. 检查控制台日志

打开浏览器开发者工具（F12），查看控制台是否有以下日志：

**正常启动日志：**
```
[DMSS] DMSS处理器已加载
[DMSS] 开始检查依赖库...
[DMSS] jQuery: 已加载
[DMSS] Lodash: 已加载  
[DMSS] Toastr: 已加载
[DMSS] 所有依赖库检查通过
[Janusの百宝箱] DMSS处理器加载完成
[DMSS] 开始初始化系统...
[DMSS] 数据库初始化成功
[DMSS] 系统初始化完成
```

**如果看到错误日志：**
- `jQuery 未加载` - 需要确保SillyTavern已加载jQuery
- `Lodash 未加载` - 需要确保Lodash库已加载
- `Toastr 未加载` - 需要确保Toastr库已加载

### 2. 手动测试DMSS系统

在控制台中运行以下命令：

```javascript
// 检查DMSS是否已加载
console.log('DMSS系统:', typeof window.DMSS !== 'undefined' ? '已加载' : '未加载');

// 如果已加载，检查系统状态
if (window.DMSS) {
    window.DMSS.getStatus().then(status => {
        console.log('DMSS状态:', status);
    });
}
```

### 3. 使用测试按钮

在Janus百宝箱的DMSS界面中：
1. 点击"测试DMSS系统"按钮
2. 查看控制台输出
3. 检查是否有错误信息

### 4. 测试DMSS指令

在控制台中运行：

```javascript
// 测试创建角色
window.DMSS.testCreateCharacter().then(result => {
    console.log('创建角色结果:', result);
});

// 测试追加事件
window.DMSS.testAppendEvent().then(result => {
    console.log('追加事件结果:', result);
});

// 获取记忆快照
window.DMSS.getSnapshot().then(snapshot => {
    console.log('记忆快照:', snapshot);
});
```

### 5. 检查IndexedDB

在开发者工具中：
1. 打开"Application"标签
2. 展开"IndexedDB"
3. 查看是否有"JanusTreasureChestDB"数据库
4. 检查"DMSS_Store"对象仓库

### 6. 手动触发DMSS指令

在AI对话中发送包含DMSS指令的消息：

```
<DMSS>
[{"action":"CREATE","target":"C_001_测试角色","payload":{"核心驱动":"测试","关系网":{},"人生履历":{}}}]
</DMSS>
```

## 常见问题解决

### 问题1: DMSS系统未加载
**原因:** 依赖库未加载或脚本加载失败
**解决:** 
- 检查SillyTavern是否正确加载了jQuery、Lodash、Toastr
- 检查dmss-handler.js文件路径是否正确

### 问题2: 数据库初始化失败
**原因:** IndexedDB权限问题或浏览器不支持
**解决:**
- 确保在HTTPS环境下运行
- 检查浏览器是否支持IndexedDB

### 问题3: 指令解析失败
**原因:** JSON格式错误或指令结构不符合规范
**解决:**
- 检查DMSS指令的JSON格式
- 确保action、target、payload字段都存在

### 问题4: 上下文注入失败
**原因:** 找不到合适的注入位置
**解决:**
- 系统会尝试多种注入方式
- 失败不影响核心功能

## 调试命令

在控制台中可以使用以下调试命令：

```javascript
// 获取系统状态
window.DMSS.getStatus()

// 获取记忆快照
window.DMSS.getSnapshot()

// 手动注入上下文
window.DMSS.injectContext()

// 清理数据
window.DMSS.cleanup(7)

// 访问调试API
window.DMSS._debug.database
window.DMSS._debug.processor
window.DMSS._debug.snapshot
window.DMSS._debug.injector
```

## 联系支持

如果问题仍然存在，请提供：
1. 浏览器控制台的完整日志
2. 浏览器版本和类型
3. SillyTavern版本
4. 具体的错误信息
