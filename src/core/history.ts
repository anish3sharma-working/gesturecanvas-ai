import type { DrawingItem } from '../types';

type HistoryAction =
  | { type: 'add'; item: DrawingItem }
  | { type: 'update'; before: DrawingItem; after: DrawingItem }
  | { type: 'delete'; item: DrawingItem; index: number };

export class DrawingHistory {
  private items: DrawingItem[] = [];
  private undoActions: HistoryAction[] = [];
  private redoActions: HistoryAction[] = [];
  get current() { return this.items; }
  get canUndo() { return this.undoActions.length > 0; }
  get canRedo() { return this.redoActions.length > 0; }
  load(items: DrawingItem[]) { this.items = structuredClone(items); this.undoActions = []; this.redoActions = []; }
  private record(action: HistoryAction) { this.undoActions.push(action); this.redoActions = []; }
  private apply(action: HistoryAction, forward: boolean) {
    if (action.type === 'add') {
      if (forward) this.items = [...this.items, structuredClone(action.item)];
      else this.items = this.items.filter(item => item.id !== action.item.id);
    } else if (action.type === 'update') {
      const item = forward ? action.after : action.before;
      this.items = this.items.map(existing => existing.id === item.id ? structuredClone(item) : existing);
    } else if (forward) {
      this.items = this.items.filter(existing => existing.id !== action.item.id);
    } else {
      const restored = [...this.items];
      restored.splice(Math.min(action.index, restored.length), 0, structuredClone(action.item));
      this.items = restored;
    }
  }
  add(item: DrawingItem) { const clone = structuredClone(item); this.items = [...this.items, clone]; this.record({ type: 'add', item: clone }); }
  updateItem(id: string, item: DrawingItem) {
    const before = this.items.find(existing => existing.id === id);
    if (!before) return this.items;
    const after = structuredClone(item);
    this.items = this.items.map(existing => existing.id === id ? after : existing);
    this.record({ type: 'update', before: structuredClone(before), after });
    return this.items;
  }
  deleteItem(id: string) {
    const index = this.items.findIndex(item => item.id === id);
    if (index < 0) return this.items;
    const [item] = this.items.splice(index, 1);
    this.items = [...this.items];
    this.record({ type: 'delete', item: structuredClone(item), index });
    return this.items;
  }
  undo() { const action = this.undoActions.pop(); if (!action) return this.items; this.apply(action, false); this.redoActions.push(action); return this.items; }
  redo() { const action = this.redoActions.pop(); if (!action) return this.items; this.apply(action, true); this.undoActions.push(action); return this.items; }
  clear() { this.items = []; this.undoActions = []; this.redoActions = []; return this.items; }
}
