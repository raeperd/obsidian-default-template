import { AbstractInputSuggest, App, Notice, Plugin, PluginSettingTab, Setting, SettingDefinitionItem, TAbstractFile, TFile, TFolder, Vault, moment, normalizePath } from 'obsidian';

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

const getMoment = moment as unknown as () => { format: (format: string) => string };

export default class DefaultTemplatePlugin extends Plugin {
	settings!: DefaultTemplateSettings;

	async onload() {
		await this.loadSettings();
		this.app.workspace.onLayoutReady(() => {
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
				// Try folder templates from most specific to least specific; exact paths win over patterns.
				// `*` matches within one folder name and `**/` matches any number of folders.
				// A trailing `/**` is dropped because a folder template already covers its subfolders.
				while (parts.length > 0) {
					const folderPath = parts.join('/');
					const templatePath = this.settings.folderTemplates[folderPath] ||
						Object.entries(this.settings.folderTemplates).find(([pattern]) => new RegExp('^' + pattern
							.replace(/\/\*\*$/, '')
							.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
							.replace(/\*\*\/|\*/g, token => token === '*' ? '[^/]*' : '(.*/)?') + '$').test(folderPath))?.[1];
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
			if (!templateFile) return;
			try {
				// Read template content before calling process
				const templateContent = await this.app.vault.read(templateFile);
				
				// Use process() for atomic file modification
				await this.app.vault.process(file, (content) => {
					// Return unchanged if file is not empty
					if (content.trim().length !== 0) return content;
					
					// Process template variables
					const processedContent = templateContent
						.replace(/\{\{date(?::([^}]+))?\}\}/g, (_, format: string | undefined) => {
							return getMoment().format(format ?? 'YYYY-MM-DD');
						})
						.replace(/\{\{time(?::([^}]+))?\}\}/g, (_, format: string | undefined) => {
							return getMoment().format(format ?? 'HH:mm');
						})
						.replace(/\{\{title\}\}/g, file.basename);
					
					return processedContent;
				});
			} catch {
				new Notice(`Default Template: Template file "${templateFile.path}" not found or cannot be read.`);
			}
		})
			);
		});
		
		this.addSettingTab(new DefaultTemplateSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<DefaultTemplateSettings>);
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
		el.createDiv({ text: item.path });
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

	getSettingDefinitions(): SettingDefinitionItem[] {
		const settings = this.plugin.settings;
		return [
			{
				name: 'Default template file',
				desc: 'Select a template file to apply to new empty notes',
				control: {
					type: 'file',
					key: 'defaultTemplate',
					placeholder: 'path/to/template.md',
					filter: file => file.extension === 'md'
				}
			},
			{
				type: 'list',
				heading: 'Folder templates',
				emptyState: 'Override the default template for specific folders. Use * for any folder name and ** for any number of folders',
				addItem: {
					name: 'Add folder template',
					action: () => {
						settings.folderTemplates[''] = '';
						void this.plugin.saveSettings();
						this.update();
					}
				},
				onDelete: index => {
					delete settings.folderTemplates[Object.keys(settings.folderTemplates)[index]];
					void this.plugin.saveSettings();
					this.update();
				},
				items: Object.entries(settings.folderTemplates).map(([folderPath, templatePath]) => ({
					name: `Folder: ${folderPath}`,
					desc: 'Use * for any folder name and ** for any number of folders',
					render: (setting: Setting) => {
						let currentFolderPath = folderPath;
						setting
							.addText(text => {
								text.setPlaceholder('Folder/path')
									.setValue(folderPath)
									.onChange(async (newFolderPath) => {
										const normalizedPath = normalizePath(newFolderPath);
										if (normalizedPath === currentFolderPath) return;

										delete settings.folderTemplates[currentFolderPath];
										if (normalizedPath) {
											settings.folderTemplates[normalizedPath] = templatePath;
										}
										currentFolderPath = normalizedPath;
										await this.plugin.saveSettings();
									});
								const configuredFolders = Object.keys(settings.folderTemplates);
								new TAbstractFileSuggest(this.app, text.inputEl, (vault, inputLower) =>
									vault.getAllLoadedFiles()
										.filter((file): file is TFolder => file instanceof TFolder)
										.filter(folder => !configuredFolders.includes(folder.path) || folder.path === folderPath)
										.filter(folder => folder.path.toLowerCase().includes(inputLower))
								);
							})
							.addText(text => {
								text.setPlaceholder('path/to/template.md')
									.setValue(templatePath)
									.onChange(async (value) => {
										settings.folderTemplates[currentFolderPath] = normalizePath(value);
										await this.plugin.saveSettings();
									});
								new TAbstractFileSuggest(this.app, text.inputEl, (vault, inputLower) =>
									vault.getMarkdownFiles()
										.filter(file => file.path.toLowerCase().includes(inputLower))
								);
							});
					}
				}))
			},
			{
				type: 'list',
				heading: 'Ignore paths',
				emptyState: 'Folders where templates will not be applied',
				addItem: {
					name: 'Add ignore path',
					action: () => {
						// Don't add if empty string already exists
						if (settings.ignorePaths.includes('')) return;
						settings.ignorePaths.push('');
						void this.plugin.saveSettings();
						this.update();
					}
				},
				onDelete: index => {
					settings.ignorePaths.splice(index, 1);
					void this.plugin.saveSettings();
					this.update();
				},
				items: settings.ignorePaths.map(ignorePath => ({
					name: ignorePath,
					render: (setting: Setting) => {
						setting.addText(text => {
							text.setPlaceholder('Folder/path')
								.setValue(ignorePath)
								.onChange(async (newPath) => {
									const normalizedPath = normalizePath(newPath);
									const index = settings.ignorePaths.indexOf(ignorePath);

									if (normalizedPath) {
										// Check for duplicates
										if (!settings.ignorePaths.includes(normalizedPath) ||
											settings.ignorePaths[index] === normalizedPath) {
											settings.ignorePaths[index] = normalizedPath;
											await this.plugin.saveSettings();
										} else {
											new Notice('Path already ignored');
										}
									} else {
										// Remove if empty
										settings.ignorePaths.splice(index, 1);
										await this.plugin.saveSettings();
										this.update();
									}
								});

							new TAbstractFileSuggest(this.app, text.inputEl, (vault, inputLower) =>
								vault.getAllLoadedFiles()
									.filter((file): file is TFolder => file instanceof TFolder)
									.filter(folder => folder.path && folder.path !== '/')
									.filter(folder => folder.path.toLowerCase().includes(inputLower))
							);
						});
					}
				}))
			}
		];
	}
}
