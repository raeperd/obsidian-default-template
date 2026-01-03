import { AbstractInputSuggest, App, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder, moment, normalizePath } from 'obsidian';

interface DefaultTemplateSettings {
	defaultTemplate: string;
	folderTemplates: Record<string, string>;
}

const DEFAULT_SETTINGS: DefaultTemplateSettings = {
	defaultTemplate: '',
	folderTemplates: {}
}

export default class DefaultTemplatePlugin extends Plugin {
	settings: DefaultTemplateSettings;

	async onload() {
		await this.loadSettings();
		this.registerEvent(this.app.vault.on('create', async (file) => {
			if (!(file instanceof TFile) || file.extension !== 'md') return;
			
			// Find template path with folder hierarchy fallback
			const getTemplateForPath = (filePath: string): string | undefined => {
				const parts = filePath.split('/').slice(0, -1); // remove filename
				while (parts.length > 0) {
					const folderPath = parts.join('/');
					if (this.settings.folderTemplates[folderPath]) {
						return this.settings.folderTemplates[folderPath];
					}
					parts.pop();
				}
				return this.settings.defaultTemplate || undefined;
			};
			
			const templatePath = getTemplateForPath(file.path);
			if (!templatePath) {
				new Notice('No template configured. Go to settings to select one.');
				return;
			}
			
			const templateFile = this.app.vault.getAbstractFileByPath(templatePath);
			if (!(templateFile instanceof TFile)) {
				new Notice(`Default Template: Template file "${templatePath}" not found. Please select a new template.`);
				return;
			}
			try {
				// Read template content before calling process
				const templateContent = await this.app.vault.read(templateFile);
				
				// Use process() for atomic file modification
				await this.app.vault.process(file, (content) => {
					// Return unchanged if file is not empty
					if (content.trim().length !== 0) return content;
					
					// Process template variables
					const processedContent = templateContent
						.replace(/\{\{date(?::([^}]+))?\}\}/g, (_, format) => {
							return format ? moment().format(format) : moment().format('YYYY-MM-DD');
						})
						.replace(/\{\{time(?::([^}]+))?\}\}/g, (_, format) => {
							return format ? moment().format(format) : moment().format('HH:mm');
						})
						.replace(/\{\{title\}\}/g, file.basename);
					
					return processedContent;
				});
			} catch {
				new Notice(`Default Template: Template file "${templatePath}" not found or cannot be read.`);
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

abstract class PathSuggest<T extends TFile | TFolder> extends AbstractInputSuggest<T> {
	constructor(app: App, private inputEl: HTMLInputElement) {
		super(app, inputEl);
	}

	abstract getSuggestions(inputStr: string): T[];

	renderSuggestion(item: T, el: HTMLElement): void {
		el.createEl("div", { text: item.path });
	}

	selectSuggestion(item: T): void {
		this.inputEl.value = item.path;
		this.inputEl.trigger('input');
		this.close();
	}
}

class FileSuggest extends PathSuggest<TFile> {
	getSuggestions(inputStr: string): TFile[] {
		const inputLower = inputStr.toLowerCase();
		return this.app.vault.getMarkdownFiles()
			.filter(file => file.path.toLowerCase().includes(inputLower));
	}
}

class FolderSuggest extends PathSuggest<TFolder> {
	getSuggestions(inputStr: string): TFolder[] {
		const inputLower = inputStr.toLowerCase();
		return this.app.vault.getAllLoadedFiles()
			.filter((file): file is TFolder => file instanceof TFolder)
			.filter(folder => folder.path.toLowerCase().includes(inputLower));
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

		new Setting(containerEl)
			.setName('Default template file')
			.setDesc('Select a template file to apply to new empty notes')
			.addText(text => {
				text.setPlaceholder('path/to/template.md')
					.setValue(this.plugin.settings.defaultTemplate)
					.onChange(async (value) => {
						this.plugin.settings.defaultTemplate = normalizePath(value);
						await this.plugin.saveSettings();
					});
				
				new FileSuggest(this.app, text.inputEl);
			});

		new Setting(containerEl).setName('Folder templates').setHeading();

		containerEl.createEl('p', {
			text: 'Override the default template for specific folders',
			cls: 'setting-item-description'
		});

		// Display existing folder templates
		const folderEntries = Object.entries(this.plugin.settings.folderTemplates);
		for (const [folderPath, templatePath] of folderEntries) {
			new Setting(containerEl)
				.setName(`Folder: ${folderPath}`)
				.addText(text => {
					text.setPlaceholder('folder/path')
						.setValue(folderPath)
						.onChange(async (newFolderPath) => {
							const normalizedPath = normalizePath(newFolderPath);
							if (normalizedPath !== folderPath) {
								delete this.plugin.settings.folderTemplates[folderPath];
								if (normalizedPath) {
									this.plugin.settings.folderTemplates[normalizedPath] = templatePath;
								}
								await this.plugin.saveSettings();
								this.display();
							}
						});
					new FolderSuggest(this.app, text.inputEl);
				})
				.addText(text => {
					text.setPlaceholder('path/to/template.md')
						.setValue(templatePath)
						.onChange(async (value) => {
							this.plugin.settings.folderTemplates[folderPath] = normalizePath(value);
							await this.plugin.saveSettings();
						});
					new FileSuggest(this.app, text.inputEl);
				})
				.addExtraButton(button => button
					.setIcon('trash')
					.setTooltip('Delete folder template')
					.onClick(async () => {
						delete this.plugin.settings.folderTemplates[folderPath];
						await this.plugin.saveSettings();
						this.display();
					})
				);
		}

		// Add folder template button
		new Setting(containerEl)
			.addButton(button => button
				.setButtonText('Add folder template')
				.setCta()
				.onClick(async () => {
					this.plugin.settings.folderTemplates[''] = '';
					await this.plugin.saveSettings();
					this.display();
				})
			);
	}
}
