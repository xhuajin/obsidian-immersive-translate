import { Modal, Notice, Setting } from 'obsidian';
import { baiduFromOptions, baiduToOptions, tencentFromOptions, tencentToOptions } from 'src/settings';
import { translateBaidu, translateTencent } from './translate';

import ImmersiveTranslate from 'src/main';
import { tranConfig } from 'src/types';

export function createTranslateModal(plugin: ImmersiveTranslate) {
  const modal = new Modal(plugin.app); // 生成一个输入框获取翻译文本
  const config: tranConfig = {
    server: plugin.settings.server,
    from: plugin.settings.server === 'baidu' ? plugin.settings.baiduapi.from : plugin.settings.tencentapi.from,
    to: plugin.settings.server === 'baidu' ? plugin.settings.baiduapi.to : plugin.settings.tencentapi.to
  };
  modal.titleEl.setText('翻译');
  new Setting(modal.contentEl)
    .setName('翻译服务')
    .addDropdown((dropdown) => {
      dropdown
        .addOptions({
          'baidu': '百度翻译',
          'tencent': '腾讯翻译'
        })
        .setValue(plugin.settings.server)
        .onChange(async (value) => {
          if (config.server === value) {
            return;
          }
          config.server = value;
          updateTranConfig(config, fromEl, toEl, plugin);
        });
    });
    const translatePanel = modal.contentEl.createEl('table', {cls: 'translate-panel'});
    const tbody = translatePanel.createEl('tbody');
    const tr = tbody.createEl('tr');
    const td1 = tr.createEl('td', {cls: 'from-language'});
    const td2 = tr.createEl('td', {cls: 'to-language'});
    const fromEl = td1.createEl('select', {cls: 'from-language-dropdown dropdown'});
    const toEl = td2.createEl('select', {cls: 'to-language-dropdown dropdown'});
    updateTranConfig(config, fromEl, toEl, plugin);
    const textContainer = td1.createEl('textarea', {cls: 'translate-text-container'});
    const resultContainer = td2.createEl('textarea', {cls: 'result-text-container'});
    
    textContainer.setAttr('placeholder', '请输入要翻译的文本');
    resultContainer.setAttr('placeholder', '翻译结果');
    
    // 生成一个按钮，点击按钮进行翻译
    new Setting(modal.contentEl)
      .addButton((button) => {
        button.setButtonText('翻译');
        button.onClick(async () => {
          if (config.server === 'baidu') {
            // 百度翻译
            if (!plugin.settings.baiduapi.appid) {
              new Notice('请填写百度翻译的 appid');
              return;
            }
            if (!plugin.settings.baiduapi.appkey) {
              new Notice('请填写百度翻译的 appkey');
              return;
            }
            const translatedResponse = translateBaidu(plugin.settings.baiduapi, textContainer.value, config.from, config.to);
            translatedResponse.then((res) => {
              if (res.json.hasOwnProperty('error_code')) {
                const errorcode = res.json.error_code;
                new Notice(`翻译失败，错误代码：${errorcode}`);
              }
              const result = res.json.trans_result[0].dst;
              resultContainer.value = result;
            });
          } else if (config.server === 'tencent') {
            // 腾讯翻译，使用签名方法 v3
            translateTencent(plugin.settings.tencentapi, textContainer.value, config.from, config.to).text.then((res) => {
              const jsonres = JSON.parse(res);
              resultContainer.value = jsonres.Response.TargetText;
            });
          }
        });
      });
  modal.open();
}

export function updateTranConfig(config: tranConfig, fromEl: HTMLSelectElement, toEl: HTMLSelectElement, plugin: ImmersiveTranslate) {
  fromEl.options.length = 0;
  toEl.options.length = 0;
  if (config.server === 'baidu') {
    for (const key in baiduFromOptions) {
      const option = fromEl.createEl('option');
      option.setAttr('value', key);
      option.setText(baiduFromOptions[key]);
      plugin.registerDomEvent(fromEl, 'change', () => {
        config.from = fromEl.value;
        toEl.options.length = 0;
        for (const tokey in baiduToOptions) {
          const option = toEl.createEl('option');
          option.setAttr('value', tokey);
          option.setText(baiduToOptions[tokey]);
          
          plugin.registerDomEvent(toEl, 'change', () => {
            config.to = toEl.value;
          });
        }
      });
    }
    for (const key in baiduToOptions) {
      const option = toEl.createEl('option');
      option.setAttr('value', key);
      option.setText(baiduToOptions[key]);
      plugin.registerDomEvent(toEl, 'change', () => {
        config.to = toEl.value;
      });
    }
  } else if (config.server === 'tencent') {
    for (const key in tencentFromOptions) {
      const option = fromEl.createEl('option');
      option.setAttr('value', key);
      option.setText(tencentFromOptions[key]);
      plugin.registerDomEvent(fromEl, 'change', () => {
        config.from = fromEl.value;
        toEl.options.length = 0;
        for (const tokey in tencentToOptions[config.from]) {
          const option = toEl.createEl('option');
          option.setAttr('value', tokey);
          option.setText(tencentToOptions[config.from][tokey]);
          
          plugin.registerDomEvent(toEl, 'change', () => {
            config.to = toEl.value;
          });
        }
      });
    }
    for (const key in tencentToOptions[config.from]) {
      const option = toEl.createEl('option');
      option.setAttr('value', key);
      option.setText(tencentToOptions[config.from][key]);
      
      plugin.registerDomEvent(toEl, 'change', () => {
        config.to = toEl.value;
      });
    }
  }
}