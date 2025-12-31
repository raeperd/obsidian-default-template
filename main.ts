import { AbstractInputSuggest, App, Notice, Plugin, PluginSettingTab, Setting, TFile, moment, normalizePath } from 'obsidian';

interface DefaultTemplateSettings {
	defaultTemplate: string;
}

const DEFAULT_SETTINGS: DefaultTemplateSettings = {
	defaultTemplate: ''
}

export default class DefaultTemplatePlugin extends Plugin {
	settings: DefaultTemplateSettings;

	async onload() {
		await this.loadSettings();
		this.registerEvent(this.app.vault.on('create', async (file) => {
			if (!(file instanceof TFile) || file.extension !== 'md') return;
			if (!this.settings.defaultTemplate) {
				new Notice('No template configured. Go to settings to select one.');
				return;
			}
			const content = await this.app.vault.read(file);
			if (content.trim().length !== 0) return;
			const templateFile = this.app.vault.getAbstractFileByPath(this.settings.defaultTemplate);
			if (!(templateFile instanceof TFile)) {
				new Notice(`Default Template: Template file "${this.settings.defaultTemplate}" not found. Please select a new template.`);
				return;
			}
			try {
				const templateContent = await this.app.vault.read(templateFile);
				const processedContent = templateContent
					.replace(/\{\{date(?::([^}]+))?\}\}/g, (_, format) => {
						return format ? moment().format(format) : moment().format('YYYY-MM-DD');
					})
					.replace(/\{\{time(?::([^}]+))?\}\}/g, (_, format) => {
						return format ? moment().format(format) : moment().format('HH:mm');
					})
					.replace(/\{\{title\}\}/g, file.basename);
				await this.app.vault.modify(file, processedContent);
			} catch {
				new Notice(`Default Template: Template file "${this.settings.defaultTemplate}" not found or cannot be read.`);
			}
		})
		);
		this.addSettingTab(new DefaultTemplateSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class FileSuggest extends AbstractInputSuggest<TFile> {
	private inputEl: HTMLInputElement;

	constructor(app: App, inputEl: HTMLInputElement) {
		super(app, inputEl);
		this.inputEl = inputEl;
	}

	getSuggestions(inputStr: string): TFile[] {
		const inputLower = inputStr.toLowerCase();
		return this.app.vault.getMarkdownFiles()
			.filter(file => file.path.toLowerCase().includes(inputLower));
	}

	renderSuggestion(file: TFile, el: HTMLElement): void {
		el.createEl("div", { text: file.path });
	}

	selectSuggestion(file: TFile): void {
		this.inputEl.value = file.path;
		this.inputEl.trigger('input');
		this.close();
	}
}

class DefaultTemplateSettingTab extends PluginSettingTab {
	plugin: DefaultTemplatePlugin;

	constructor(app: App, plugin: DefaultTemplatePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl).setName('Template').setHeading();

		new Setting(containerEl)
			.setName('Default template file')
			.setDesc('Select a template file to automatically apply to new empty notes')
			.addText(text => {
				text.setPlaceholder('path/to/template.md')
					.setValue(this.plugin.settings.defaultTemplate)
					.onChange(async (value) => {
						this.plugin.settings.defaultTemplate = normalizePath(value);
						await this.plugin.saveSettings();
					});
				
				new FileSuggest(this.app, text.inputEl);
			});
	}
}
