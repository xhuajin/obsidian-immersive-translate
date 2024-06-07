import { App, Notice, PluginSettingTab, Setting, setIcon } from "obsidian";
import { baiduAPI, tencentAPI } from "./types";
import { translateBaidu, translateTencent } from "./translate/translate";

import ImmersiveTranslate from "./main";

export interface ImmersiveTranslateSettings {
  server: string; // 'none' | 'baidu' | 'tencent' | 'google'
  resultStyle: string; // 'both' | 'only'
  baiduapi: baiduAPI;
  tencentapi: tencentAPI;
  delay: number;
}

export const DEFAULT_SETTINGS: ImmersiveTranslateSettings = {
  server: 'none',
  resultStyle: 'both',
  baiduapi: {
    type: 'baidu',
    appid: '',
    appkey: '',
    from: 'auto',
    to: 'zh',
    delay: 1000
  },
  tencentapi: {
    type: 'tencent',
    secretId: '',
    secretKey: '',
    from: 'auto',
    to: 'zh',
    delay: 200,
    region: 'ap-shenzhen-fsi',
    version: '2018-03-21'
  },
  delay: 250
}

export class ImmersiveTranslateSettingTab extends PluginSettingTab {
  plugin: ImmersiveTranslate;
  generalheaderEl: HTMLElement;
  baiduheaderEl: HTMLElement;
  tencentheaderEl: HTMLElement;
  googleheaderEl: HTMLElement;
  tabHeaderEl: HTMLElement;
  tabContentEl: HTMLElement;
  
  constructor(app: App, plugin: ImmersiveTranslate) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this
    containerEl.empty()

    containerEl.createEl('h2', { text: '沉浸式翻译' });

