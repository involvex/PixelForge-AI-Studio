// ToolType removed

export interface PluginAPI {
  // Expose safe methods for plugins
  log: (message: string) => void;
  alert: (message: string) => void;
  // TODO: Add more capabilities like tool registration, layer manipulation
  // registerTool: (tool: ToolDefinition) => void;
}

export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
}

export interface PluginInstance {
  metadata: PluginMetadata;
  // The raw code or closure
  onLoad: (api: PluginAPI) => void;
  onUnload?: () => void;
  isActive: boolean;
}

class PluginManager {
  private api: PluginAPI;

  constructor() {
    this.api = {
      log: msg => console.log(`[Plugin]: ${msg}`),
      alert: msg => alert(`[Plugin]: ${msg}`),
    };
    this.loadPlugins();
  }

  private savePlugins() {
    // Optimization: We store the code directly in the plugin instance now.
    // No need to serialize from onLoad.toString() anymore.
  }

  // Refactoring to store code string
  private plugins: Map<string, PluginInstance & { code?: string }> = new Map();

  public registerPlugin(metadata: PluginMetadata, code: string) {
    try {
      const pluginFunction = new Function("api", code) as (
        api: PluginAPI,
      ) => void;

      const instance = {
        metadata,
        onLoad: pluginFunction,
        isActive: false,
        code, // Store raw code for persistence
      };

      this.plugins.set(metadata.id, instance);
      this.saveToStorage();
      console.log(`Plugin ${metadata.name} registered.`);
    } catch (e) {
      console.error(`Failed to register plugin ${metadata.name}:`, e);
      throw e;
    }
  }

  private saveToStorage() {
    try {
      const data = Array.from(this.plugins.values()).map(p => ({
        metadata: p.metadata,
        code: p.code,
      }));
      localStorage.setItem("pixelforge_plugins", JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save plugins", e);
    }
  }

  private loadPlugins() {
    try {
      const raw = localStorage.getItem("pixelforge_plugins");
      if (!raw) return;
      const data = JSON.parse(raw) as {
        metadata: PluginMetadata;
        code: string;
      }[];

      data.forEach(p => {
        try {
          // Don't re-save when loading
          const pluginFunction = new Function("api", p.code) as (
            api: PluginAPI,
          ) => void;
          this.plugins.set(p.metadata.id, {
            metadata: p.metadata,
            onLoad: pluginFunction,
            isActive: false,
            code: p.code,
          });
        } catch (e) {
          console.error("Failed to load plugin", p.metadata.name, e);
        }
      });
    } catch (e) {
      console.error("Error loading plugins from storage", e);
    }
  }

  public enablePlugin(id: string) {
    const plugin = this.plugins.get(id);
    if (plugin && !plugin.isActive) {
      try {
        plugin.onLoad(this.api);
        plugin.isActive = true;
        console.log(`Plugin ${plugin.metadata.name} enabled.`);
      } catch (e) {
        console.error(`Error enabling plugin ${id}:`, e);
      }
    }
  }

  public disablePlugin(id: string) {
    const plugin = this.plugins.get(id);
    if (plugin?.isActive) {
      if (plugin.onUnload) plugin.onUnload();
      plugin.isActive = false;
      console.log(`Plugin ${plugin.metadata.name} disabled.`);
    }
  }

  public getPlugins() {
    return Array.from(this.plugins.values());
  }
}

export const pluginManager = new PluginManager();
