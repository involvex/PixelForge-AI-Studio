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

/**
 * Storage format for plugin data with versioning
 */
interface PluginStorageData {
  metadata: PluginMetadata;
  code: string;
  version: string; // Storage format version for migration
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

  private savePlugins(): void {
    this.saveToStorage();
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
      this.savePlugins();
      console.log(`Plugin ${metadata.name} registered.`);
    } catch (e) {
      console.error(`Failed to register plugin ${metadata.name}:`, e);
      throw e;
    }
  }

  /**
   * Validates plugin data before storage
   * @param plugin The plugin instance to validate
   * @returns true if valid, false otherwise
   */
  private validatePluginData(
    plugin: PluginInstance & { code?: string },
  ): boolean {
    if (!plugin.metadata?.id) {
      console.error("Plugin missing required id field");
      return false;
    }
    if (!plugin.code) {
      console.error(`Plugin ${plugin.metadata.id} has no code to persist`);
      return false;
    }
    return true;
  }

  /**
   * Serializes plugin data to storage format
   * @param plugin The plugin instance to serialize
   * @returns Serialized plugin data ready for storage
   */
  private serializePlugin(
    plugin: PluginInstance & { code?: string },
  ): PluginStorageData {
    if (!plugin.code) {
      throw new Error(`Plugin ${plugin.metadata.id} has no code to serialize`);
    }
    return {
      metadata: plugin.metadata,
      code: plugin.code,
      version: "1.0", // Storage format version
    };
  }

  /**
   * Saves all plugins to localStorage with improved error handling and validation
   * @throws Error if storage operation fails critically
   */
  private saveToStorage(): void {
    try {
      // Early exit if no plugins to save
      if (this.plugins.size === 0) {
        localStorage.removeItem("pixelforge_plugins");
        return;
      }

      // Filter and validate plugins before serialization
      const validPlugins = Array.from(this.plugins.values())
        .filter(p => this.validatePluginData(p))
        .map(p => this.serializePlugin(p));

      // Skip if no valid plugins
      if (validPlugins.length === 0) {
        console.warn("No valid plugins to save");
        return;
      }

      // Check storage quota before saving (5MB limit)
      const serializedData = JSON.stringify(validPlugins);
      if (serializedData.length > 5 * 1024 * 1024) {
        console.error("Plugin data exceeds storage quota");
        return;
      }

      localStorage.setItem("pixelforge_plugins", serializedData);
      console.debug(
        `Successfully saved ${validPlugins.length} plugins to storage`,
      );
    } catch (e) {
      console.error("Failed to save plugins to storage", e);
      // Re-throw with more context for critical failure handling
      throw new Error(
        `Plugin storage failed: ${e instanceof Error ? e.message : String(e)}`,
      );
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
