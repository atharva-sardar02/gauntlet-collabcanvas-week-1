import { useEffect, useRef, useState, useContext, useCallback, useMemo } from 'react';
import { Stage, Layer, Rect, Line, Circle, Text, Star, Transformer } from 'react-konva';
import Konva from 'konva';
import CanvasContext from '../../contexts/CanvasContext';
import CanvasControls from './CanvasControls';
import Toolbox from './Toolbox';
import Shape from './Shape';
import Cursor from '../Collaboration/Cursor';
import ShortcutToast, { type ToastMessage } from '../UI/ShortcutToast';
import HistoryManager from './HistoryManager';
import TextEditor from './TextEditor';
import ExportDialog, { type ExportScope, type PixelRatio } from './ExportDialog';
import ExportToast, { type ExportToastMessage } from '../UI/ExportToast';
import ContextMenu from './ContextMenu';
import { exportCanvas, exportSelection, downloadDataURL, generateFilename, getDataURLSize } from '../../services/export';
import { useCursors } from '../../hooks/useCursors';
import { usePresence } from '../../hooks/usePresence';
import { useKeyboard, useKeyRepeat } from '../../hooks/useKeyboard';
import { useAIAgent } from '../../contexts/AIAgentContext';
import {
  CANVAS_CENTER_X,
  CANVAS_CENTER_Y,
  GRID_SPACING,
  MIN_ZOOM,
  MAX_ZOOM,
  DEFAULT_ZOOM,
  MIN_SHAPE_SIZE,
  NUDGE_SMALL,
  NUDGE_LARGE,
  getViewportDimensions,
  getRandomShapeColor,
} from '../../utils/constants';
import type { ToolType } from '../../utils/tools';

interface CanvasProps {
  onExportRequest?: (handler: () => void, hasShapes: boolean) => void;
  isToolboxVisible?: boolean;
}

