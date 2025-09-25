// 独立 API 配置与 PING 测试（最小实现）
// 依赖：SillyTavern 本体运行环境（window.SillyTavern.getContext），不引入第三方库

(function () {
  const MODULE_NAME = 'DMSS';

  function ready(fn) {
    if (window.SillyTavern && SillyTavern.getContext) return fn();
    const i = setInterval(() => {
      if (window.SillyTavern && SillyTavern.getContext) {
        clearInterval(i);
        fn();
      }
    }, 200);
    setTimeout(fn, 5000);
  }

  ready(() => {
    try {
      if (document.getElementById('dmss-fab')) return;

      const fab = document.createElement('div');
      fab.id = 'dmss-fab';
      fab.title = MODULE_NAME;
      fab.textContent = '🛰️';
      fab.style.position = 'fixed';
      fab.style.top = '50%';
      fab.style.right = '20px';
      fab.style.zIndex = '99999';
      fab.style.cursor = 'pointer';
      fab.style.userSelect = 'none';
      fab.style.fontSize = '20px';
      fab.style.width = '32px';
      fab.style.height = '32px';
      fab.style.lineHeight = '32px';
      fab.style.textAlign = 'center';
      fab.style.borderRadius = '50%';
      fab.style.background = 'transparent';
      document.body.appendChild(fab);

      const panel = document.createElement('div');
      panel.id = 'dmss-panel';
      panel.style.position = 'fixed';
      panel.style.top = '60px';
      panel.style.right = '20px';
      panel.style.maxWidth = '380px';
      panel.style.background = '#111';
      panel.style.color = '#fff';
      panel.style.border = '1px solid #333';
      panel.style.padding = '10px';
      panel.style.borderRadius = '8px';
      panel.style.zIndex = '99999';
      panel.style.display = 'none';
      panel.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <div style="font-weight:600;">DMSS 独立 API</div>
          <button id="dmss-close" style="background:#222;color:#fff;border:1px solid #444;border-radius:6px;padding:2px 8px;cursor:pointer;">关闭</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          <label>API URL: <input id="dmss-api-url" type="text" style="width:100%" placeholder="https://example.com" /></label>
          <label>API Key: <input id="dmss-api-key" type="password" style="width:100%" placeholder="sk-..." /></label>
          <label>模型: <input id="dmss-api-model" type="text" style="width:100%" placeholder="gpt-4o-mini" /></label>
          <div style="display:flex;gap:6px;">
            <button id="dmss-save" style="flex:1;background:#2d6cdf;color:#fff;border:none;border-radius:6px;padding:6px 10px;cursor:pointer;">保存</button>
            <button id="dmss-ping" style="flex:1;background:#10b981;color:#fff;border:none;border-radius:6px;padding:6px 10px;cursor:pointer;">Ping</button>
          </div>
          <div id="dmss-status" style="font-size:12px;color:lightgreen;min-height:18px;"></div>
          <pre id="dmss-debug" style="white-space:pre-wrap;font-size:12px;color:#ddd;max-height:200px;overflow:auto;margin:0;"></pre>
        </div>
      `;
      document.body.appendChild(panel);

      fab.addEventListener('click', () => {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      });
      panel.querySelector('#dmss-close').addEventListener('click', () => {
        panel.style.display = 'none';
      });

      const urlInput = panel.querySelector('#dmss-api-url');
      const keyInput = panel.querySelector('#dmss-api-key');
      const modelInput = panel.querySelector('#dmss-api-model');
      const saveBtn = panel.querySelector('#dmss-save');
      const pingBtn = panel.querySelector('#dmss-ping');
      const statusEl = panel.querySelector('#dmss-status');
      const debugEl = panel.querySelector('#dmss-debug');

      function debugLog(title, data) {
        try {
          const text = `${title}:\n${typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data)}`;
          debugEl.textContent = text;
        } catch (e) {
          debugEl.textContent = `${title}: ${String(data)}`;
        }
        if (window.DEBUG_DMSS) console.log('[DMSS]', title, data);
      }

      // 初始化读取
      urlInput.value = localStorage.getItem('dmssApiUrl') || '';
      keyInput.value = localStorage.getItem('dmssApiKey') || '';
      modelInput.value = localStorage.getItem('dmssApiModel') || '';

      saveBtn.addEventListener('click', () => {
        const url = urlInput.value.trim();
        const key = keyInput.value.trim();
        const model = modelInput.value.trim();
        if (!url || !key || !model) {
          alert('请完整填写 API URL、Key 与模型');
          return;
        }
        localStorage.setItem('dmssApiUrl', url);
        localStorage.setItem('dmssApiKey', key);
        localStorage.setItem('dmssApiModel', model);
        statusEl.textContent = '已保存';
        debugLog('保存配置', { url, model });
      });

      pingBtn.addEventListener('click', async () => {
        const url = (urlInput.value || localStorage.getItem('dmssApiUrl') || '').replace(/\/$/, '');
        const key = keyInput.value || localStorage.getItem('dmssApiKey');
        const model = modelInput.value || localStorage.getItem('dmssApiModel');
        if (!url || !key || !model) {
          alert('请先保存完整配置');
          return;
        }

        statusEl.textContent = '正在向模型发送 ping ...';
        debugLog('开始 PING', { url, model });
        try {
          const res = await fetch(`${url}/v1/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              messages: [{ role: 'user', content: 'ping' }],
              max_tokens: 16,
            }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          statusEl.textContent = `模型 ${model} 可用（ping 成功）`;
          debugLog('PING 成功', data);
        } catch (e) {
          statusEl.textContent = `连接失败: ${e.message || e}`;
          debugLog('PING 失败', e);
        }
      });

    } catch (err) {
      console.error(`[${MODULE_NAME}] 初始化失败:`, err);
    }
  });
})();


