import { Notice, setIcon } from "obsidian";
import { translateBaidu, translateTencent } from './translate';

import ImmersiveTranslate from "src/main";

export function translateSetting_baidu(plugin: ImmersiveTranslate, nameEl: HTMLElement, descriptionEl: HTMLElement) {
  // @ts-ignore
  const settingName = nameEl?.innerText;
  // @ts-ignore
  const settingDesc = descriptionEl?.innerText;

  let result = '';
  if (settingName !== '') {
    const translatedName = translateBaidu(plugin.settings.baiduapi, settingName);
    // @ts-ignore
    translatedName.then((res0) => {
      if (res0.json.hasOwnProperty('error_code')) {
        // 如果翻译失败，添加一个重新翻译的按钮
        console.error('翻译失败，错误代码: ' + res0.json.error_code + '，错误信息: ' + res0.json.error_msg);
        const retranslateBtn = nameEl.createDiv({ attr: { class: 'imt-retranslate', 'tran-text': settingName } });
        setIcon(retranslateBtn, 'refresh-cw');
        plugin.registerDomEvent(retranslateBtn, 'click', () => {
          retranslateBtn.classList.add('imt-retranslate-clicked');
          const translatedName = translateBaidu(plugin.settings.baiduapi, settingName);
          translatedName.then((res) => {
            if (res.json.hasOwnProperty('error_code')) {
              const errorcode = res.json.error_code;
              new Notice(`翻译失败，错误代码：${errorcode}，错误信息：${res.json.error_msg}`);
              console.error('翻译失败，错误代码: ' + res.json.error_code + '，错误信息: ' + res.json.error_msg);
            } else {
              result = res.json.trans_result[0].dst;
              if (plugin.settings.resultStyle === 'both') {
                nameEl.insertAdjacentHTML('afterend', `<div class='imt-result'>${result}</div>`);
              } else {
                nameEl.innerText = result;
              }
              retranslateBtn.remove();
            }
          });
        });
      } else {
        result = res0.json.trans_result[0].dst;
        // 判断是否保留原文
        if (plugin.settings.resultStyle === 'both') {
          nameEl.insertAdjacentHTML('afterend', `<div class='imt-result'>${result}</div>`);
        } else {
          nameEl.innerText = result;
        }
      }
    });
  }
  if (settingDesc) {
    const translatedDesc = translateBaidu(plugin.settings.baiduapi, settingDesc);
    translatedDesc.then((res1) => {
      if (res1.json.hasOwnProperty('error_code')) {
        console.error('翻译失败，错误代码: ' + res1.json.error_code + '，错误信息: ' + res1.json.error_msg);
        // 如果翻译失败，添加一个重新翻译的按钮
        const retranslateBtn = descriptionEl.createDiv({ attr: { class: 'imt-retranslate', 'tran-text': settingDesc } });
        setIcon(retranslateBtn, 'refresh-cw');
        plugin.registerDomEvent(retranslateBtn, 'click', () => {
          retranslateBtn.classList.add('imt-retranslate-clicked');
          const translatedDesc = translateBaidu(plugin.settings.baiduapi, settingDesc);
          translatedDesc.then((res) => {
            if (res.json.hasOwnProperty('error_code')) {
              new Notice('翻译失败，错误代码: ' + res.json.error_code + '，错误信息: ' + res.json.error_msg);
              console.error('翻译失败，错误代码: ' + res.json.error_code + '，错误信息: ' + res.json.error_msg);
            } else {
              result = res.json.trans_result[0].dst;
              if (plugin.settings.resultStyle === 'both') {
                nameEl.insertAdjacentHTML('afterend', `<div class='imt-result'>${result}</div>`);
              } else {
                nameEl.innerText = result;
              }
              retranslateBtn.remove();
            }
          });
        });
      } else {
        result = res1.json.trans_result[0].dst;
        if (plugin.settings.resultStyle === 'both') {
          descriptionEl.insertAdjacentHTML('afterend', `<div class='imt-result'>${result}</div>`);
        } else {
          descriptionEl.innerText = result;
        }
      }
    });
  }
}

