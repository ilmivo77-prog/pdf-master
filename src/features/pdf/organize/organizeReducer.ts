import type {
  OrganizePageOperation,
  OrganizeRotationDelta,
} from '../engine/engines/pdfOrganizeEngine';

export interface OrganizePageItem {
  /** 0-based index in the original uploaded PDF. */
  sourcePageIndex: number;
  /** 1-based page number in the original uploaded PDF. */
  originalPageNumber: number;
  rotationDelta: OrganizeRotationDelta;
  deleted: boolean;
  selected: boolean;
}

export interface OrganizeState {
  sourcePageCount: number;
  items: OrganizePageItem[];
  lastAnnouncement: string;
}

export type OrganizeAction =
  | {type: 'INIT'; pageCount: number}
  | {type: 'MOVE_STEP'; sourcePageIndex: number; delta: -1 | 1}
  | {type: 'MOVE_TO_INDEX'; fromIndex: number; toIndex: number}
  | {type: 'ROTATE_PAGE'; sourcePageIndex: number; step: -90 | 90}
  | {type: 'TOGGLE_DELETE_PAGE'; sourcePageIndex: number}
  | {type: 'TOGGLE_SELECT_PAGE'; sourcePageIndex: number}
  | {type: 'SELECT_ALL_ACTIVE'}
  | {type: 'CLEAR_SELECTION'}
  | {type: 'ROTATE_SELECTED'; step: -90 | 90}
  | {type: 'DELETE_SELECTED'}
  | {type: 'RESTORE_ALL'}
  | {type: 'RESET_ORDER'}
  | {type: 'REVERSE_ORDER'};

export function createInitialOrganizeState(pageCount = 0): OrganizeState {
  const safeCount = Number.isInteger(pageCount) && pageCount > 0 ? pageCount : 0;
  const items: OrganizePageItem[] = [];
  for (let i = 0; i < safeCount; i += 1) {
    items.push({
      sourcePageIndex: i,
      originalPageNumber: i + 1,
      rotationDelta: 0,
      deleted: false,
      selected: false,
    });
  }
  return {
    sourcePageCount: safeCount,
    items,
    lastAnnouncement: '',
  };
}

function applyRotationStep(
  current: OrganizeRotationDelta,
  step: -90 | 90
): OrganizeRotationDelta {
  const next = (current + step + 360) % 360;
  return next as OrganizeRotationDelta;
}

