# PixelForge AI Studio

![PixelForge AI Studio](./favicon.ico)

A professional-grade 2D pixel art and spritesheet editor powered by Google Gemini AI. Features include AI-assisted image generation, text-to-image editing, smart analysis, animation tools, and seamless asset export.

## 🌟 Features

### Core Editing Tools
- **Pixel-Perfect Canvas**: Create detailed pixel art with precision tools
- **Layer System**: Organize your artwork with multiple layers
- **Animation Timeline**: Create frame-by-frame animations with playback controls
- **Selection Tools**: Advanced selection with magic wand, lasso, and transformation tools
- **Palette Management**: Support for custom color palettes with the classic Pico-8 palette included

### AI-Powered Features
- **Text-to-Image Generation**: Generate pixel art from descriptive prompts
- **Smart Editing**: AI-powered object replacement, background changes, and transformations
- **Asset Analysis**: Get AI insights about your artwork
- **Inspiration Search**: Search for design ideas and reference materials
- **Multiple Art Styles**: Support for 8-bit, 16-bit, isometric, cyberpunk, and more styles

### Export Options
- **Single Frame**: Export individual frames as PNG
- **Animated GIFs**: Create animated GIFs from your sequences
- **Spritesheets**: Generate optimized spritesheets for game development
- **Frame Archives**: Export all frames as a ZIP package
- **Project Files**: Save and load complete projects in JSON format

### Import Capabilities
- **Spritesheet Import**: Import and slice existing spritesheets
- **Project Loading**: Load previously saved PixelForge projects

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Google Gemini API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Involvex/pixelforge-ai-studio.git
   cd pixelforge-ai-studio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3005`

### Production Build

```bash
npm run build
npm run preview
```

## 📖 User Guide

### Basic Workflow

1. **Canvas Setup**
   - Adjust canvas size using the controls in the top header
   - Default size is 32x32 pixels, perfect for retro game assets

2. **Tool Selection**
   - Use the left toolbar to select drawing tools:
     - **Pencil**: Free-hand drawing
     - **Eraser**: Remove pixels
     - **Bucket**: Fill areas with color
     - **Color Picker**: Sample colors from the canvas
     - **Selection**: Create rectangular selections
     - **Magic Wand**: Select areas by color similarity
     - **Move**: Move selections
     - **Transform**: Scale and rotate selections

3. **Color Management**
   - Select primary/secondary colors from the toolbar
   - Use the Palette panel to manage color schemes
   - The editor includes the classic Pico-8 palette by default

4. **Layer Management**
   - Add, remove, and reorder layers using the Layer panel
   - Toggle layer visibility and lock layers to prevent edits
   - Adjust layer opacity for blending effects

5. **Animation**
   - Add frames using the animation timeline at the bottom
   - Set frame delays and playback speed (FPS)
   - Use the play button to preview your animation

### AI Features Guide

#### Text-to-Image Generation
1. Open the AI panel (right sidebar)
2. Select the "Generate" tab
3. Enter a descriptive prompt (e.g., "A cute 8-bit dragon")
4. Choose your preferred style and settings
5. Click "Generate Asset" to create new artwork

#### Smart Editing
1. Switch to the "Edit" tab in the AI panel
2. Choose an editing mode:
   - **Free**: General modifications based on your prompt
   - **Object**: Replace specific objects (e.g., "Replace the cat with a dog")
   - **Background**: Change the background while preserving foreground objects
   - **Transform**: Modify existing objects (e.g., "Make the sword glow")
3. Enter your prompt and click "Magic Edit"

#### Asset Analysis
- Use the "Analyze" tab to get AI feedback on your artwork
- The AI can suggest improvements, identify elements, and provide creative insights

#### Inspiration Search
- Use the "Search" tab to find design ideas and reference materials
- Enter queries like "dungeon tiles" or "pixel art characters" for inspiration

### Export Options

1. **Single Frame (PNG)**
   - Click the camera icon in the export group
   - Exports the currently visible frame

2. **Animation (GIF)**
   - Click the clapperboard icon
   - Creates an animated GIF from all frames

3. **Spritesheet**
   - Click the "Sheet" button
   - Exports all frames in a horizontal spritesheet

4. **Frame Archive (ZIP)**
   - Click the archive icon
   - Downloads all frames as individual PNG files in a ZIP

5. **Project File**
   - Use the save/load buttons in the project group
   - Preserves all layers, frames, palettes, and settings

### Keyboard Shortcuts

- **Ctrl+Z**: Undo
- **Ctrl+Y**: Redo
- **Ctrl+S**: Save Project (browser download)
- **Spacebar**: Play/Pause animation (when timeline is focused)

## 🛠️ Technical Details

### Architecture

PixelForge AI Studio is built with modern web technologies:

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI Integration**: Google Gemini API
- **Animation**: Custom GIF encoding with gifenc
- **File Handling**: JSZip for archive operations

### Project Structure

```
pixelforge-ai-studio/
├── components/           # React components
│   ├── AIPanel.tsx      # AI functionality panel
│   ├── AnimationPanel.tsx # Animation timeline
│   ├── EditorCanvas.tsx # Main drawing canvas
│   ├── LayerPanel.tsx   # Layer management
│   ├── PalettePanel.tsx # Color palette management
│   └── Toolbar.tsx      # Drawing tools
├── services/
│   └── geminiService.ts # AI service integration
├── utils/
│   └── drawingUtils.ts  # Canvas utilities
├── types/
│   └── types.ts         # TypeScript definitions
├── App.tsx             # Main application component
└── main configuration files
```

### State Management

The application uses React's built-in state management with:
- **Local State**: Component-level state for UI interactions
- **History System**: Undo/redo functionality with state snapshots
- **Project State**: Centralized state for canvas, layers, and frames

### AI Integration

The AI features are powered by Google Gemini API:
- **Image Generation**: Creates new pixel art from text prompts
- **Image Editing**: Modifies existing artwork based on instructions
- **Asset Analysis**: Provides feedback and suggestions
- **Search**: Finds inspiration and reference materials

### Canvas Rendering

- Pixel-perfect rendering with no anti-aliasing
- Layer compositing with opacity support
- Selection mask system for advanced operations
- Grid overlay for precise pixel placement

## 🧪 Development

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint
- `npm run lint:fix`: Fix ESLint issues
- `npm run format`: Format code with Prettier
- `npm run typecheck`: TypeScript type checking
- `npm run format:check`: Check code formatting

### Code Style

The project uses:
- **ESLint**: Code linting with React and TypeScript rules
- **Prettier**: Code formatting
- **TypeScript**: Type safety and better development experience

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and patterns
- Add TypeScript types for all new features
- Include proper error handling
- Test your changes thoroughly
- Update documentation as needed

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Required for AI features
GEMINI_API_KEY=your_gemini_api_key

# Optional: Custom API endpoint
VITE_GEMINI_API_KEY=your_gemini_api_key

# Development settings
NODE_ENV=development
```

