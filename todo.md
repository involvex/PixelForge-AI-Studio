# TODO

Reoptimiz organize Menubar Menus and dropdowns:
Move <div class="flex bg-gray-800 rounded p-0.5 border border-gray-700 items-center gap-0.5"><label class="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded cursor-pointer" title="Load Project"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder-open" aria-hidden="true"><path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"></path></svg><input title="Load Project" accept=".json" class="hidden" type="file"></label><button type="button" class="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded" title="Save Project"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-save" aria-hidden="true"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"></path><path d="M7 3v4a1 1 0 0 0 1 1h7"></path></svg></button><label class="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded cursor-pointer" title="Import Sheet"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-upload" aria-hidden="true"><path d="M12 3v12"></path><path d="m17 8-5-5-5 5"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path></svg><input accept="image/*" class="hidden" type="file"></label></div>
into the submenus

// File menu should have:

Menubar – File Component
Create FileMenu.tsx in /components/menubar.

Dropdown items:

New, Open, Open as Layers, Open Location, Open Recent

Save, Save As, Save Copy, Revert

Export, Export As

Create Template

Copy Image Location

Show in File Manager

Close View, Close All, Quit

// Transformation System (with hotkey binding)

Customizeable hotkey for a menu to toggle that allows transforming the current selection:

Transformation System
New module: transform.ts

Functions:

transformFrame(frameId, options)

transformLayer(layerId, options)

transformSelection(selectionId, options)

Options:

Upscale / Downscale

Horizontal / Vertical scaling (% or px)

Rotation (degrees)

Hotkey binding: Ctrl + T → opens transformation modal.

Differentiate Between Project files and Template files

project files should contain any information like raw project data , like .psd for photoshop or other toools )

// Templates
are to add image to the project (like a layer ) with specific configurations

that can be customized

Template System
Directory: /templates

Data model (TypeScript interface):

ts
interface Template {
id: string;
name: string;
icon: string;
width: number;
height: number;
resolutionX: number;
resolutionY: number;
colorSpace: 'RGB' | 'CMYK';
bitDepth: number;
gamma?: number;
comment?: string;
fillWith: 'Transparency' | 'Foreground' | 'Background' | 'Gray' | 'White' | 'Pattern';
}
CRUD functions:

createTemplate(template: Template)

loadTemplate(id: string)

editTemplate(id: string, updates: Partial<Template>)

UI: Template Manager modal with preview + metadata.

// Ensure Best Practices
TypeScript everywhere → enforce strict typing.

Modular design → each feature in its own folder. <- so every panel should be able to be attached detached , dragged resized, toggled or can be attaced other menu components like in vs code .

// Setup testing to ensure the project is fully functional and secure

Testing → Jest + Playwright for unit & UI tests.

keep code clean! easy to read !

## Always ensure best practices are followed

- use typescript for all code
- use proper naming conventions
- use proper code organization
- use proper code structure
- use proper code comments
- use proper code documentation

# Before starting any work, always read the todo.md file

# Before asking user for Feedback do the following

- build the project
- run the project
- typecheck the project
- lint the project
- Check formatting of the code
- test the project

# Before asking user for Feedback do the following

- Use the Browser to test the project
- Check if the project is running without errors
- Check if the project is running with the correct performance
- Check if the project is running with the correct security
- Check the Ui is responsive and user friendly, works as expected