export function organizeReducer(
  state: OrganizeState,
  action: OrganizeAction
): OrganizeState {
  switch (action.type) {
    case 'INIT':
      return createInitialOrganizeState(action.pageCount);

    case 'MOVE_STEP': {
      const idx = state.items.findIndex(
        (item) => item.sourcePageIndex === action.sourcePageIndex
      );
      if (idx === -1) {
        return state;
      }
      const targetIdx = idx + action.delta;
      if (targetIdx < 0 || targetIdx >= state.items.length) {
        return state;
      }
      const nextItems = [...state.items];
      const moved = nextItems[idx];
      nextItems[idx] = nextItems[targetIdx];
      nextItems[targetIdx] = moved;
      return {
        ...state,
        items: nextItems,
        lastAnnouncement: `Page ${moved.originalPageNumber} moved to position ${targetIdx + 1} of ${state.items.length}.`,
      };
    }

    case 'MOVE_TO_INDEX': {
      const {fromIndex, toIndex} = action;
      if (
        !Number.isInteger(fromIndex) ||
        !Number.isInteger(toIndex) ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= state.items.length ||
        toIndex >= state.items.length ||
        fromIndex === toIndex
      ) {
        return state;
      }
      const nextItems = [...state.items];
      const [moved] = nextItems.splice(fromIndex, 1);
      nextItems.splice(toIndex, 0, moved);
      return {
        ...state,
        items: nextItems,
        lastAnnouncement: `Page ${moved.originalPageNumber} moved to position ${toIndex + 1} of ${state.items.length}.`,
      };
    }

    case 'ROTATE_PAGE': {
      let rotatedPageNumber: number | null = null;
      let rotatedNextAngle: OrganizeRotationDelta = 0;
      const nextItems = state.items.map((item) => {
        if (item.sourcePageIndex !== action.sourcePageIndex) {
          return item;
        }
        rotatedPageNumber = item.originalPageNumber;
        rotatedNextAngle = applyRotationStep(item.rotationDelta, action.step);
        return {
          ...item,
          rotationDelta: rotatedNextAngle,
        };
      });
      if (rotatedPageNumber === null) {
        return state;
      }
      return {
        ...state,
        items: nextItems,
        lastAnnouncement: `Page ${rotatedPageNumber} rotated to ${rotatedNextAngle} degrees.`,
      };
    }

    case 'TOGGLE_DELETE_PAGE': {
      let toggledPageNumber: number | null = null;
      let nextDeleted = false;
      const nextItems = state.items.map((item) => {
        if (item.sourcePageIndex !== action.sourcePageIndex) {
          return item;
        }
        toggledPageNumber = item.originalPageNumber;
        nextDeleted = !item.deleted;
        return {
          ...item,
          deleted: nextDeleted,
          selected: nextDeleted ? false : item.selected,
        };
      });
      if (toggledPageNumber === null) {
        return state;
      }
      return {
        ...state,
        items: nextItems,
        lastAnnouncement: nextDeleted
          ? `Page ${toggledPageNumber} marked for removal.`
          : `Page ${toggledPageNumber} restored.`,
      };
    }

    case 'TOGGLE_SELECT_PAGE': {
      let changed = false;
      const nextItems = state.items.map((item) => {
        if (item.sourcePageIndex !== action.sourcePageIndex || item.deleted) {
          return item;
        }
        changed = true;
        return {
          ...item,
          selected: !item.selected,
        };
      });
      return changed ? {...state, items: nextItems} : state;
    }

    case 'SELECT_ALL_ACTIVE': {
      const nextItems = state.items.map((item) =>
        item.deleted ? item : {...item, selected: true}
      );
      const selectedCount = nextItems.filter((item) => item.selected).length;
      return {
        ...state,
        items: nextItems,
        lastAnnouncement:
          selectedCount > 0
            ? `Selected ${selectedCount} active ${selectedCount === 1 ? 'page' : 'pages'}.`
            : 'No active pages available to select.',
      };
    }

    case 'CLEAR_SELECTION': {
      const hadSelected = state.items.some((item) => item.selected);
      if (!hadSelected) {
        return state;
      }
      return {
        ...state,
        items: state.items.map((item) =>
          item.selected ? {...item, selected: false} : item
        ),
        lastAnnouncement: 'Selection cleared.',
      };
    }

    case 'ROTATE_SELECTED': {
      let rotatedCount = 0;
      const nextItems = state.items.map((item) => {
        if (!item.selected || item.deleted) {
          return item;
        }
        rotatedCount += 1;
        return {
          ...item,
          rotationDelta: applyRotationStep(item.rotationDelta, action.step),
        };
      });
      if (rotatedCount === 0) {
        return state;
      }
      return {
        ...state,
        items: nextItems,
        lastAnnouncement: `Rotated ${rotatedCount} selected ${rotatedCount === 1 ? 'page' : 'pages'}.`,
      };
    }

    case 'DELETE_SELECTED': {
      let deletedCount = 0;
      const nextItems = state.items.map((item) => {
        if (!item.selected || item.deleted) {
          return item;
        }
        deletedCount += 1;
        return {
          ...item,
          deleted: true,
          selected: false,
        };
      });
      if (deletedCount === 0) {
        return state;
      }
      return {
        ...state,
        items: nextItems,
        lastAnnouncement: `Marked ${deletedCount} selected ${deletedCount === 1 ? 'page' : 'pages'} for removal.`,
      };
    }

    case 'RESTORE_ALL': {
      const deletedCount = state.items.filter((item) => item.deleted).length;
      if (deletedCount === 0) {
        return state;
      }
      return {
        ...state,
        items: state.items.map((item) =>
          item.deleted ? {...item, deleted: false} : item
        ),
        lastAnnouncement: `Restored all ${state.items.length} pages.`,
      };
    }

    case 'RESET_ORDER': {
      if (state.items.length === 0) {
        return state;
      }
      const nextItems = [...state.items]
        .sort((a, b) => a.sourcePageIndex - b.sourcePageIndex)
        .map((item) => ({
          ...item,
          rotationDelta: 0 as OrganizeRotationDelta,
          deleted: false,
          selected: false,
        }));
      return {
        ...state,
        items: nextItems,
        lastAnnouncement: `Reset page order and rotations for ${nextItems.length} pages.`,
      };
    }

    case 'REVERSE_ORDER': {
      if (state.items.length <= 1) {
        return state;
      }
      return {
        ...state,
        items: [...state.items].reverse(),
        lastAnnouncement: `Reversed order of ${state.items.length} pages.`,
      };
    }

    default:
      return state;
  }
}

export function buildOrganizeOperations(
  state: OrganizeState
): OrganizePageOperation[] {
  return state.items
    .filter((item) => !item.deleted)
    .map((item) => ({
      sourcePageIndex: item.sourcePageIndex,
      rotationDelta: item.rotationDelta,
    }));
}

export function getOrganizeCounts(state: OrganizeState): {
  totalCount: number;
  keptCount: number;
  deletedCount: number;
  selectedCount: number;
} {
  let keptCount = 0;
  let deletedCount = 0;
  let selectedCount = 0;
  for (const item of state.items) {
    if (item.deleted) {
      deletedCount += 1;
    } else {
      keptCount += 1;
      if (item.selected) {
        selectedCount += 1;
      }
    }
  }
  return {
    totalCount: state.items.length,
    keptCount,
    deletedCount,
    selectedCount,
  };
}