### Build Configuration

The project uses Vite for build configuration. Key settings:
- **Port**: 3005 (development)
- **Output Directory**: `dist/`
- **Module Preloading**: Enabled for production
- **React Plugin**: Automatic JSX transformation

## 🎨 Customization

### Adding New Tools

1. Define the tool in `types.ts`:
   ```typescript
   export enum ToolType {
     // ... existing tools
     NEW_TOOL = "NEW_TOOL"
   }
   ```

2. Add tool logic in `EditorCanvas.tsx`
3. Update the toolbar in `Toolbar.tsx`
4. Add any necessary utilities in `drawingUtils.ts`

### Adding New AI Features

1. Extend the AI service in `services/geminiService.ts`
2. Update the UI in `components/AIPanel.tsx`
3. Add appropriate TypeScript types
4. Update the prompt handling logic

### Custom Palettes

The palette system supports custom color schemes:
1. Use the Palette panel to create new palettes
2. Import/export palette JSON files
3. The default Pico-8 palette is included for retro game development

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Google Gemini**: For providing powerful AI capabilities
- **Pico-8**: For the classic color palette inspiration
- **Lucide**: For the beautiful icon set
- **React Team**: For the excellent framework
- **Vite Team**: For the lightning-fast build tool

## 📞 Support

For support, questions, or feature requests:
- Open an issue on GitHub
- Check the documentation
- Review the code examples in the components

---

**PixelForge AI Studio** - Where creativity meets artificial intelligence. Create, edit, and animate pixel art with the power of AI at your fingertips.