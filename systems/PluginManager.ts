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
  private plugins: Map<string, PluginInstance> = new Map();
  private api: PluginAPI;

  constructor() {
    this.api = {
      log: msg => console.log(`[Plugin]: ${msg}`),
      alert: msg => alert(`[Plugin]: ${msg}`),
    };
  }

  public registerPlugin(metadata: PluginMetadata, code: string) {
    // Basic sandbox: create a function from the code string
    // capable of receiving 'api' object.
    try {
      // Create a function that takes 'api' and executes the user code
      // We expect user code to be something like:
      // "api.log('Hello');"
      // Or better, wrapping it:
      // "(function(api) { ... })(api)"

      // Let's assume the user provides the body of the function.
      const pluginFunction = new Function("api", code) as (
        api: PluginAPI,
      ) => void;

      const instance: PluginInstance = {
        metadata,
        onLoad: pluginFunction,
        isActive: false,
      };

      this.plugins.set(metadata.id, instance);
      console.log(`Plugin ${metadata.name} registered.`);
    } catch (e) {
      console.error(`Failed to register plugin ${metadata.name}:`, e);
      throw e;
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
    if (plugin && plugin.isActive) {
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