    this.tabHeaderEl = containerEl.createEl('div', { cls: 'imt-settings-tab-header'});
    this.tabContentEl = containerEl.createEl('div', { cls: 'imt-settings-tab-content' });
    this.initTabHeader();
    this.displayGeneralSettings(this.tabContentEl);
  }

  initTabHeader() {
    this.generalheaderEl = this.tabHeaderEl.createEl('div', { cls: 'imt-settings-tab-header-item is-active', text: '常规设置' });
    this.baiduheaderEl = this.tabHeaderEl.createEl('div', { cls: 'imt-settings-tab-header-item', text: '百度翻译' });
    this.tencentheaderEl = this.tabHeaderEl.createEl('div', { cls: 'imt-settings-tab-header-item', text: '腾讯翻译' });
    this.googleheaderEl = this.tabHeaderEl.createEl('div', { cls: 'imt-settings-tab-header-item', text: 'Google 翻译' });
    
    this.registerTabClickEvents();
  }

  registerTabClickEvents() {
    this.plugin.registerDomEvent(this.generalheaderEl, 'click', () => {
      this.generalheaderEl.classList.add('is-active');
      this.baiduheaderEl.classList.remove('is-active');
      this.tencentheaderEl.classList.remove('is-active');
      this.googleheaderEl.classList.remove('is-active');
      this.displayGeneralSettings(this.tabContentEl);
    });

    this.plugin.registerDomEvent(this.baiduheaderEl, 'click', () => {
      this.generalheaderEl.classList.remove('is-active');
      this.baiduheaderEl.classList.add('is-active');
      this.tencentheaderEl.classList.remove('is-active');
      this.googleheaderEl.classList.remove('is-active');
      this.displayBaiduSettings(this.tabContentEl);
    });

    this.plugin.registerDomEvent(this.tencentheaderEl, 'click', () => {
      this.generalheaderEl.classList.remove('is-active');
      this.baiduheaderEl.classList.remove('is-active');
      this.tencentheaderEl.classList.add('is-active');
      this.googleheaderEl.classList.remove('is-active');
      this.displayTencentSettings(this.tabContentEl);
    });

    this.plugin.registerDomEvent(this.googleheaderEl, 'click', () => {
      this.generalheaderEl.classList.remove('is-active');
      this.baiduheaderEl.classList.remove('is-active');
      this.tencentheaderEl.classList.remove('is-active');
      this.googleheaderEl.classList.add('is-active');
      this.displayGoogleSettings(this.tabContentEl);
    });
  }
  
  displayGeneralSettings(contentEl: HTMLElement) {
    contentEl.empty();
    // 添加选择翻译服务的设置
    new Setting(contentEl)
      .setName('翻译服务')
      .setDesc('选择翻译服务')
      .addDropdown(dropdown => dropdown
        .addOptions({
          'none': '请选择翻译服务',
          'baidu': '百度翻译',
          'tencent': '腾讯翻译',
          'google': 'google 翻译',
        })
        .setValue(this.plugin.settings.server)
        .onChange(async (value) => {
          this.plugin.settings.server = value;
          if (value !== 'none') {
            new Notice('已切换至 ' + value + ' 翻译服务');
          }
          await this.plugin.saveSettings();
        }))
    
    
    // 翻译结果样式：显示译文和原文、仅显示译文
    new Setting(contentEl)
      .setName('翻译结果样式')
      .setDesc('设置翻译结果的样式：显示译文和原文、仅显示译文，默认为显示译文和原文')
      .addDropdown(dropdown => dropdown
        .addOptions({
          'both': '显示译文和原文',
          'only': '仅显示译文'
        })
        .setValue(this.plugin.settings.resultStyle)
        .onChange(async (value) => {
          this.plugin.settings.resultStyle = value;
          await this.plugin.saveSettings();
        })
      )
  }

  displayBaiduSettings(contentEl: HTMLElement) {
    contentEl.empty();
    new Setting(contentEl)
      .setName('百度翻译介绍')
      .setDesc('分为标准版、高级版和尊享版三个版本，标准版和高级版支持28个常见语种，尊享版支持201个语种。普通用户为标准版，认证后自动升级为高级版（认证很好过）。标准版5万字符免费/每月，高级版100万字符免费/每月，尊享版200万字符免费/每月。标准版速度较慢，建议认证一下速度会快很多。三种账号超额均按49元/百万字符收费。详见 https://api.fanyi.baidu.com/product/111')

    const appidSetting = new Setting(contentEl)
      .setName('App ID')
      .setDesc('在百度翻译开放平台 https://api.fanyi.baidu.com/ 注册账号后，在上方管理控制台中可以免费获取')
      .addText(text => text
        .setPlaceholder('App ID')
        .setValue(this.plugin.settings.baiduapi.appid)
        .onChange(async (value) => {
          this.plugin.settings.baiduapi.appid = value;
          await this.plugin.saveSettings();
        }))
    
    const appidinputEl = appidSetting.controlEl.children[0];
    appidinputEl.setAttribute('type', 'password');
    const toggleidBtn = appidSetting.controlEl.createEl('div', 'imt-toggle-passwordType-btn is-hide');
    setIcon(toggleidBtn, 'eye');
    this.plugin.registerDomEvent(toggleidBtn, 'click', () => {
      if (toggleidBtn.classList.contains('is-hide')) {
        toggleidBtn.classList.remove('is-hide');
        appidinputEl.setAttribute('type', 'text');
        setIcon(toggleidBtn, 'eye-off');
      } else {
        toggleidBtn.classList.add('is-hide');
        appidinputEl.setAttribute('type', 'password');
        setIcon(toggleidBtn, 'eye');
      }
    })
    
    const appkeySetting = new Setting(contentEl)
      .setName('密钥')
      .setDesc('平台分配的密钥，获取 App ID 的同时也会获取到 App Key')
      .addText(text => text
        .setPlaceholder('App Key')
        .setValue(this.plugin.settings.baiduapi.appkey)
        .onChange(async (value) => {
          this.plugin.settings.baiduapi.appkey = value
          await this.plugin.saveSettings()
        }))

    const appkeyinputEl = appkeySetting.controlEl.children[0];
    appkeyinputEl.setAttribute('type', 'password');
    const togglekeyBtn = appkeySetting.controlEl.createEl('div', 'imt-toggle-passwordType-btn is-hide');
    setIcon(togglekeyBtn, 'eye');
    this.plugin.registerDomEvent(togglekeyBtn, 'click', () => {
      if (togglekeyBtn.classList.contains('is-hide')) {
        togglekeyBtn.classList.remove('is-hide');
        appkeyinputEl.setAttribute('type', 'text');
        setIcon(togglekeyBtn, 'eye-off');
      } else {
        togglekeyBtn.classList.add('is-hide');
        appkeyinputEl.setAttribute('type', 'password');
        setIcon(togglekeyBtn, 'eye');
      }
    })

    // 翻译延迟
    new Setting(contentEl)
      .setName('翻译延迟')
      .setDesc('两次翻译之间的间隔。短时间内多次调用 api 会导致翻译失败，甚至触发封禁，因此需要设置个延迟依次翻译。百度翻译允许每秒发送1个请求，因此建议设置不低于1000ms。个人认证后可以提升到每秒10个请求，此时就可以设置到不低于100ms')
      .addText(text => text
        .setPlaceholder('翻译延迟')
        .setValue(this.plugin.settings.baiduapi.delay.toString())
        .onChange(async (value) => {
          this.plugin.settings.baiduapi.delay = parseInt(value);
          await this.plugin.saveSettings();
        }))

    new Setting(contentEl)
      .setName('源语言')
      .setDesc("待翻译的文本的语言，默认自动检测")
      .addDropdown(dropdown => dropdown
        .addOptions(baiduFromOptions)
        .setValue(this.plugin.settings.baiduapi.from)
        .onChange(async (value) => {
          this.plugin.settings.baiduapi.from = value
          await this.plugin.saveSettings()
        }))

    new Setting(contentEl)
      .setName('目标语言')
      .setDesc("翻译后的文本的语言，默认为中文")
      .addDropdown(dropdown => dropdown
        .addOptions(baiduToOptions)
        .setValue(this.plugin.settings.baiduapi.to)
        .onChange(async (value) => {
          this.plugin.settings.baiduapi.to = value
          await this.plugin.saveSettings()
        }))

    // 生成一个按钮，点击按钮进行翻译测试
    new Setting(contentEl)
      .setName('翻译测试')
      .addButton((button) => {
        button.setButtonText('翻译');
        button.onClick(async () => {
          if (!this.plugin.settings.baiduapi.appid) {
            new Notice('请填写 App ID');
            return;
          } else if (!this.plugin.settings.baiduapi.appkey) {
            new Notice('请填写 App Key');
            return;
          }
          const translatedText = translateBaidu(this.plugin.settings.baiduapi, textContainer.value);
          if (!translatedText) {
            new Notice('翻译失败，需重新翻译');
            return;
          }
          translatedText.then((res) => {
            const result = res.json.trans_result[0].dst;
            resultContainer.value = result;
          });
        });
      });

    // 放个表格用于翻译
    const translatePanel = contentEl.createEl('table', { cls: 'translate-panel' });
    const tbody = translatePanel.createEl('tbody');
    const tr = tbody.createEl('tr');
    const td1 = tr.createEl('td', { cls: 'from-language' });
    const td2 = tr.createEl('td', { cls: 'to-language' });
    const textContainer = td1.createEl('textarea', { cls: 'translate-text-container' });
    const resultContainer = td2.createEl('textarea', { cls: 'result-text-container' });
    textContainer.setAttr('placeholder', '请输入要翻译的文本');
    resultContainer.setAttr('placeholder', '翻译结果');
  }

  displayTencentSettings(contentEl: HTMLElement) {
    contentEl.empty();
    new Setting(contentEl)
      .setName('腾讯翻译介绍')
      .setDesc('目前支持18种语言/文字的翻译能力，500万字符免费/每月，量大但是速度比认证后的百度翻译慢。超额后的计费标准见 https://cloud.tencent.com/document/product/551/35017')

    const appidSetting = new Setting(contentEl)
      .setName('Secret ID')
      .setDesc('腾讯云平台网站控制台中获取 https://console.cloud.tencent.com/tmt （登陆后点击头像，选择访问管理。打开后选择左侧访问密钥，新建密钥即可获得SecretID和SecretKey）')
      .addText(text => text
        .setPlaceholder('App ID')
        .setValue(this.plugin.settings.tencentapi.secretId)
        .onChange(async (value) => {
          this.plugin.settings.tencentapi.secretId = value;
          await this.plugin.saveSettings();
        }))
    
    const appidinputEl = appidSetting.controlEl.children[0];
    appidinputEl.setAttribute('type', 'password');
    const toggleidBtn = appidSetting.controlEl.createEl('div', 'imt-toggle-passwordType-btn is-hide');
    setIcon(toggleidBtn, 'eye');
    this.plugin.registerDomEvent(toggleidBtn, 'click', () => {
      if (toggleidBtn.classList.contains('is-hide')) {
        toggleidBtn.classList.remove('is-hide');
        appidinputEl.setAttribute('type', 'text');
        setIcon(toggleidBtn, 'eye-off');
      } else {
        toggleidBtn.classList.add('is-hide');
        appidinputEl.setAttribute('type', 'password');
        setIcon(toggleidBtn, 'eye');
      }
    })
    
    const appkeySetting = new Setting(contentEl)
      .setName('Secret Key')
      .setDesc('平台分配的密钥中的 SecretKey')
      .addText(text => text
        .setPlaceholder('App Key')
        .setValue(this.plugin.settings.tencentapi.secretKey)
        .onChange(async (value) => {
          this.plugin.settings.tencentapi.secretKey = value
          await this.plugin.saveSettings()
        }))

    const appkeyinputEl = appkeySetting.controlEl.children[0];
    appkeyinputEl.setAttribute('type', 'password');
    const togglekeyBtn = appkeySetting.controlEl.createEl('div', 'imt-toggle-passwordType-btn is-hide');
    setIcon(togglekeyBtn, 'eye');
    this.plugin.registerDomEvent(togglekeyBtn, 'click', () => {
      if (togglekeyBtn.classList.contains('is-hide')) {
        togglekeyBtn.classList.remove('is-hide');
        appkeyinputEl.setAttribute('type', 'text');
        setIcon(togglekeyBtn, 'eye-off');
      } else {
        togglekeyBtn.classList.add('is-hide');
        appkeyinputEl.setAttribute('type', 'password');
        setIcon(togglekeyBtn, 'eye');
      }
    })

    // 翻译延迟
    new Setting(contentEl)
      .setName('翻译延迟')
      .setDesc('两次翻译之间的间隔。短时间内多次调用 api 会导致翻译失败，甚至触发封禁，因此需要设置个延迟依次翻译。腾讯翻译允许每秒发送5个请求，因此建议设置不低于200ms')
      .addText(text => text
        .setPlaceholder('翻译延迟')
        .setValue(this.plugin.settings.tencentapi.delay.toString())
        .onChange(async (value) => {
          this.plugin.settings.tencentapi.delay = parseInt(value);
          await this.plugin.saveSettings();
        }))

    new Setting(contentEl)
      .setName('地域')
      .setDesc('选择腾讯云的地域')
      .addDropdown(dropdown => dropdown
        .addOptions({
          'ap-bangkok': '亚太东南（曼谷）',
          'ap-beijing': '华北地区（北京）',
          'ap-chengdu': '西南地区（成都）',
          'ap-chongqing': '西南地区（重庆）',
          'ap-guangzhou': '华南地区（广州）',
          'ap-hongkong': '港澳台地区（中国香港）',
          'ap-mumbai': '亚太南部（孟买）',
          'ap-seoul': '亚太东北（首尔）',
          'ap-shanghai': '华东地区（上海）',
          'ap-shanghai-fsi': '华东地区（上海金融）',
          'ap-shenzhen-fsi': '华南地区（深圳金融）',
          'ap-singapore': '亚太东南（新加坡）',
          '	ap-tokyo': '亚太东北（东京）',
          'en-frankfurt': '欧洲地区（法兰克福）',
          'na-ashburn': '美国东部（弗吉尼亚）',
          'na-siliconvalley': '美国西部（硅谷）',
          'na-toronto': '北美地区（多伦多）',
        })
        .setValue(this.plugin.settings.tencentapi.region)
        .onChange(async (value) => {
          this.plugin.settings.tencentapi.region = value;
          await this.plugin.saveSettings()
        }))

    new Setting(contentEl)
      .setName('源语言')
      .setDesc("待翻译的文本的语言，默认自动检测")
      .addDropdown(dropdown => dropdown
        .addOptions(tencentFromOptions)
        .setValue(this.plugin.settings.tencentapi.from)
        .onChange(async (value) => {
          this.plugin.settings.tencentapi.from = value;
          targetDropdown.options.length = 0;
          for (const key in tencentToOptions[value]) {
            targetDropdown.add(new Option(tencentToOptions[value][key], key));
          }
          await this.plugin.saveSettings()
        }))

    const targetEl = new Setting(contentEl)
      .setName('目标语言')
      .setDesc("翻译后的文本的语言，默认为中文")
      .addDropdown(dropdown => dropdown
        .addOptions(
          tencentToOptions[this.plugin.settings.tencentapi.from]
        )
        .setValue(this.plugin.settings.tencentapi.to)
        .onChange(async (value) => {
          this.plugin.settings.tencentapi.to = value;
          await this.plugin.saveSettings()
        }))
    const targetDropdown = targetEl.controlEl.children[0] as HTMLSelectElement;

    new Setting(contentEl)
      .setName('翻译测试')
      .addButton((button) => {
        button.setButtonText('翻译');
        button.onClick(async () => {
          if (!this.plugin.settings.tencentapi.secretId) {
            new Notice('请填写 Secret ID');
            return;
          } else if (!this.plugin.settings.tencentapi.secretKey) {
            new Notice('请填写 Secret Key');
            return;
          }
          const translatedText = translateTencent(this.plugin.settings.tencentapi, textContainer.value);
          if (!translatedText) {
            new Notice('翻译失败，需重新翻译');
            return;
          }
          translatedText.text.then((res) => {
            const jsonres = JSON.parse(res);
            resultContainer.value = jsonres.Response.TargetText;
          });
        });
      });
    const translatePanel = contentEl.createEl('table', { cls: 'translate-panel' });
    const tbody = translatePanel.createEl('tbody');
    const tr = tbody.createEl('tr');
    const td1 = tr.createEl('td', { cls: 'from-language' });
    const td2 = tr.createEl('td', { cls: 'to-language' });
    const textContainer = td1.createEl('textarea', { cls: 'translate-text-container' });
    const resultContainer = td2.createEl('textarea', { cls: 'result-text-container' });
    textContainer.setAttr('placeholder', '请输入要翻译的文本');
    resultContainer.setAttr('placeholder', '翻译结果');
  }
  
  displayGoogleSettings(contentEl: HTMLElement) {
    contentEl.empty();

    contentEl.createEl('h3', { text: '还没写' });
  }
}