const Canvas = ({ onExportRequest, isToolboxVisible = true }: CanvasProps) => {
  const context = useContext(CanvasContext);
  
  if (!context) {
    throw new Error('Canvas must be used within a CanvasProvider');
  }

  const { shapes, selectedId, selectedIds, loading, error, setStageRef, selectShape, toggleShapeSelection, addShape, updateShape, deleteShape, duplicateShape, nudgeShape, alignShapes, distributeShapes, bringShapeToFront, sendShapeToBack, bringShapeForward, sendShapeBackward, getShapeLayerInfo, clearAllShapes } = context;
  const stageRef = useRef<Konva.Stage>(null);
  const multiSelectTransformerRef = useRef<Konva.Transformer>(null);
  const [dimensions, setDimensions] = useState(getViewportDimensions());
  const [scale, setScale] = useState(DEFAULT_ZOOM);
  const [isPanning, setIsPanning] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);
  
  // Tool selection state
  const [selectedTool, setSelectedTool] = useState<ToolType>('select');
  
  // Shape drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [newShape, setNewShape] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  
  // Toast notification state
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);
  
  // Text editor state
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  
  // Export dialog state
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportToastMessage, setExportToastMessage] = useState<ExportToastMessage | null>(null);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; shapeId: string } | null>(null);
  
  // Force re-render when stage transforms (for cursor positioning and grid updates)
  const [, setUpdateTrigger] = useState(0);
  const [gridUpdateTrigger, setGridUpdateTrigger] = useState(0);

  // Cursor tracking
  const { cursors, userColor, updateCursorPosition } = useCursors();

  // Presence tracking (use same color as cursor) - maintains user presence in Firestore
  usePresence(userColor);

  // AI Agent for command bar
  const { openCommandBar } = useAIAgent();

  /**
   * Multi-select transformer - attach to all selected shapes
   */
  useEffect(() => {
    const transformer = multiSelectTransformerRef.current;
    if (!transformer) return;

    // Only use multi-select transformer when 2+ shapes are selected
    if (selectedIds.length >= 2 && stageRef.current) {
      const stage = stageRef.current;
      const layers = stage.getLayers();
      if (layers.length === 0) return;

      // Find all selected shape nodes from all layers
      const selectedNodes: Konva.Node[] = [];
      selectedIds.forEach(id => {
        for (const layer of layers) {
          const node = layer.findOne(`#${id}`);
          if (node) {
            selectedNodes.push(node);
            break; // Found the node, no need to check other layers
          }
        }
      });

      // Attach transformer to all selected nodes
      transformer.nodes(selectedNodes);
      transformer.getLayer()?.batchDraw();
    } else {
      // Clear transformer if less than 2 shapes selected
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
    }
  }, [selectedIds, shapes]);

  /**
   * Sort shapes by zIndex for correct rendering order
   * Lower zIndex renders first (behind), higher zIndex renders last (in front)
   */
  const sortedShapes = useMemo(() => {
    return [...shapes].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  }, [shapes]);

  /**
   * Show a toast notification
   */
  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'success') => {
    setToastMessage({
      id: `toast-${Date.now()}`,
      message,
      type,
    });
  }, []);

  /**
   * Handle duplicate shortcut (Ctrl/Cmd + D)
   */
  const handleDuplicate = useCallback(async () => {
    // Use selectedIds if available, otherwise fall back to selectedId
    const idsToProcess = selectedIds.length > 0 ? selectedIds : (selectedId ? [selectedId] : []);
    if (idsToProcess.length === 0) return;
    
    const shapesToDuplicate = shapes.filter(s => idsToProcess.includes(s.id));
    if (shapesToDuplicate.length === 0) return;
    
    // Check if any shapes are locked
    const lockedShapes = shapesToDuplicate.filter(s => s.isLocked);
    if (lockedShapes.length > 0) {
      showToast(`Cannot duplicate ${lockedShapes.length} locked shape${lockedShapes.length > 1 ? 's' : ''}`, 'error');
      return;
    }

    // Duplicate all selected shapes
    for (const id of idsToProcess) {
      await duplicateShape(id);
    }
    showToast(`Duplicated ${idsToProcess.length} shape${idsToProcess.length > 1 ? 's' : ''}`, 'success');
  }, [selectedIds, selectedId, shapes, duplicateShape, showToast]);

  /**
   * Handle delete shortcut (Delete/Backspace)
   */
  const handleDelete = useCallback(async () => {
    // Use selectedIds if available, otherwise fall back to selectedId
    const idsToProcess = selectedIds.length > 0 ? selectedIds : (selectedId ? [selectedId] : []);
    if (idsToProcess.length === 0) return;
    
    const shapesToDelete = shapes.filter(s => idsToProcess.includes(s.id));
    if (shapesToDelete.length === 0) return;
    
    // Check if any shapes are locked
    const lockedShapes = shapesToDelete.filter(s => s.isLocked);
    if (lockedShapes.length > 0) {
      showToast(`Cannot delete ${lockedShapes.length} locked shape${lockedShapes.length > 1 ? 's' : ''}`, 'error');
      return;
    }

    // Delete all selected shapes
    for (const id of idsToProcess) {
      await deleteShape(id);
    }
    showToast(`Deleted ${idsToProcess.length} shape${idsToProcess.length > 1 ? 's' : ''}`, 'success');
  }, [selectedIds, selectedId, shapes, deleteShape, showToast]);

  /**
   * Handle escape to deselect
   */
  const handleEscape = useCallback(() => {
    if (selectedId) {
      selectShape(null);
      showToast('Selection cleared', 'info');
    }
  }, [selectedId, selectShape, showToast]);

  /**
   * Handle alignment actions
   */
  const handleAlign = useCallback(async (mode: 'left' | 'right' | 'top' | 'bottom' | 'center-h' | 'center-v') => {
    if (selectedIds.length < 2) {
      showToast('Select 2+ shapes to align', 'error');
      return;
    }

    await alignShapes(selectedIds, mode);
    const modeLabel = {
      'left': 'left',
      'right': 'right',
      'top': 'top',
      'bottom': 'bottom',
      'center-h': 'center horizontal',
      'center-v': 'center vertical',
    }[mode];
    showToast(`Aligned ${selectedIds.length} shapes ${modeLabel}`, 'success');
  }, [selectedIds, alignShapes, showToast]);

  /**
   * Handle distribution actions
   */
  const handleDistribute = useCallback(async (axis: 'horizontal' | 'vertical') => {
    if (selectedIds.length < 3) {
      showToast('Select 3+ shapes to distribute', 'error');
      return;
    }

    await distributeShapes(selectedIds, axis);
    showToast(`Distributed ${selectedIds.length} shapes ${axis}ly`, 'success');
  }, [selectedIds, distributeShapes, showToast]);

  /**
   * Layer Management Handlers
   */
  const handleBringToFront = useCallback(async () => {
    const idsToProcess = selectedIds.length > 0 ? selectedIds : (selectedId ? [selectedId] : []);
    if (idsToProcess.length === 0) return;
    
    for (const id of idsToProcess) {
      await bringShapeToFront(id);
    }
    showToast(`Brought ${idsToProcess.length} shape${idsToProcess.length > 1 ? 's' : ''} to front`, 'success');
  }, [selectedIds, selectedId, bringShapeToFront, showToast]);

  const handleSendToBack = useCallback(async () => {
    const idsToProcess = selectedIds.length > 0 ? selectedIds : (selectedId ? [selectedId] : []);
    if (idsToProcess.length === 0) return;
    
    for (const id of idsToProcess) {
      await sendShapeToBack(id);
    }
    showToast(`Sent ${idsToProcess.length} shape${idsToProcess.length > 1 ? 's' : ''} to back`, 'success');
  }, [selectedIds, selectedId, sendShapeToBack, showToast]);

  const handleBringForward = useCallback(async () => {
    const idsToProcess = selectedIds.length > 0 ? selectedIds : (selectedId ? [selectedId] : []);
    if (idsToProcess.length === 0) return;
    
    for (const id of idsToProcess) {
      await bringShapeForward(id);
    }
    showToast(`Brought ${idsToProcess.length} shape${idsToProcess.length > 1 ? 's' : ''} forward`, 'success');
  }, [selectedIds, selectedId, bringShapeForward, showToast]);

  const handleSendBackward = useCallback(async () => {
    const idsToProcess = selectedIds.length > 0 ? selectedIds : (selectedId ? [selectedId] : []);
    if (idsToProcess.length === 0) return;
    
    for (const id of idsToProcess) {
      await sendShapeBackward(id);
    }
    showToast(`Sent ${idsToProcess.length} shape${idsToProcess.length > 1 ? 's' : ''} backward`, 'success');
  }, [selectedIds, selectedId, sendShapeBackward, showToast]);

  /**
   * Handle clear canvas with confirmation
   */
  const handleClearCanvas = useCallback(async () => {
    if (shapes.length === 0) {
      showToast('Canvas is already empty', 'info');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete all ${shapes.length} shape${shapes.length > 1 ? 's' : ''}? This action cannot be undone.`
    );

    if (confirmed) {
      await clearAllShapes();
      showToast('Canvas cleared', 'success');
    }
  }, [shapes.length, clearAllShapes, showToast]);

  /**
   * Handle context menu (right-click on shape)
   */
  const handleContextMenu = useCallback((e: Konva.KonvaEventObject<PointerEvent>, shapeId: string) => {
    e.evt.preventDefault();
    
    // Select the shape
    selectShape(shapeId);
    
    // Show context menu at cursor position
    setContextMenu({
      x: e.evt.clientX,
      y: e.evt.clientY,
      shapeId,
    });
  }, [selectShape]);

  /**
   * Close context menu
   */
  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  /**
   * Handle arrow key nudging with repeat
   */
  const handleNudge = useCallback((key: string, shiftKey: boolean) => {
    // Use selectedIds if available, otherwise fall back to selectedId
    const idsToProcess = selectedIds.length > 0 ? selectedIds : (selectedId ? [selectedId] : []);
    if (idsToProcess.length === 0) return;
    
    const shapesToNudge = shapes.filter(s => idsToProcess.includes(s.id));
    if (shapesToNudge.length === 0) return;
    
    // Check if any shapes are locked
    const hasLockedShapes = shapesToNudge.some(s => s.isLocked);
    if (hasLockedShapes) return; // Silently skip if any shape is locked

    const amount = shiftKey ? NUDGE_LARGE : NUDGE_SMALL;
    
    let direction: 'up' | 'down' | 'left' | 'right' | null = null;
    
    switch (key) {
      case 'ArrowUp':
        direction = 'up';
        break;
      case 'ArrowDown':
        direction = 'down';
        break;
      case 'ArrowLeft':
        direction = 'left';
        break;
      case 'ArrowRight':
        direction = 'right';
        break;
    }

    if (direction) {
      // Nudge all selected shapes
      for (const id of idsToProcess) {
        nudgeShape(id, direction, amount);
      }
    }
  }, [selectedIds, selectedId, shapes, nudgeShape]);

  /**
   * Handle undo shortcut
   */
  const handleUndo = useCallback(async () => {
    const historyManager = (window as any).__historyManager;
    if (historyManager && historyManager.canUndo) {
      const success = await historyManager.undo();
      if (success) {
        const description = historyManager.getUndoDescription?.() || 'action';
        showToast(`Undid: ${description}`, 'info');
      } else {
        showToast('Cannot undo: shape may have been modified', 'error');
      }
    }
  }, [showToast]);

  /**
   * Handle redo shortcut
   */
  const handleRedo = useCallback(async () => {
    const historyManager = (window as any).__historyManager;
    if (historyManager && historyManager.canRedo) {
      const success = await historyManager.redo();
      if (success) {
        const description = historyManager.getRedoDescription?.() || 'action';
        showToast(`Redid: ${description}`, 'info');
      }
    }
  }, [showToast]);

  /**
   * Open the export dialog
   */
  const handleOpenExportDialog = useCallback(() => {
    if (shapes.length === 0) {
      showToast('No shapes to export', 'error');
      return;
    }
    setShowExportDialog(true);
  }, [shapes.length, showToast]);

  /**
   * Handle export action
   */
  const handleExport = useCallback(async (scope: ExportScope, pixelRatio: PixelRatio) => {
    if (!stageRef.current) {
      setExportToastMessage({
        id: `export-error-${Date.now()}`,
        message: 'Canvas not ready for export',
        type: 'error',
      });
      return;
    }

    setIsExporting(true);

    try {
      let dataURL: string;
      let filename: string;

      if (scope === 'canvas') {
        // Export full canvas
        dataURL = await exportCanvas(stageRef, shapes, { pixelRatio });
        filename = generateFilename('collabcanvas-full');
      } else {
        // Export selected shape(s)
        const selectedShape = shapes.find(s => s.id === selectedId);
        if (!selectedShape) {
          setExportToastMessage({
            id: `export-error-${Date.now()}`,
            message: 'No shapes selected for export',
            type: 'error',
          });
          setIsExporting(false);
          setShowExportDialog(false);
          return;
        }
        
        dataURL = await exportSelection([selectedShape], stageRef, { pixelRatio });
        filename = generateFilename('collabcanvas-selection');
      }

      // Download the file
      downloadDataURL(dataURL, filename);

      // Get file size
      const fileSize = getDataURLSize(dataURL);

      // Show success toast
      setExportToastMessage({
        id: `export-success-${Date.now()}`,
        message: `Exported ${filename}`,
        type: 'success',
        fileSize,
      });

      // Close dialog
      setShowExportDialog(false);
    } catch (error) {
      console.error('Export failed:', error);
      setExportToastMessage({
        id: `export-error-${Date.now()}`,
        message: error instanceof Error ? error.message : 'Export failed',
        type: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  }, [shapes, selectedId]);

  // Keyboard shortcuts registration
  useKeyboard([
    {
      key: 'Delete',
      handler: handleDelete,
      description: 'Delete selected shape',
    },
    {
      key: 'Backspace',
      handler: handleDelete,
      description: 'Delete selected shape',
    },
    {
      key: 'd',
      ctrlKey: true,
      handler: (e) => {
        e.preventDefault();
        handleDuplicate();
      },
      description: 'Duplicate selected shape (Ctrl+D)',
    },
    {
      key: 'd',
      metaKey: true,
      handler: (e) => {
        e.preventDefault();
        handleDuplicate();
      },
      description: 'Duplicate selected shape (Cmd+D)',
    },
    {
      key: 'z',
      ctrlKey: true,
      handler: (e) => {
        e.preventDefault();
        handleUndo();
      },
      description: 'Undo (Ctrl+Z)',
    },
    {
      key: 'z',
      metaKey: true,
      handler: (e) => {
        e.preventDefault();
        handleUndo();
      },
      description: 'Undo (Cmd+Z)',
    },
    {
      key: 'z',
      ctrlKey: true,
      shiftKey: true,
      handler: (e) => {
        e.preventDefault();
        handleRedo();
      },
      description: 'Redo (Ctrl+Shift+Z)',
    },
    {
      key: 'z',
      metaKey: true,
      shiftKey: true,
      handler: (e) => {
        e.preventDefault();
        handleRedo();
      },
      description: 'Redo (Cmd+Shift+Z)',
    },
    {
      key: 'Escape',
      handler: handleEscape,
      description: 'Deselect shape',
    },
    {
      key: '/',
      ctrlKey: true,
      handler: (e) => {
        e.preventDefault();
        openCommandBar();
      },
      description: 'Open AI Command Bar (Ctrl+/)',
    },
    {
      key: '/',
      metaKey: true,
      handler: (e) => {
        e.preventDefault();
        openCommandBar();
      },
      description: 'Open AI Command Bar (Cmd+/)',
    },
    {
      key: 'v',
      handler: () => setSelectedTool('select'),
      description: 'Select tool (V)',
    },
    {
      key: 'r',
      handler: () => setSelectedTool('rectangle'),
      description: 'Rectangle tool (R)',
    },
    {
      key: 'c',
      handler: () => setSelectedTool('circle'),
      description: 'Circle tool (C)',
    },
    {
      key: 't',
      handler: () => setSelectedTool('triangle'),
      description: 'Triangle tool (T)',
    },
    {
      key: 's',
      handler: () => setSelectedTool('star'),
      description: 'Star tool (S)',
    },
    {
      key: 'x',
      handler: () => setSelectedTool('text'),
      description: 'Text tool (X)',
    },
    {
      key: 'e',
      ctrlKey: true,
      handler: (e) => {
        e.preventDefault();
        handleOpenExportDialog();
      },
      description: 'Export Canvas (Ctrl+E)',
    },
    {
      key: 'e',
      metaKey: true,
      handler: (e) => {
        e.preventDefault();
        handleOpenExportDialog();
      },
      description: 'Export Canvas (Cmd+E)',
    },
    // Alignment shortcuts (optional)
    {
      key: 'l',
      ctrlKey: true,
      shiftKey: true,
      handler: (e) => {
        e.preventDefault();
        handleAlign('left');
      },
      description: 'Align Left (Ctrl+Shift+L)',
    },
    {
      key: 'l',
      metaKey: true,
      shiftKey: true,
      handler: (e) => {
        e.preventDefault();
        handleAlign('left');
      },
      description: 'Align Left (Cmd+Shift+L)',
    },
    {
      key: 'r',
      ctrlKey: true,
      shiftKey: true,
      handler: (e) => {
        e.preventDefault();
        handleAlign('right');
      },
      description: 'Align Right (Ctrl+Shift+R)',
    },
    {
      key: 'r',
      metaKey: true,
      shiftKey: true,
      handler: (e) => {
        e.preventDefault();
        handleAlign('right');
      },
      description: 'Align Right (Cmd+Shift+R)',
    },
    // Layer Management Shortcuts
    {
      key: ']',
      ctrlKey: true,
      handler: (e) => {
        e.preventDefault();
        handleBringForward();
      },
      description: 'Bring Forward (Ctrl+])',
    },
    {
      key: ']',
      metaKey: true,
      handler: (e) => {
        e.preventDefault();
        handleBringForward();
      },
      description: 'Bring Forward (Cmd+])',
    },
    {
      key: '[',
      ctrlKey: true,
      handler: (e) => {
        e.preventDefault();
        handleSendBackward();
      },
      description: 'Send Backward (Ctrl+[)',
    },
    {
      key: '[',
      metaKey: true,
      handler: (e) => {
        e.preventDefault();
        handleSendBackward();
      },
      description: 'Send Backward (Cmd+[)',
    },
    {
      key: ']',
      ctrlKey: true,
      shiftKey: true,
      handler: (e) => {
        e.preventDefault();
        handleBringToFront();
      },
      description: 'Bring to Front (Ctrl+Shift+])',
    },
    {
      key: ']',
      metaKey: true,
      shiftKey: true,
      handler: (e) => {
        e.preventDefault();
        handleBringToFront();
      },
      description: 'Bring to Front (Cmd+Shift+])',
    },
    {
      key: '[',
      ctrlKey: true,
      shiftKey: true,
      handler: (e) => {
        e.preventDefault();
        handleSendToBack();
      },
      description: 'Send to Back (Ctrl+Shift+[)',
    },
    {
      key: '[',
      metaKey: true,
      shiftKey: true,
      handler: (e) => {
        e.preventDefault();
        handleSendToBack();
      },
      description: 'Send to Back (Cmd+Shift+[)',
    },
  ]);

  // Arrow key repeat for nudging
  useKeyRepeat(
    handleNudge,
    ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
  );

  // Set the stage ref in context
  useEffect(() => {
    if (stageRef.current) {
      setStageRef(stageRef as React.RefObject<Konva.Stage>);
    }
  }, [setStageRef]);

  // Provide export handler to parent (Navbar)
  useEffect(() => {
    if (onExportRequest) {
      onExportRequest(handleOpenExportDialog, shapes.length > 0);
    }
  }, [onExportRequest, handleOpenExportDialog, shapes.length]);

  // Listen for text edit events
  useEffect(() => {
    const handleEditText = (e: Event) => {
      const customEvent = e as CustomEvent;
      setEditingTextId(customEvent.detail.shapeId);
    };

    window.addEventListener('editText', handleEditText);
    return () => window.removeEventListener('editText', handleEditText);
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions(getViewportDimensions());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update canvas cursor based on selected tool
  useEffect(() => {
    if (stageRef.current && !spacePressed && !isPanning) {
      let cursor = 'default';
      if (selectedTool === 'rectangle' || selectedTool === 'circle' || selectedTool === 'triangle' || selectedTool === 'star') {
        cursor = 'crosshair';
      } else if (selectedTool === 'text') {
        cursor = 'text';
      }
      stageRef.current.container().style.cursor = cursor;
    }
  }, [selectedTool, spacePressed, isPanning]);

  // Handle spacebar panning (keep separate from keyboard shortcuts to avoid conflicts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle space if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Spacebar panning
      if (e.code === 'Space' && !spacePressed && !isDrawing) {
        e.preventDefault();
        setSpacePressed(true);
        if (stageRef.current) {
          stageRef.current.container().style.cursor = 'grab';
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Don't handle space if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setSpacePressed(false);
        setIsPanning(false);
        if (stageRef.current) {
          let cursor = 'default';
          if (selectedTool === 'rectangle' || selectedTool === 'circle' || selectedTool === 'triangle' || selectedTool === 'star') {
            cursor = 'crosshair';
          } else if (selectedTool === 'text') {
            cursor = 'text';
          }
          stageRef.current.container().style.cursor = cursor;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [spacePressed, isDrawing, selectedTool]);

  // Handle AI Agent navigation to created shapes
  useEffect(() => {
    const handlePanToLocation = (e: Event) => {
      const customEvent = e as CustomEvent<{ x: number; y: number }>;
      const { x, y } = customEvent.detail;
      
      if (stageRef.current) {
        const stage = stageRef.current;
        
        // Calculate position to center the target location in viewport
        const newX = dimensions.width / 2 - x * scale;
        const newY = dimensions.height / 2 - y * scale;
        
        // Animate pan to location
        stage.to({
          x: newX,
          y: newY,
          duration: 0.5,
          easing: Konva.Easings.EaseInOut,
        });
        
        console.log(`✨ Panned to (${Math.round(x)}, ${Math.round(y)})`);
      }
    };

    window.addEventListener('panToLocation', handlePanToLocation);

    return () => {
      window.removeEventListener('panToLocation', handlePanToLocation);
    };
  }, [dimensions, scale]);

  // Calculate initial position to center the canvas
  const initialX = -CANVAS_CENTER_X + dimensions.width / 2;
  const initialY = -CANVAS_CENTER_Y + dimensions.height / 2;

  /**
   * Constrain stage position to canvas boundaries
   */
  /**
   * Get relative pointer position on the canvas
   */
  const getRelativePointerPosition = () => {
    const stage = stageRef.current;
    if (!stage) return null;

    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();

    const pos = stage.getPointerPosition();
    if (!pos) return null;

    return transform.point(pos);
  };

  /**
   * Convert canvas coordinates to screen coordinates
   * Used for rendering cursors at the correct screen position
   */
  const canvasToScreenCoords = (canvasX: number, canvasY: number) => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };

    const transform = stage.getAbsoluteTransform();
    const screenPos = transform.point({ x: canvasX, y: canvasY });

    return screenPos;
  };

  /**
   * Handle mouse down - start drawing shape or panning
   */
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Panning with middle mouse button or space + left click
    if (e.evt.button === 1 || (spacePressed && e.evt.button === 0)) {
      e.evt.preventDefault();
      setIsPanning(true);
      if (stageRef.current) {
        stageRef.current.container().style.cursor = 'grabbing';
      }
      return;
    }

    // Start drawing shape with left click on empty canvas (if a drawing tool is selected)
    if (e.evt.button === 0 && !spacePressed && e.target === e.target.getStage() && 
        (selectedTool === 'rectangle' || selectedTool === 'circle' || selectedTool === 'triangle' || selectedTool === 'star' || selectedTool === 'text')) {
      const pos = getRelativePointerPosition();
      if (pos) {
        setIsDrawing(true);
        setNewShape({
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
        });
      }
    }
  };

  /**
   * Handle mouse move - update shape preview and cursor position
   */
  const handleMouseMove = () => {
    // Update cursor position for other users - use canvas coordinates
    const pos = getRelativePointerPosition();
    if (pos) {
      // Store canvas coordinates (accounts for zoom/pan)
      updateCursorPosition(pos.x, pos.y);
    }

    // Handle shape drawing preview
    if (!isDrawing || !newShape) return;
    if (!pos) return;

    setNewShape({
      x: Math.min(pos.x, newShape.x),
      y: Math.min(pos.y, newShape.y),
      width: Math.abs(pos.x - newShape.x),
      height: Math.abs(pos.y - newShape.y),
    });
  };

  /**
   * Handle mouse up - finalize shape creation or end panning
   */
  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      if (stageRef.current) {
        stageRef.current.container().style.cursor = spacePressed ? 'grab' : 'default';
      }
    }

    if (isDrawing && newShape) {
      // Only create shape if it meets minimum size
      if (newShape.width >= MIN_SHAPE_SIZE && newShape.height >= MIN_SHAPE_SIZE) {
        const baseShape = {
          x: newShape.x,
          y: newShape.y,
          width: newShape.width,
          height: newShape.height,
          fill: getRandomShapeColor(),
          createdAt: Date.now(),
        };

        // Create shape based on selected tool
        if (selectedTool === 'rectangle') {
          addShape({ ...baseShape, type: 'rectangle' });
        } else if (selectedTool === 'circle') {
          addShape({ ...baseShape, type: 'circle' });
        } else if (selectedTool === 'triangle') {
          addShape({ ...baseShape, type: 'triangle' });
        } else if (selectedTool === 'star') {
          addShape({ ...baseShape, type: 'star' });
        } else if (selectedTool === 'text') {
          addShape({ 
            ...baseShape, 
            type: 'text',
            text: 'Double-click to edit',
            fontSize: 16,
            fontFamily: 'Arial',
          });
        }
      }
      setIsDrawing(false);
      setNewShape(null);
    }
  };

  /**
   * Handle stage drag (panning)
   */
  const handleDragMove = () => {
    if (stageRef.current) {
      // Trigger re-render to update cursor positions and grid
      setUpdateTrigger(prev => prev + 1);
      setGridUpdateTrigger(prev => prev + 1);
    }
  };

  /**
   * Handle zoom with mouse wheel
   */
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const scaleBy = 1.05;
    let newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale));

    stage.scale({ x: newScale, y: newScale });

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    stage.position(newPos);
    setScale(newScale);
    setGridUpdateTrigger(prev => prev + 1);
  };

  /**
   * Handle stage click to deselect shapes and close context menu
   */
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Close context menu on any click
    if (contextMenu) {
      setContextMenu(null);
    }
    
    if (e.target === e.target.getStage()) {
      selectShape(null);
    }
  };
  
  /**
   * Check if a shape is selected (single or multi-select)
   */
  const isShapeSelected = (id: string) => {
    return selectedIds.includes(id) || selectedId === id;
  };

  /**
   * Handle shape selection
   */
  const handleShapeSelect = (id: string, shiftKey: boolean = false) => {
    if (shiftKey) {
      toggleShapeSelection(id);
    } else {
      selectShape(id);
    }
  };

  /**
   * Handle text save from editor
   */
  const handleTextSave = useCallback((shapeId: string, text: string, fontStyle: string, textDecoration: string, fontSize: number) => {
    updateShape(shapeId, {
      text,
      fontStyle,
      textDecoration,
      fontSize,
    });
    setEditingTextId(null);
  }, [updateShape]);

  /**
   * Handle shape drag end - update shape position
   */
  const handleShapeDragEnd = (id: string) => (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const shape = shapes.find(s => s.id === id);
    
    let newX = node.x();
    let newY = node.y();
    
    // Circle and Star shapes are rendered centered, so adjust position back to top-left
    if (shape?.type === 'star' || shape?.type === 'circle') {
      newX = node.x() - (shape.width / 2);
      newY = node.y() - (shape.height / 2);
    }
    
    updateShape(id, {
      x: newX,
      y: newY,
    });
  };

  /**
   * Handle shape transform end - update shape size/rotation
   */
  const handleShapeTransformEnd = useCallback((id: string) => (e: Konva.KonvaEventObject<Event>) => {
    const node = e.target as Konva.Rect;
    const shape = shapes.find(s => s.id === id);
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation(); // Get rotation in degrees

    // Reset scale and apply to width/height
    node.scaleX(1);
    node.scaleY(1);

    const newWidth = Math.max(10, node.width() * scaleX);
    const newHeight = Math.max(10, node.height() * scaleY);
    let newX = node.x();
    let newY = node.y();

    // Circle and Star shapes are rendered centered, so adjust position back to top-left
    // When resizing, the node position is the center, so we need to convert back to top-left
    if (shape?.type === 'star' || shape?.type === 'circle') {
      newX = node.x() - (newWidth / 2);
      newY = node.y() - (newHeight / 2);
    }

    updateShape(id, {
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
      rotation, // Save rotation to Firestore
    });
  }, [updateShape, shapes]);

  /**
   * Reset view to initial position and zoom
   */
  const handleResetView = () => {
    if (stageRef.current) {
      stageRef.current.position({ x: initialX, y: initialY });
      stageRef.current.scale({ x: DEFAULT_ZOOM, y: DEFAULT_ZOOM });
      setScale(DEFAULT_ZOOM);
    }
  };

  /**
   * Zoom in
   */
  const handleZoomIn = () => {
    if (stageRef.current) {
      const stage = stageRef.current;
      const oldScale = stage.scaleX();
      const newScale = Math.min(MAX_ZOOM, oldScale * 1.2);
      
      const center = {
        x: dimensions.width / 2,
        y: dimensions.height / 2,
      };

      const mousePointTo = {
        x: (center.x - stage.x()) / oldScale,
        y: (center.y - stage.y()) / oldScale,
      };

      stage.scale({ x: newScale, y: newScale });
      
      const newPos = {
        x: center.x - mousePointTo.x * newScale,
        y: center.y - mousePointTo.y * newScale,
      };

      stage.position(newPos);
      setScale(newScale);
      setGridUpdateTrigger(prev => prev + 1);
    }
  };

  /**
   * Zoom out
   */
  const handleZoomOut = () => {
    if (stageRef.current) {
      const stage = stageRef.current;
      const oldScale = stage.scaleX();
      const newScale = Math.max(MIN_ZOOM, oldScale / 1.2);
      
      const center = {
        x: dimensions.width / 2,
        y: dimensions.height / 2,
      };

      const mousePointTo = {
        x: (center.x - stage.x()) / oldScale,
        y: (center.y - stage.y()) / oldScale,
      };

      stage.scale({ x: newScale, y: newScale });
      
      const newPos = {
        x: center.x - mousePointTo.x * newScale,
        y: center.y - mousePointTo.y * newScale,
      };

      stage.position(newPos);
      setScale(newScale);
      setGridUpdateTrigger(prev => prev + 1);
    }
  };

  /**
   * Generate grid lines for visual reference
   */
  /**
   * Generate infinite grid lines based on current viewport
   * Dynamically calculates visible area and renders grid tiles
   */
  const generateGridLines = useCallback(() => {
    if (!stageRef.current) return [];
    
    const stage = stageRef.current;
    const lines = [];
    
    // Calculate visible area in canvas coordinates
    const viewportWidth = dimensions.width;
    const viewportHeight = dimensions.height;
    const stageX = stage.x();
    const stageY = stage.y();
    
    // Convert viewport bounds to canvas coordinates
    const startX = -stageX / scale;
    const startY = -stageY / scale;
    const endX = startX + viewportWidth / scale;
    const endY = startY + viewportHeight / scale;
    
    // Add padding to render grid beyond visible area (for smooth panning)
    const padding = GRID_SPACING * 5;
    const paddedStartX = startX - padding;
    const paddedStartY = startY - padding;
    const paddedEndX = endX + padding;
    const paddedEndY = endY + padding;
    
    // Round to nearest grid line
    const gridStartX = Math.floor(paddedStartX / GRID_SPACING) * GRID_SPACING;
    const gridStartY = Math.floor(paddedStartY / GRID_SPACING) * GRID_SPACING;
    const gridEndX = Math.ceil(paddedEndX / GRID_SPACING) * GRID_SPACING;
    const gridEndY = Math.ceil(paddedEndY / GRID_SPACING) * GRID_SPACING;
    
    // Generate vertical grid lines
    for (let x = gridStartX; x <= gridEndX; x += GRID_SPACING) {
      lines.push(
        <Line
          key={`v-${x}`}
          points={[x, gridStartY, x, gridEndY]}
          stroke={x === 0 ? "#444444" : "#2a2a2a"} // Highlight origin
          strokeWidth={x === 0 ? 2 : 1}
          listening={false}
        />
      );
    }
    
    // Generate horizontal grid lines
    for (let y = gridStartY; y <= gridEndY; y += GRID_SPACING) {
      lines.push(
        <Line
          key={`h-${y}`}
          points={[gridStartX, y, gridEndX, y]}
          stroke={y === 0 ? "#444444" : "#2a2a2a"} // Highlight origin
          strokeWidth={y === 0 ? 2 : 1}
          listening={false}
        />
      );
    }
    
    return lines;
  }, [dimensions, scale, gridUpdateTrigger]);

  // Show loading state while initial shapes load
  if (loading) {
    return (
      <div className="relative w-full flex items-center justify-center bg-gray-900" style={{ height: dimensions.height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Loading canvas...</p>
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="relative w-full flex items-center justify-center bg-gray-900" style={{ height: dimensions.height }}>
        <div className="bg-red-900/30 border border-red-700 text-red-400 px-6 py-4 rounded-lg max-w-md">
          <p className="font-semibold mb-2">Error loading canvas</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-gray-900" style={{ height: dimensions.height }}>
      {/* History Manager - handles undo/redo logic */}
      <HistoryManager />

      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        x={initialX}
        y={initialY}
        scaleX={scale}
        scaleY={scale}
        draggable={isPanning || spacePressed}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDragMove={handleDragMove}
        onWheel={handleWheel}
        onClick={handleStageClick}
      >
        {/* Background Layer - Infinite Grid */}
        <Layer listening={false}>
          {generateGridLines()}
        </Layer>

        {/* Shapes Layer */}
        <Layer>
          {/* Render existing shapes sorted by zIndex */}
          {sortedShapes.map((shape) => (
            <Shape
              key={shape.id}
              shape={shape}
              isSelected={isShapeSelected(shape.id)}
              onSelect={(e?: any) => handleShapeSelect(shape.id, e?.evt?.shiftKey)}
              onDragEnd={handleShapeDragEnd(shape.id)}
              onTransformEnd={handleShapeTransformEnd(shape.id)}
              onContextMenu={(e) => handleContextMenu(e, shape.id)}
              hideTransformer={selectedIds.length >= 2}
            />
          ))}

          {/* Preview of shape being drawn */}
          {isDrawing && newShape && newShape.width > 0 && newShape.height > 0 && (() => {
            const previewProps = {
              opacity: 0.5,
              stroke: '#0066ff',
              strokeWidth: 2,
              dash: [10, 5],
              listening: false,
              fill: getRandomShapeColor(),
            };

            if (selectedTool === 'rectangle') {
              return (
                <Rect
                  x={newShape.x}
                  y={newShape.y}
                  width={newShape.width}
                  height={newShape.height}
                  {...previewProps}
                />
              );
            } else if (selectedTool === 'circle') {
              return (
                <Circle
                  x={newShape.x + newShape.width / 2}
                  y={newShape.y + newShape.height / 2}
                  radius={Math.min(newShape.width, newShape.height) / 2}
                  {...previewProps}
                />
              );
            } else if (selectedTool === 'triangle') {
              const halfWidth = newShape.width / 2;
              return (
                <Line
                  x={newShape.x}
                  y={newShape.y}
                  points={[
                    halfWidth, 0,
                    newShape.width, newShape.height,
                    0, newShape.height,
                  ]}
                  closed
                  {...previewProps}
                />
              );
            } else if (selectedTool === 'star') {
              const starRadius = Math.min(newShape.width, newShape.height) / 2;
              return (
                <Star
                  x={newShape.x + newShape.width / 2}
                  y={newShape.y + newShape.height / 2}
                  numPoints={5}
                  innerRadius={starRadius * 0.5}
                  outerRadius={starRadius}
                  {...previewProps}
                />
              );
            } else if (selectedTool === 'text') {
              return (
                <Text
                  x={newShape.x}
                  y={newShape.y}
                  width={newShape.width}
                  height={newShape.height}
                  text="Double-click to edit"
                  fontSize={16}
                  fontFamily="Arial"
                  fill="white"
                  align="center"
                  verticalAlign="middle"
                  opacity={0.5}
                  stroke="#0066ff"
                  strokeWidth={2}
                  listening={false}
                />
              );
            }
            return null;
          })()}

          {/* Multi-select transformer - shows group bounding box for 2+ selected shapes */}
          {selectedIds.length >= 2 && (
            <Transformer
              ref={multiSelectTransformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                // Limit resize to minimum size
                if (newBox.width < 10 || newBox.height < 10) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          )}
        </Layer>
      </Stage>

      {/* Toolbox - includes drawing tools, history, alignment, layers, and visual effects */}
      <Toolbox
        selectedTool={selectedTool}
        onSelectTool={setSelectedTool}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={(window as any).__historyManager?.canUndo || false}
        canRedo={(window as any).__historyManager?.canRedo || false}
        onAlign={handleAlign}
        onDistribute={handleDistribute}
        alignmentEnabled={selectedIds.length >= 2}
        onBringToFront={handleBringToFront}
        isVisible={isToolboxVisible}
        onSendToBack={handleSendToBack}
        onBringForward={handleBringForward}
        onSendBackward={handleSendBackward}
        layerControlsEnabled={selectedId !== null}
        layerInfo={selectedId ? getShapeLayerInfo(selectedId) : null}
        onClearCanvas={handleClearCanvas}
        selectedShape={selectedId ? shapes.find(s => s.id === selectedId) || null : null}
        selectedShapes={selectedIds.length > 0 ? shapes.filter(s => selectedIds.includes(s.id)) : []}
        onUpdateShape={(updates) => {
          // Apply updates to all selected shapes
          const idsToUpdate = selectedIds.length > 0 ? selectedIds : (selectedId ? [selectedId] : []);
          idsToUpdate.forEach(id => {
            updateShape(id, updates);
          });
        }}
      />

      {/* Canvas Controls */}
      <CanvasControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        currentZoom={scale}
      />

      {/* Canvas Info Overlay - Hidden in production, useful for development */}
      {/* <div className="absolute top-4 left-20 bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-xl border border-gray-700">
        <p className="text-sm text-gray-300">
          <span className="font-semibold text-blue-400">Shapes:</span> {shapes.length}
        </p>
        <p className="text-sm text-gray-300">
          <span className="font-semibold text-blue-400">Zoom:</span> {Math.round(scale * 100)}%
        </p>
        <p className="text-sm text-gray-300">
          <span className="font-semibold text-blue-400">Users:</span> {Object.keys(cursors).length + 1}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Select tool, then draw • Space+Drag to pan
        </p>
      </div> */}

      {/* Render other users' cursors */}
      {Object.entries(cursors).map(([userId, cursorData]) => {
        // Convert canvas coordinates to screen coordinates
        const screenPos = canvasToScreenCoords(cursorData.cursorX, cursorData.cursorY);
        
        return (
          <Cursor
            key={userId}
            x={screenPos.x}
            y={screenPos.y}
            color={cursorData.cursorColor}
            name={cursorData.displayName}
          />
        );
      })}

      {/* Toast Notifications */}
      <ShortcutToast
        message={toastMessage}
        onClose={() => setToastMessage(null)}
      />

      {/* Export Toast */}
      <ExportToast
        message={exportToastMessage}
        onClose={() => setExportToastMessage(null)}
      />

      {/* Text Editor */}
      {editingTextId && stageRef.current && (() => {
        const shape = shapes.find(s => s.id === editingTextId);
        if (!shape || shape.type !== 'text') return null;

        return (
          <TextEditor
            shape={shape}
            onSave={(text, fontStyle, textDecoration, fontSize) => handleTextSave(editingTextId, text, fontStyle, textDecoration, fontSize)}
            onClose={() => setEditingTextId(null)}
            stagePosition={{ x: stageRef.current!.x(), y: stageRef.current!.y() }}
            stageScale={stageRef.current!.scaleX()}
          />
        );
      })()}

      {/* Export Dialog */}
      {showExportDialog && (
        <ExportDialog
          onExport={handleExport}
          onCancel={() => setShowExportDialog(false)}
          hasSelection={selectedId !== null}
          isExporting={isExporting}
        />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={handleCloseContextMenu}
          onBringToFront={() => handleBringToFront()}
          onBringForward={() => handleBringForward()}
          onSendBackward={() => handleSendBackward()}
          onSendToBack={() => handleSendToBack()}
          onDuplicate={() => handleDuplicate()}
          onDelete={() => handleDelete()}
          selectedCount={selectedIds.length > 0 ? selectedIds.length : 1}
          disabledOperations={{
            bringToFront: contextMenu.shapeId ? (getShapeLayerInfo(contextMenu.shapeId).current === getShapeLayerInfo(contextMenu.shapeId).total) : false,
            sendToBack: contextMenu.shapeId ? (getShapeLayerInfo(contextMenu.shapeId).current === 1) : false,
            bringForward: contextMenu.shapeId ? (getShapeLayerInfo(contextMenu.shapeId).current === getShapeLayerInfo(contextMenu.shapeId).total) : false,
            sendBackward: contextMenu.shapeId ? (getShapeLayerInfo(contextMenu.shapeId).current === 1) : false,
          }}
        />
      )}
    </div>
  );
};

export default Canvas;
