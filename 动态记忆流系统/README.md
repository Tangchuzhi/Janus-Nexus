# DMSS (动态记忆流系统) 使用说明

## 系统概述

DMSS (Dynamic Memory Stream System) 是一个专为SillyTavern设计的动态记忆管理系统，能够自动捕获、存储和应用AI对话中的记忆指令，构建完整的角色世界状态。

## 核心功能

### 1. 数据捕获 (Data Capture)
- 自动监听AI响应中的`<DMSS>`标签
- 使用正则表达式提取JSON指令
- 验证指令格式和结构

### 2. 数据持久化 (Data Persistence)
- 使用IndexedDB存储所有DMSS指令
- 数据库名称: `JanusTreasureChestDB`
- 对象仓库: `DMSS_Store`
- 支持按目标、时间戳、动作类型索引

### 3. 记忆快照构建 (Memory Snapshot)
- 将历史指令组合成完整的世界状态
- 支持档案区和备用区双区存储
- 实现CREATE、APPEND、MOVE、COMPRESS四种指令类型

### 4. 上下文注入 (Context Injection)
- 自动将记忆快照注入到SillyTavern上下文
- 支持多种注入方式（系统提示、用户输入、角色描述）
- 格式化输出便于AI理解

## DMSS指令格式

### 基本格式
```json
<DMSS>
[
  {
    "action": "ACTION_TYPE",
    "target": "TARGET_PATH",
    "payload": { ... }
  }
]
</DMSS>
```

### 指令类型

#### CREATE - 创建新条目
```json
{
  "action": "CREATE",
  "target": "C_001_角色名",
  "payload": {
    "核心驱动": "角色的核心动机",
    "关系网": {
      "NPC_A": "朋友",
      "NPC_B": "敌人"
    },
    "人生履历": {
      "ARC_第一章": "章节总结"
    }
  }
}
```

#### APPEND - 增量追加
```json
{
  "action": "APPEND",
  "target": "C_001_角色名.人生履历.E_001_事件名",
  "payload": {
    "content": "事件描述",
    "timestamp": "2025-01-15",
    "location": "地点"
  }
}
```

#### MOVE - 区域移动
```json
{
  "action": "MOVE",
  "target": "P_001_并行事件",
  "payload": {
    "from": "standby",
    "to": "archive",
    "new_id": "E_001_正式事件"
  }
}
```

#### COMPRESS - 记忆压缩
```json
{
  "action": "COMPRESS",
  "target": "C_001_角色名.人生履历",
  "payload": {
    "arc_id": "ARC_第二章_新章节",
    "arc_summary": "完整章节总结",
    "events_to_delete": ["E_001", "E_002"]
  }
}
```

## 条目类型

### 档案区 (Archive)
- `C_编号_角色`: 角色档案
- `G_编号_组织`: 组织档案  
- `T_编号_物品`: 物品档案

### 备用区 (Standby)
- `P_编号_并行事件`: 并行事件
- `A_编号_伏笔`: 伏笔/约定/线索

## 使用方法

### 1. 自动激活
DMSS系统会在SillyTavern加载时自动初始化，无需手动操作。

### 2. 在AI对话中使用
在AI的回复中包含DMSS指令，系统会自动捕获和处理：

```
用户: 请描述角色的新经历

AI: 角色在酒馆中遇到了一个神秘的陌生人...

<DMSS>
[{"action":"APPEND","target":"C_001_主角.人生履历.E_002_酒馆相遇","payload":{"content":"在酒馆遇到神秘陌生人","timestamp":"2025-01-15","location":"酒馆"}}]
</DMSS>
```

### 3. 手动操作
通过Janus百宝箱的DMSS界面可以：
- 查看系统状态
- 查看角色记忆
- 导出记忆数据
- 清理过期数据
- 验证文件完整性

## API接口

### 全局API
```javascript
// 初始化系统
window.DMSS.init()

// 获取系统状态
window.DMSS.getStatus()

// 获取记忆快照
window.DMSS.getSnapshot()

// 清理过期数据
window.DMSS.cleanup(days)

// 手动注入上下文
window.DMSS.injectContext()
```

### 调试API
```javascript
// 访问内部模块
window.DMSS._debug.database    // 数据库模块
window.DMSS._debug.processor   // 指令处理器
window.DMSS._debug.snapshot    // 记忆快照构建器
window.DMSS._debug.injector    // 上下文注入器
```

## 测试

系统包含测试文件 `dmss-test.js`，可以在浏览器控制台中运行：

```javascript
// 运行完整测试
window.testDMSS()
```

## 注意事项

1. **双区原则**: 档案区存储核心角色和组织信息，备用区存储临时事件和伏笔
2. **ARC章节**: 一旦创建ARC章节，禁止修改或删除
3. **自动注入**: 系统会在发送消息前自动注入当前记忆快照
4. **数据持久化**: 所有数据存储在浏览器IndexedDB中，清除浏览器数据会丢失记忆

## 故障排除

### 常见问题

1. **DMSS系统未激活**
   - 检查浏览器控制台是否有错误信息
   - 确认jQuery、Lodash、Toastr库已加载

2. **指令解析失败**
   - 检查JSON格式是否正确
   - 确认指令结构符合规范

3. **上下文注入失败**
   - 系统会尝试多种注入方式
   - 失败不会影响正常使用

### 调试方法

1. 打开浏览器开发者工具
2. 查看控制台日志
3. 使用 `window.DMSS._debug` 访问内部模块
4. 运行 `window.testDMSS()` 进行系统测试

## 更新日志

### v1.0.0
- 初始版本发布
- 实现四个核心功能模块
- 支持完整的DMSS指令规范
- 集成SillyTavern上下文注入