export const baiduFromOptions: Record<string, string> = {
  'auto': '自动检测',
  'zh': '中文',
  'en': '英语',
  'yue': '粤语',
  'wyw': '文言文',
  'jp': '日语',
  'kor': '韩语',
  'fra': '法语',
  'spa': '西班牙语',
  'th': '泰语',
  'ara': '阿拉伯语',
  'ru': '俄语',
  'pt': '葡萄牙语',
  'de': '德语',
  'it': '意大利语',
  'el': '希腊语',
  'nl': '荷兰语',
  'pl': '波兰语',
  'bul': '保加利亚语',
  'est': '爱沙尼亚语',
  'dan': '丹麦语',
  'fin': '芬兰语',
  'cs': '捷克语',
  'rom': '罗马尼亚语',
  'slo': '斯洛文尼亚语',
  'swe': '瑞典语',
  'hu': '匈牙利语',
  'cht': '繁体中文',
  'vie': '越南语'
}

export const baiduToOptions: Record<string, string> = {
  'zh': '中文',
  'en': '英语',
  'yue': '粤语',
  'wyw': '文言文',
  'jp': '日语',
  'kor': '韩语',
  'fra': '法语',
  'spa': '西班牙语',
  'th': '泰语',
  'ara': '阿拉伯语',
  'ru': '俄语',
  'pt': '葡萄牙语',
  'de': '德语',
  'it': '意大利语',
  'el': '希腊语',
  'nl': '荷兰语',
  'pl': '波兰语',
  'bul': '保加利亚语',
  'est': '爱沙尼亚语',
  'dan': '丹麦语',
  'fin': '芬兰语',
  'cs': '捷克语',
  'rom': '罗马尼亚语',
  'slo': '斯洛文尼亚语',
  'swe': '瑞典语',
  'hu': '匈牙利语',
  'cht': '繁体中文',
  'vie': '越南语'
}

