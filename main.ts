import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder, FuzzySuggestModal, FuzzyMatch } from 'obsidian';

interface DefaultTemplateSettings {
	templateFolder: string;
	defaultTemplate: string;
	autoApplyTemplate: boolean;
	templateVariables: boolean;
}

const DEFAULT_SETTINGS: DefaultTemplateSettings = {
	templateFolder: 'Templates',
	defaultTemplate: '',
	autoApplyTemplate: true,
	templateVariables: true
}

export default class DefaultTemplatePlugin extends Plugin {
	settings: DefaultTemplateSettings;

	async onload() {
		await this.loadSettings();

		// Auto-detect template folder on startup
		await this.initializeTemplateFolder();

		// Command to create new note with template selection
		this.addCommand({
			id: 'new-note-with-template',
			name: 'Create new note with template',
			callback: () => this.showTemplateSelector()
		});

		// Command to set default template
		this.addCommand({
			id: 'set-default-template',
			name: 'Set default template',
			callback: () => this.setDefaultTemplate()
		});

		// Command to apply template to current note
		this.addCommand({
			id: 'apply-template-to-current',
			name: 'Apply template to current note',
			callback: () => this.applyTemplateToCurrentNote()
		});

		// Auto-apply template to new files if enabled
		if (this.settings.autoApplyTemplate) {
			this.registerEvent(
				this.app.vault.on('create', (file) => {
					if (file instanceof TFile && file.extension === 'md') {
						this.maybeApplyDefaultTemplate(file);
					}
				})
			);
		}

		// Add settings tab
		this.addSettingTab(new DefaultTemplateSettingTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async initializeTemplateFolder() {
		if (!this.settings.templateFolder) {
			const detectedFolder = await this.detectTemplateFolder();
			this.settings.templateFolder = detectedFolder;
			await this.saveSettings();
			new Notice(`Auto-detected template folder: ${detectedFolder}`);
		}
	}

	async detectTemplateFolder(): Promise<string> {
		const commonNames = ['Templates', 'templates', '_templates', 'Template'];
		
		for (const name of commonNames) {
			const folder = this.app.vault.getAbstractFileByPath(name);
			if (folder instanceof TFolder) {
				return name;
			}
		}
		
		return 'Templates';
	}

	async showTemplateSelector() {
		const modal = new TemplateSelectModal(this.app, this, (template) => {
			this.createNoteWithTemplate(template);
		});
		modal.open();
	}

	async setDefaultTemplate() {
		const modal = new TemplateSelectModal(this.app, this, (template) => {
			this.settings.defaultTemplate = template.path;
			this.saveSettings();
			new Notice(`Default template set to: ${template.basename}`);
		});
		modal.open();
	}

	async applyTemplateToCurrentNote() {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice('No active file');
			return;
		}

		const modal = new TemplateSelectModal(this.app, this, async (template) => {
			const templateContent = await this.app.vault.read(template);
			const processedContent = await this.processTemplate(templateContent);
			await this.app.vault.modify(activeFile, processedContent);
			new Notice(`Template applied: ${template.basename}`);
		});
		modal.open();
	}

	async createNoteWithTemplate(template: TFile) {
		const templateContent = await this.app.vault.read(template);
		const fileName = `Untitled-${Date.now()}.md`;
		
		const processedContent = await this.processTemplate(templateContent);
		const newFile = await this.app.vault.create(fileName, processedContent);
		
		// Open the new file
		const leaf = this.app.workspace.getLeaf();
		await leaf.openFile(newFile);
	}

	async maybeApplyDefaultTemplate(file: TFile) {
		if (!this.settings.defaultTemplate) return;
		
		// Only apply if file is empty
		const content = await this.app.vault.read(file);
		if (content.trim().length === 0) {
			const templateFile = this.app.vault.getAbstractFileByPath(this.settings.defaultTemplate);
			if (templateFile instanceof TFile) {
				const templateContent = await this.app.vault.read(templateFile);
				const processedContent = await this.processTemplate(templateContent);
				await this.app.vault.modify(file, processedContent);
			}
		}
	}

	async processTemplate(content: string): Promise<string> {
		if (!this.settings.templateVariables) {
			return content;
		}

		const now = new Date();
		
		return content
			.replace(/{{date}}/g, now.toISOString().split('T')[0])
			.replace(/{{time}}/g, now.toTimeString().split(' ')[0])
			.replace(/{{datetime}}/g, now.toISOString())
			.replace(/{{title}}/g, 'Untitled');
	}

	getTemplateFiles(): TFile[] {
		if (!this.settings.templateFolder) return [];
		
		return this.app.vault.getMarkdownFiles()
			.filter(file => file.path.startsWith(this.settings.templateFolder + '/'));
	}
}

class TemplateSelectModal extends FuzzySuggestModal<TFile> {
	plugin: DefaultTemplatePlugin;
	onChooseTemplate: (template: TFile) => void;

	constructor(app: App, plugin: DefaultTemplatePlugin, onChooseTemplate: (template: TFile) => void) {
		super(app);
		this.plugin = plugin;
		this.onChooseTemplate = onChooseTemplate;
	}

	getItems(): TFile[] {
		return this.plugin.getTemplateFiles();
	}

	getItemText(template: TFile): string {
		return template.basename;
	}

	onChooseItem(template: TFile): void {
		this.onChooseTemplate(template);
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

		containerEl.createEl('h2', { text: 'Default Template Settings' });

		new Setting(containerEl)
			.setName('Template folder')
			.setDesc('Folder containing your template files')
			.addText(text => text
				.setPlaceholder('Templates')
				.setValue(this.plugin.settings.templateFolder)
				.onChange(async (value) => {
					this.plugin.settings.templateFolder = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Auto-apply default template')
			.setDesc('Automatically apply default template to new empty files')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoApplyTemplate)
				.onChange(async (value) => {
					this.plugin.settings.autoApplyTemplate = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Process template variables')
			.setDesc('Replace {{date}}, {{time}}, {{datetime}}, {{title}} in templates')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.templateVariables)
				.onChange(async (value) => {
					this.plugin.settings.templateVariables = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Default template')
			.setDesc('Template to use automatically (click button to select)')
			.addButton(button => button
				.setButtonText('Select template')
				.onClick(() => {
					this.plugin.setDefaultTemplate();
				}));

		if (this.plugin.settings.defaultTemplate) {
			containerEl.createEl('p', {
				text: `Current default: ${this.plugin.settings.defaultTemplate}`,
				cls: 'setting-item-description'
			});
		}
	}
}
