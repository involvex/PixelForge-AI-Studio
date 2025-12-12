# Fix EditorCanvas Issues

## Issues to Fix

1. **Tool Selection Unresponsive**: Tools only refresh after layout reset
2. **Ctrl+MouseWheel Zoom Not Working**: Zoom functionality broken

## Root Cause Analysis

- Tool selection: State dependency issue in EditorCanvas causing unnecessary re-renders
- Wheel zoom: Event propagation conflicts and improper event handling

## Implementation Plan

### Step 1: Fix Tool Selection Responsiveness

- [ ] Optimize EditorCanvas dependency array to prevent excessive re-renders
- [ ] Remove selectedTool from canvas rendering dependencies
- [ ] Add direct tool state logging for debugging

### Step 2: Fix Ctrl+Wheel Zoom

- [ ] Simplify wheel event handling in EditorCanvas
- [ ] Remove duplicate event listeners
- [ ] Add explicit canvas-level wheel handling
- [ ] Add visual feedback for zoom attempts

### Step 3: Test and Verify

- [ ] Test tool selection responsiveness
- [ ] Test Ctrl+Wheel zoom functionality
- [ ] Verify no regressions in existing features

## Files to Modify

- `components/EditorCanvas.tsx` - Main fixes
- `components/Toolbar.tsx` - Debugging
- `App.tsx` - Potential state management improvements
