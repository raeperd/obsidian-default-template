import { AbstractInputSuggest, App, Notice, Plugin, PluginSettingTab, Setting, TAbstractFile, TFile, TFolder, Vault, moment, normalizePath } from 'obsidian';

interface DefaultTemplateSettings {
	defaultTemplate: string;
	folderTemplates: Record<string, string>;
	ignorePaths: string[];
}

const DEFAULT_SETTINGS: DefaultTemplateSettings = {
	defaultTemplate: '',
	folderTemplates: {},
	ignorePaths: []
}

export default class DefaultTemplatePlugin extends Plugin {
	settings: DefaultTemplateSettings;

	async onload() {
		await this.loadSettings();
		this.registerEvent(this.app.vault.on('create', async (file) => {
			if (!(file instanceof TFile) || file.extension !== 'md') return;

			// Check if file path should be ignored (prefix matching)
			const normalizedFilePath = normalizePath(file.path);
			const shouldIgnore = this.settings.ignorePaths.some(ignorePath => {
				const normalizedIgnorePath = normalizePath(ignorePath);
				return normalizedFilePath === normalizedIgnorePath ||
					normalizedFilePath.startsWith(normalizedIgnorePath + '/');
			});
			if (shouldIgnore) return;

			// Find template file with folder hierarchy fallback
			const getTemplateFile = (filePath: string): TFile | undefined => {
				const parts = filePath.split('/').slice(0, -1); // remove filename
				// Try folder templates from most specific to least specific
				while (parts.length > 0) {
					const folderPath = parts.join('/');
					const templatePath = this.settings.folderTemplates[folderPath];
					if (templatePath) {
						const templateFile = this.app.vault.getAbstractFileByPath(templatePath);
						if (templateFile instanceof TFile) return templateFile;
					}
					parts.pop();
				}
				// Fall back to default template
				if (this.settings.defaultTemplate) {
					const templateFile = this.app.vault.getAbstractFileByPath(this.settings.defaultTemplate);
					if (templateFile instanceof TFile) return templateFile;
				}
				return undefined;
			};
			
			const templateFile = getTemplateFile(file.path);
			if (!templateFile) {
				new Notice('No template configured. Go to settings to select one.');
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
				new Notice(`Default Template: Template file "${templateFile.path}" not found or cannot be read.`);
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

class TAbstractFileSuggest<T extends TAbstractFile> extends AbstractInputSuggest<T> {
	constructor(
		app: App, 
		private inputEl: HTMLInputElement,
		private getSuggestionsFn: (vault: Vault, inputLower: string) => T[]
	) {
		super(app, inputEl);
	}

	getSuggestions(inputStr: string): T[] {
		return this.getSuggestionsFn(this.app.vault, inputStr.toLowerCase());
	}

	renderSuggestion(item: T, el: HTMLElement): void {
		el.createEl("div", { text: item.path });
	}

	selectSuggestion(item: T): void {
		this.inputEl.value = item.path;
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
				
				new TAbstractFileSuggest(this.app, text.inputEl, (vault, inputLower) => 
					vault.getMarkdownFiles()
						.filter(file => file.path.toLowerCase().includes(inputLower))
				);
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
					text.setPlaceholder('Folder/path')
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
					new TAbstractFileSuggest(this.app, text.inputEl, (vault, inputLower) =>
						vault.getAllLoadedFiles()
							.filter((file): file is TFolder => file instanceof TFolder)
							.filter(folder => !Object.keys(this.plugin.settings.folderTemplates).includes(folder.path) || folder.path === folderPath)
							.filter(folder => folder.path.toLowerCase().includes(inputLower))
					);
				})
				.addText(text => {
					text.setPlaceholder('path/to/template.md')
						.setValue(templatePath)
						.onChange(async (value) => {
							this.plugin.settings.folderTemplates[folderPath] = normalizePath(value);
							await this.plugin.saveSettings();
						});
					new TAbstractFileSuggest(this.app, text.inputEl, (vault, inputLower) =>
						vault.getMarkdownFiles()
							.filter(file => file.path.toLowerCase().includes(inputLower))
					);
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

		new Setting(containerEl).setName('Ignore paths').setHeading();

		containerEl.createEl('p', {
			text: 'Folders where templates will not be applied',
			cls: 'setting-item-description'
		});

		// Display existing ignore paths
		for (const ignorePath of this.plugin.settings.ignorePaths) {
			new Setting(containerEl)
				.setName(ignorePath || '')
				.addText(text => {
					text.setPlaceholder('Folder/path')
						.setValue(ignorePath)
						.onChange(async (newPath) => {
							const normalizedPath = normalizePath(newPath);
							const index = this.plugin.settings.ignorePaths.indexOf(ignorePath);

							if (normalizedPath) {
								// Check for duplicates
								if (!this.plugin.settings.ignorePaths.includes(normalizedPath) ||
									this.plugin.settings.ignorePaths[index] === normalizedPath) {
									this.plugin.settings.ignorePaths[index] = normalizedPath;
									await this.plugin.saveSettings();
									this.display();
								} else {
									new Notice('Path already ignored');
								}
							} else {
								// Remove if empty
								this.plugin.settings.ignorePaths.splice(index, 1);
								await this.plugin.saveSettings();
								this.display();
							}
						});

					new TAbstractFileSuggest(this.app, text.inputEl, (vault, inputLower) =>
						vault.getAllLoadedFiles()
							.filter((file): file is TFolder => file instanceof TFolder)
							.filter(folder => folder.path && folder.path !== '/')
							.filter(folder => folder.path.toLowerCase().includes(inputLower))
					);
				})
				.addExtraButton(button => button
					.setIcon('trash')
					.setTooltip('Remove')
					.onClick(async () => {
						const index = this.plugin.settings.ignorePaths.indexOf(ignorePath);
						this.plugin.settings.ignorePaths.splice(index, 1);
						await this.plugin.saveSettings();
						this.display();
					})
				);
		}

		// Add ignore path button
		new Setting(containerEl)
			.addButton(button => button
				.setButtonText('Add ignore path')
				.setCta()
				.onClick(async () => {
					// Don't add if empty string already exists
					if (!this.plugin.settings.ignorePaths.includes('')) {
						this.plugin.settings.ignorePaths.push('');
						await this.plugin.saveSettings();
						this.display();
					}
				})
			);
	}
}