export function translateSetting_tencent(plugin: ImmersiveTranslate, nameEl: HTMLElement, descriptionEl: HTMLElement) {
  const settingName = nameEl?.innerText;
  const settingDesc = descriptionEl?.innerText;
  let result = '';
  if (settingName !== '') {
    settingName.replace(/\n/g, ' ');
    const translatedName = translateTencent(plugin.settings.tencentapi, settingName);
    translatedName.text.then((res) => {
      const jsonres = JSON.parse(res);
      if (jsonres.Response.hasOwnProperty('Error')) {
        console.error('翻译失败，错误代码: ', jsonres.Response.Error.Code, '错误信息', jsonres.Response.Error.Message);
        // 如果翻译失败，添加一个重新翻译的按钮
        const retranslateBtn = nameEl.createDiv({ attr: { class: 'imt-retranslate', 'tran-text': settingName } });
        setIcon(retranslateBtn, 'refresh-cw');
        plugin.registerDomEvent(retranslateBtn, 'click', () => {
          const translatedName = translateTencent(plugin.settings.tencentapi, settingName);
          translatedName.text.then((res) => {
            const jsonres = JSON.parse(res);
            if (jsonres.Response.hasOwnProperty('TargetText')) {
              result = jsonres.Response.TargetText;
              if (plugin.settings.resultStyle === 'both') {
                nameEl.insertAdjacentHTML('afterend', `<div class='imt-result'>${result}</div>`);
              } else {
                nameEl.innerText = result;
              }
              retranslateBtn.remove();
            } else {
              new Notice('翻译失败，错误代码: ' + jsonres.Response.Error.Code + '错误信息' + jsonres.Response.Error.Message);
            }
          });
        });
      } else {
        result = jsonres.Response.TargetText;
        // 判断是否保留原文
        if (plugin.settings.resultStyle === 'both') {
          nameEl.insertAdjacentHTML('afterend', `<div class='imt-result'>${result}</div>`);
        } else {
          nameEl.innerText = result;
        }
      }
    });
  }
  if (settingDesc) {
    settingDesc.replace(/\n/g, ' ');
    const translatedDesc = translateTencent(plugin.settings.tencentapi, settingDesc);
    translatedDesc.text.then((res) => {
      const jsonres = JSON.parse(res);
      if (jsonres.Response.hasOwnProperty('TargetText')) {
        result = jsonres.Response.TargetText;
        // 判断是否保留原文
        if (plugin.settings.resultStyle === 'both') {
          descriptionEl.insertAdjacentHTML('afterend', `<div class='imt-result'>${result}</div>`);
        } else {
          descriptionEl.innerText = result;
        }
      } else {
        console.error(settingDesc, '翻译失败，错误代码: ', jsonres.Response.Error.Code, '错误信息', jsonres.Response.Error.Message);
        // 如果翻译失败，添加一个重新翻译的按钮
        const retranslateBtn = descriptionEl.createDiv({ attr: { class: 'imt-retranslate', 'tran-text': settingDesc } });
        setIcon(retranslateBtn, 'refresh-cw');
        plugin.registerDomEvent(retranslateBtn, 'click', () => {
          const translatedDesc = translateTencent(plugin.settings.tencentapi, settingDesc);
          translatedDesc.text.then((res) => {
            const jsonres = JSON.parse(res);
            if (jsonres.Response.hasOwnProperty('TargetText')) {
              result = jsonres.Response.TargetText;
              if (plugin.settings.resultStyle === 'both') {
                descriptionEl.insertAdjacentHTML('afterend', `<div class='imt-result'>${result}</div>`);
              } else {
                descriptionEl.innerText = result;
              }
              retranslateBtn.remove();
            } else {
              new Notice('翻译失败，错误代码: ' + jsonres.Response.Error.Code + '错误信息' + jsonres.Response.Error.Message);
            }
          });
        });
      }
    });
  }
}

export function translateSetting_google(plugin: ImmersiveTranslate, nameEl: HTMLElement, descriptionEl: HTMLElement) {
  new Notice('还没写');
}