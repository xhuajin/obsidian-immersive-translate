import { DEFAULT_SETTINGS, ImmersiveTranslateSettingTab, ImmersiveTranslateSettings } from './settings';
import { Notice, Plugin, SettingTab, setIcon } from 'obsidian';
import { translateSetting_baidu, translateSetting_google, translateSetting_tencent } from './translate/translateSetting';

import { createTranslateModal } from './translate/translateModal';

declare module 'obsidian' {
  interface App {
    setting: AppSetting;
    plugins: PluginsHandler;
  }
  interface AppSetting {
    lastTabId: string;
    activeTab: SettingTab;
    settingTabs: SettingTab[];
    tabContentContainer: HTMLElement;
    communityPluginTabContainer: HTMLElement;
    pluginTabs: SettingTab[];
    onOpen: () => void;
    onClose: () => void;
    openTabById: (tabId: string) => boolean;
    openTab: (tab: SettingTab) => void;
  }
  interface SettingTab {
    id: string;
    navEl: HTMLElement;
  }
  interface PluginsHandler {
    plugins: string[];
  }
}

export default class ImmersiveTranslate extends Plugin {
  settings: ImmersiveTranslateSettings;
  activeTab: SettingTab;

  async onload() {
    await this.loadSettings();
    this.saveSettings();
    this.addSettingTab(new ImmersiveTranslateSettingTab(this.app, this));

    this.addRibbonIcon('languages', 'Translate', async () => {
      createTranslateModal(this);
    });

    await this.createSettingTranslateBtn();
  }

  onunload() {
    this.app.setting.pluginTabs.forEach((tab) => {
      const pluginSettingTabEl = tab.containerEl;
      if (pluginSettingTabEl.classList.contains('imt-translated')) {
        pluginSettingTabEl.classList.remove('imt-translated');
      }
    });
    this.saveSettings();
  }

  async createSettingTranslateBtn() {
    const setting = this.app.setting;
    this.app.setting.communityPluginTabContainer.childNodes.forEach((tab: HTMLElement) => {
      this.registerDomEvent(tab, 'click', (e) => {
        e.preventDefault();
        setting.openTabById(this.app.setting.lastTabId) || setting.openTab(setting.settingTabs[0]);
        this.createTranslateBtn(this.app.setting.lastTabId);
      });
    });
    setting.onOpen = () => {
      setting.openTabById(setting.lastTabId) || setting.openTab(setting.settingTabs[0])
      this.createTranslateBtn(this.app.setting.lastTabId);

      this.app.setting.communityPluginTabContainer.childNodes.forEach((tab: HTMLElement) => {
        this.registerDomEvent(tab, 'click', (e) => {
          e.preventDefault();
          setting.openTabById(this.app.setting.lastTabId) || setting.openTab(setting.settingTabs[0]);
          this.createTranslateBtn(this.app.setting.lastTabId);
          this.app.setting.pluginTabs.forEach((tab) => {
            const pluginSettingTabEl = tab.containerEl;
            pluginSettingTabEl.classList.remove('imt-translated');
          });
        });
      });
    }

    setting.onClose = () => {
      this.app.setting.pluginTabs.forEach((tab) => {
        const pluginSettingTabEl = tab.containerEl;
        pluginSettingTabEl.classList.remove('imt-translated');
      });
    }
  }
  
  createTranslateBtn(tabId: string) {
    // 确保是 community-plugin 的设置面板
    if (this.app.plugins.plugins.hasOwnProperty(tabId)) {
      const menuEl = this.app.setting.tabContentContainer.createEl('div', { attr: { class: 'imt-menu' } });
      const translateBtn = menuEl.createEl('div', { attr: { class: 'imt-menu-item' } });
      setIcon(translateBtn, 'languages');
      this.registerDomEvent(translateBtn, 'click', () => {
        this.translateSetting(tabId);
      });
    }
  }

  // 翻译插件设置面板
  translateSetting(pluginid: string) {
    if (this.settings.server === 'none') {
      new Notice('请选择翻译服务');
      return;
    }

    const pluginTabs = this.app.setting.pluginTabs;
    const pluginTab = pluginTabs.find((tab) => tab.id === pluginid);
    if (!pluginTab) {
      return;
    }
    const pluginSettingTabEl = pluginTab.containerEl;
    if (pluginSettingTabEl.classList.contains('imt-translated')) {
      if (pluginSettingTabEl.classList.contains('imt-result-hide')) {
        pluginSettingTabEl.classList.remove('imt-result-hide');
      } else {
        pluginSettingTabEl.classList.add('imt-result-hide');
      }
      return;
    } else {
      pluginSettingTabEl.classList.add('imt-translated');
    }
    const settingsArray = pluginSettingTabEl.querySelectorAll('.setting-item .setting-item-info');
    let tranFunc: (plugin: ImmersiveTranslate, nameEl: HTMLElement, descriptionEl: HTMLElement) => void;
    let tranDelay = this.settings.delay;
    if (this.settings.server === 'baidu') {
      tranFunc = translateSetting_baidu;
      tranDelay = this.settings.baiduapi.delay;
    } 
    else if (this.settings.server === 'tencent') {
      tranFunc = translateSetting_tencent;
      tranDelay = this.settings.tencentapi.delay;
    }
    else if (this.settings.server === 'google') {
      tranFunc = translateSetting_google;
    }
    for (let i = 0; i < settingsArray.length; i++) {
      setTimeout(() => {
        // settingsArray[i] 是第 i 个设置项
        const nameEl = settingsArray[i].childNodes[0] as HTMLElement;
        const descriptionEl = settingsArray[i].childNodes[1] as HTMLElement;
        tranFunc(this, nameEl, descriptionEl);
      }, 2 * i * tranDelay);
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
