import { App, Notice, Plugin, PluginSettingTab, Setting, TFile, FuzzySuggestModal } from 'obsidian';

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
		this.registerEvent(
			this.app.vault.on('create', (file) => {
				if (file instanceof TFile && file.extension === 'md') {
					this.maybeApplyDefaultTemplate(file);
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

	async maybeApplyDefaultTemplate(file: TFile) {
		if (!this.settings.defaultTemplate) {
			new Notice('Default Template: No template configured. Go to Settings → Default Template to select one.');
			return;
		}
		const content = await this.app.vault.read(file);
		if (content.trim().length === 0) {
			const templateFile = this.app.vault.getAbstractFileByPath(this.settings.defaultTemplate);
			if (templateFile instanceof TFile) {
				const templateContent = await this.app.vault.read(templateFile);
				const processedContent = this.processTemplate(templateContent, file);
				await this.app.vault.modify(file, processedContent);
			}
		}
	}

	processTemplate(content: string, file: TFile): string {
		const now = new Date();
		const fileName = file.basename;
		const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD
		const timeString = now.toTimeString().split(' ')[0].slice(0, 5); // HH:mm
		return content
			.replace(/\{\{date\}\}/g, dateString)
			.replace(/\{\{time\}\}/g, timeString)
			.replace(/\{\{title\}\}/g, fileName);
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
			containerEl.createEl('p', {
				text: `Current template: ${this.plugin.settings.defaultTemplate}`,
				cls: 'setting-item-description'
			});
		} else {
			containerEl.createEl('p', {
				text: 'No template selected. Plugin will not apply any template to new files.',
				cls: 'setting-item-description'
			});
		}
	}
}
