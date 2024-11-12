import { $createRangeSelection, $getSelection, $setSelection, LexicalEditor, LexicalNode, RangeSelection } from 'lexical';

import { CustomGapNode } from '../../../nodes/GapWord';
import { CustomWordNode } from '../../../nodes/WordNode';

export interface SelectDataType {
  nodes: Array<LexicalNode>;
  isClick: boolean;
  selection: RangeSelection;
  anchor: {
    point: any;
    node: CustomWordNode;
    offset: number;
  };
  focus: {
    point: any;
    node: CustomWordNode;
    offset: number;
  };
  isMultiRowSelect: boolean;
  indexNode: any;
  isLeftToRight: boolean;
  selectedNodes: Array<CustomWordNode>;
}

/**
 * 获取当前选区数据
 */
export const getCurrentSelectionData = (): SelectDataType => {
  const selection = $getSelection() as RangeSelection;
  if (!selection) return {} as SelectDataType;
  const nodes = selection.getNodes();
  const isClick = selection.isCollapsed() && nodes.length === 1;
  const selectData = {
    nodes,
    isClick,
    selection,
    anchor: {
      point: selection.anchor,
      node: selection.anchor.getNode() as CustomWordNode,
      offset: selection.anchor.offset,
    },
    focus: {
      point: selection.focus,
      node: selection.focus.getNode() as CustomWordNode,
      offset: selection.focus.offset,
    },
    isMultiRowSelect: nodes.length > 1,
    indexNode:
      nodes[0] === selection.anchor.getNode() ? selection.anchor : selection.focus,
    isLeftToRight: nodes[0] === selection.anchor.getNode(),
    selectedNodes: [] as Array<CustomWordNode>,
  };
  selectData.selectedNodes = nodes.filter((node) => {
    const isAnchorOrFocus =
      node === selectData.anchor.node || node === selectData.focus.node;
    const isParent = node.__type === 'scene-node' || node.__type === 'words-content';
    return !isAnchorOrFocus && !isParent;
  }) as Array<CustomWordNode>;
  return selectData;
};

/**
 * 鼠标抬起事件
 */
export const handleKeyUp = (editor: LexicalEditor, callback?: (node?: CustomWordNode) => void) => {
  editor.update(() => {
    const selectionData = getCurrentSelectionData();
    if (selectionData.isClick) {
      const nodes = selectionData.nodes;
      const node = nodes[0] as CustomWordNode;
      callback && callback(node);
      if (node instanceof CustomGapNode) {
        // 如果是停顿词,光标默认打到末尾
        editor.update(() => {
          const rangeSelection = $createRangeSelection();
          rangeSelection.setTextNodeRange(node, node.__text.length, node, node.__text.length);
          $setSelection(rangeSelection);
        });
      }
    } else {
      // const selectedNodes = selectionData.selectedNodes;
      const { anchor, focus,isLeftToRight } = selectionData
      // 初始化选区offset
      const range = {
        anchorOffset: anchor.offset,
        focusOffset: focus.offset
      };
      if (anchor.node instanceof CustomGapNode) {
        // 如果anchor是停顿词，扩展anchor选区
        range.anchorOffset = isLeftToRight ? 0 :anchor.node.__text.length;
      }
      if (focus.node instanceof CustomGapNode) {
        // 如果focus是停顿词,扩展focus选区
        range.focusOffset = isLeftToRight ? focus.node.__text.length : 0
      }
      editor.update(() => {
        const rangeSelection = $createRangeSelection();
        rangeSelection.setTextNodeRange(anchor.node, range.anchorOffset, focus.node, range.focusOffset);
        $setSelection(rangeSelection);
      });
    }
  });
};
