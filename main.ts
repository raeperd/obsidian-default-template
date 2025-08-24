import { App, Notice, Plugin, PluginSettingTab, Setting, TFile, FuzzySuggestModal, moment } from 'obsidian';

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
				new Notice('Default Template: No template configured. Go to Settings → Default Template to select one.');
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
			} catch (error) {
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

class TemplateSelectModal extends FuzzySuggestModal<TFile> {
	plugin: DefaultTemplatePlugin;

	constructor(app: App, plugin: DefaultTemplatePlugin) {
		super(app);
		this.plugin = plugin;
	}

	getItems(): TFile[] {
		return this.app.vault.getMarkdownFiles();
	}

	getItemText(template: TFile): string {
		return template.path;
	}

	onChooseItem(template: TFile): void {
		this.plugin.settings.defaultTemplate = template.path;
		this.plugin.saveSettings();
		new Notice(`Default template set to: ${template.path}`);
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

		containerEl.createEl('h2', { text: 'Default Template' });

		new Setting(containerEl)
			.setName('Default template file')
			.setDesc('Select a template file to automatically apply to new empty notes')
			.addButton(button => button
				.setButtonText('Select template')
				.onClick(() => {
					new TemplateSelectModal(this.app, this.plugin).open();
				}));

		if (this.plugin.settings.defaultTemplate) {
			containerEl.createEl('div', {
				text: `✓ Active template: ${this.plugin.settings.defaultTemplate}`,
				cls: 'mod-success'
			});
		} else {
			containerEl.createEl('p', {
				text: 'No template selected. Plugin will not apply any template to new files.',
				cls: 'setting-item-description'
			});
		}
	}
}
