import { useCallback, useState } from "react";

/**
 * A React Hook implementing up/down-navigatable list of categorised items.
 * By supplying a list of items binned by type/category, the hook returns
 * functions to move the selection up or down, as well as get the current
 * selection.
 *
 * Modifying items will cause a re-render and reset the selection to the top.
 * "Modification" is detected via JSON.stringify().
 *
 * @param items Categorised items, with keys being types of items and the values
 * the array of items
 * @param displayOrder An array containing the keys of `items` in the order they
 * should be navigated, top to bottom
 * @returns Handlers to move selection up/down, and the current selection
 */
const useCategorisedNavigation = <T extends { [key: string]: any[] }>(items: T, displayOrder: readonly (keyof T)[]) => {
  const [currentSelection, setCurrentSelection] = useState({
    // Type will be one of the values of displayOrder (and a valid item key)
    // or undefined if there are no items at all to start with.
    "type": displayOrder.at(0) ?? undefined,
    "index": 0,
  });

  // Reset selection to default (topmost valid item) when items object changes.
  // This is "semi-pure" way of doing this. In terms of idealness:
  //
  // useEffect <<< compare with prev state & re-render once < completely stateless
  //
  // Ours is the middle solution in the ranking above.
  //
  // We store the previous value of items and compare on every render. If they
  // are different, it will cause an immediate re-render when the containing
  // component returns. This can be the cause of infinite re-renders if the items
  // argument is a freshly created object on each render, so to prevent infinite
  // re-renders, we use JSON.stringify() to compare objects.
  // This trick to avoiding re-renders is documented here:
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  // It adds one extra re-render so it's not an optimal solution, but what we
  // want isn't really achievable statelessly.
  const [prevItems, setPrevItems] = useState(items);
  if (JSON.stringify(prevItems) !== JSON.stringify(items)) {
    setPrevItems(items);
    setCurrentSelection({
      type: displayOrder.find(k => items[k].length > 0),
      index: 0,
    })
  }

  // Callback function to move selection upwards
  const moveUp = useCallback(() => {
    if (!currentSelection.type) {
      // If previously no selection (which can only happen if there were no results
      // for any type), check if we have anything new again
      if (displayOrder.length > 0) {
        setCurrentSelection({
          "type": displayOrder[0] ?? undefined,
          "index": 0,
        });
      }
      return;
    }

    // Move index to a higher item, or, to a previous category until the very top.
    if (currentSelection.index > 0) {
      return setCurrentSelection({
        "type": currentSelection.type,
        "index": currentSelection.index - 1,
      });
    }

    let prevTypeIndex = displayOrder.indexOf(currentSelection.type) - 1;
    while (prevTypeIndex >= 0 && items[displayOrder[prevTypeIndex]].length === 0) prevTypeIndex--;
    if (prevTypeIndex < 0) return;
    return setCurrentSelection({
      "type": displayOrder[prevTypeIndex],
      "index": items[displayOrder[prevTypeIndex]].length - 1,
    });

  }, [currentSelection, setCurrentSelection, displayOrder, items]);

  // Callback function to move selection downwards
  const moveDown = useCallback(() => {
    if (!currentSelection.type) {
      // If previously no selection, check if we have anything new and default to top item
      if (displayOrder.length > 0) {
        setCurrentSelection({
          "type": displayOrder[0] ?? undefined,
          "index": 0,
        });
      }
      return;
    }

    // Move index to a lower item, or, to a subsequent category until the very bottom.
    if (currentSelection.index < items[currentSelection.type].length - 1) {
      return setCurrentSelection({
        "type": currentSelection.type,
        "index": currentSelection.index + 1,
      });
    }

    let nextTypeIndex = displayOrder.indexOf(currentSelection.type) + 1;
    while (nextTypeIndex < displayOrder.length && items[displayOrder[nextTypeIndex]].length === 0) nextTypeIndex++;
    if (nextTypeIndex >= displayOrder.length) return;
    return setCurrentSelection({
      "type": displayOrder[nextTypeIndex],
      "index": 0,
    });

  }, [currentSelection, setCurrentSelection, displayOrder, items]);

  return {
    moveUp,
    moveDown,
    currentSelection,
  }
}

export default useCategorisedNavigation;