export const tencentFromOptions: Record<string, string> = {
  'auto': '自动检测',
  'zh': '中文',
  'zh-TW': '繁体中文',
  'en': '英语',
  'ja': '日语',
  'ko': '韩语',
  'fr': '法语',
  'es': '西班牙语',
  'it': '意大利语',
  'de': '德语',
  'tr': '土耳其语',
  'ru': '俄语',
  'pt': '葡萄牙语',
  'vi': '越南语',
  'id': '印尼语',
  'th': '泰语',
  'ms': '马来西亚语',
  'ar': '阿拉伯语',
  'hi': '印地语',
}

export const tencentToOptions: Record<string, Record<string, string>> = {
  'auto': {
    'zh': '中文',
    'zh-TW': '繁体中文',
    'en': '英语',
    'ja': '日语',
    'ko': '韩语',
    'fr': '法语',
    'es': '西班牙语',
    'it': '意大利语',
    'de': '德语',
    'tr': '土耳其语',
    'ru': '俄语',
    'pt': '葡萄牙语',
    'vi': '越南语',
    'id': '印尼语',
    'th': '泰语',
    'ms': '马来西亚语',
    'ar': '阿拉伯语',
    'hi': '印地语',
  },
  'zh': {
    'zh-TW': '繁体中文',
    'en': '英语',
    'ja': '日语',
    'ko': '韩语',
    'fr': '法语',
    'es': '西班牙语',
    'it': '意大利语',
    'de': '德语,',
    'tr': '土耳其语',
    'ru': '俄语',
    'pt': '葡萄牙语',
    'vi': '越南语',
    'id': '印尼语',
    'th': '泰语',
    'ms': '马来语',
  },
  'zh-TW': {
    'zh': '简体中文',
    'en': '英语',
    'ja': '日语',
    'ko': '韩语',
    'fr': '法语',
    'es': '西班牙语',
    'it': '意大利语',
    'de': '德语,',
    'tr': '土耳其语',
    'ru': '俄语',
    'pt': '葡萄牙语',
    'vi': '越南语',
    'id': '印尼语',
    'th': '泰语',
    'ms': '马来语',
  },
  'en': {
    'zh': '中文',
    'zh-TW': '繁体中文',
    'ja': '日语',
    'ko': '韩语',
    'fr': '法语',
    'es': '西班牙语',
    'it': '意大利语',
    'de': '德语,',
    'tr': '土耳其语',
    'ru': '俄语',
    'pt': '葡萄牙语',
    'vi': '越南语',
    'id': '印尼语',
    'th': '泰语',
    'ms': '马来语',
    'ar': '阿拉伯语',
    'hi': '印地语',
  },
  'ja': {
    'zh': '中文',
    'zh-TW': '繁体中文',
    'en': '英语',
    'ko': '韩语',
  },
  'ko': {
    'zh': '中文',
    'zh-TW': '繁体中文',
    'en': '英语',
    'ja': '日语',
  },
  'fr': {
    'zh': '中文',
    'zh-TW': '繁体中文',
    'en': '英语',
    'es': '西班牙语',
    'it': '意大利语',
    'de': '德语',
    'tr': '土耳其语',
    'ru': '俄语',
    'pt': '葡萄牙语',
  },
  'es': {
    'zh': '中文',
    'zh-TW': '繁体中文',
    'en': '英语',
    'fr': '法语',
    'it': '意大利语',
    'de': '德语',
    'tr': '土耳其语',
    'ru': '俄语',
    'pt': '葡萄牙语',
  },
  'it': {
    'zh': '中文',
    'zh-TW': '繁体中文',
    'en': '英语',
    'fr': '法语',
    'es': '西班牙语',
    'de': '德语',
    'tr': '土耳其语',
    'ru': '俄语',
    'pt': '葡萄牙语',
  },
  'de': {
    'zh': '中文',
    'zh-TW': '繁体中文',
    'en': '英语',
    'fr': '法语',
    'es': '西班牙语',
    'it': '意大利语',
    'tr': '土耳其语',
    'ru': '俄语',
    'pt': '葡萄牙语',
  },
  'tr': {
    'zh': '中文',
    'zh-TW': '繁体中文',
    'en': '英语',
    'fr': '法语',
    'es': '西班牙语',
    'it': '意大利语',
    'de': '德语',
    'ru': '俄语',
    'pt': '葡萄牙语',
  },
  'ru': {
    'zh': '中文',
    'zh-TW': '繁体中文',
    'en': '英语',
    'fr': '法语',
    'es': '西班牙语',
    'it': '意大利语',
    'de': '德语',
    'tr': '土耳其语',
    'pt': '葡萄牙语',
  },
  'pt': {
    'zh': '中文',
    'zh-TW': '繁体中文',
    'en': '英语',
    'fr': '法语',
    'es': '西班牙语',
    'it': '意大利语',
    'de': '德语',
    'tr': '土耳其语',
    'ru': '俄语',
  },
  'vi': {
    'zh': '中文',
    'zh-TW': '繁体中文',
    'en': '英语',
  },
  'id': {
    'zh': '中文',
    'zh-TW': '繁体中文',
    'en': '英语',
  },
  'th': {
    'zh': '中文',
    'zh-TW': '繁体中文',
    'en': '英语',
  },
  'ms': {
    'zh': '中文',
    'zh-TW': '繁体中文',
    'en': '英语',
  },
  'ar': {
    'en': '英语',
  },
  'hi': {
    'en': '英语',
  }
}