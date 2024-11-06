import {
  $createRangeSelection,
  $getSelection,
  $setSelection,
  FORMAT_TEXT_COMMAND,
  LexicalEditor,
  type LexicalNode,
  RangeSelection,
} from 'lexical';

import { CustomGapNode } from '../../../nodes/GapWord';
import { CustomGapWordContentNode } from '../../../nodes/GapWordContent';
import { CustomSceneNode } from '../../../nodes/SceneNode';
import { CustomWordContentNode } from '../../../nodes/WordContentNode'
import {
  CustomWordNode,
  offsetListMapItem,
  Word
} from '../../../nodes/WordNode';
import { mouseState } from '../hooks/useGapClick';
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
 *  设置单行选区
 */
export const setSelectRange = (
  editor: LexicalEditor,
  node: CustomWordNode | CustomGapNode,
  range: [number, number],
  callback?: () => void,
  isClick?: boolean
) => {
  editor.update(() => {
    if (isClick) {
      // 单击的情况，兼容新增词的情况，需要手动处理光标位置，即不能设置为闭合选区
      const textNode = editor.getElementByKey(node.__key)?.firstChild as Text;
      const domRange = new Range();
      domRange.setStart(textNode, range[0]);
      domRange.setEnd(textNode, range[1]);
      const focusHighlight = new Highlight(domRange);
      CSS.highlights.set("search-focus", focusHighlight);
    }
    const rangeSelection = $createRangeSelection();
    rangeSelection.formatText('italic')
    rangeSelection.setTextNodeRange(node, range[0], node, isClick ? range[0] : range[1]);
    $setSelection(rangeSelection);
    callback && callback();
  });
};

/**
 *  设置跨行选区
 */
export const setMutiSelectRange = (
  editor: LexicalEditor,
  anchorNode: CustomWordNode,
  focusNode: CustomWordNode,
  range: [number, number],
  callback?: () => void,
) => {
  editor.update(() => {
    const rangeSelection = $createRangeSelection();
    rangeSelection.setTextNodeRange(anchorNode, range[0], focusNode, range[1]);
    $setSelection(rangeSelection);
    callback && callback();
  });
};

export const getWordGroupFromSelectionData = (selectionData: SelectDataType): {
  customWords: Array<offsetListMapItem>;
  hasDeleteWords: Array<offsetListMapItem>;
  insertWords: Array<any>;
  gapNodes: {
    hasFormatGapNodes: Array<CustomGapNode>;
    needFarmatGapNodes: Array<{
      node: CustomGapNode;
      range: [number, number];
      offset: number;
    }>;
  };
} => {
  const anchor = selectionData.anchor;
  const focus = selectionData.focus;
  const wordGroup: {
    customWords: Array<offsetListMapItem>;
    hasDeleteWords: Array<offsetListMapItem>;
    insertWords: Array<any>;
    gapNodes: {
      hasFormatGapNodes: Array<CustomGapNode>;
      needFarmatGapNodes: Array<{
        node: CustomGapNode;
        range: [number, number];
        offset:number
      }>; 
    }
  } = {
    customWords: [],  //正常单词
    hasDeleteWords: [], // 已经删除的单词
    insertWords: [], // 新增的单词
    gapNodes: {
      hasFormatGapNodes:[],
      needFarmatGapNodes: []
    }
    
  }
  // Anchor逻辑
  if (anchor.node.__type === 'text') {
    // 新增词节点
    wordGroup.insertWords.push(anchor.node)
  } else if (anchor.node instanceof CustomGapNode) { 
    const offset = getGapOffsetLeft(anchor.node)
    const hasFormat = anchor.node.hasFormat('strikethrough')
    if (hasFormat) {
      wordGroup.gapNodes.hasFormatGapNodes.push(anchor.node)
    } else {
      wordGroup.gapNodes.needFarmatGapNodes.push({
        node: anchor.node,
        range: selectionData.isLeftToRight ? [anchor.offset + offset, offset + anchor.node.__text.length] : [offset , anchor.offset + offset],
        offset
      })
    }
  } else {
    // 普通单词
    const anchorWords = Object.values(anchor.node.offsetListMap).filter(
      (offsetListItem) => {
        return selectionData.isLeftToRight
          ? offsetListItem.range[0] >= anchor.offset
          : offsetListItem.range[1] <= anchor.offset;
      },
    );
    if (anchor.node.hasFormat('strikethrough')) {
      // 普通单词+删除线
      wordGroup.hasDeleteWords.push(...anchorWords)
    } else {
      // 普通单词
      wordGroup.customWords.push(...anchorWords)
    }
  }
  // 
  // 选中的单词
  selectionData.selectedNodes.forEach((curNode) => {
    if(curNode instanceof CustomGapWordContentNode) return
    const isInsert = curNode.__type === 'text'
    const isGap = curNode instanceof CustomGapNode
    const hasFormat = curNode.hasFormat('strikethrough')
    if (isInsert) {
      // 新增词
      wordGroup.insertWords.push(curNode)
    } else if (isGap) {
      if (hasFormat) {
        // 已经删除的Gap
        wordGroup.gapNodes.hasFormatGapNodes.push(curNode)
      } else {
        // 未删除的Gap
        const offset = getGapOffsetLeft(curNode)
        wordGroup.gapNodes.needFarmatGapNodes.push({
          node: curNode,
          range: [offset, offset + curNode.__text.length],
          offset
        })
      }
      // 
    } else {
      if (hasFormat) {
        // 删除词
        const wordsNode = Object.values(curNode.offsetListMap || {});
        wordGroup.hasDeleteWords.push(...wordsNode);
      } else {
        // 正常词
        const wordsNode = Object.values(curNode.offsetListMap);
        wordGroup.customWords.push(...wordsNode)
      }
    }
  });
  //
  // Focus逻辑
  if (focus.node.__type === 'text') {
    // 新增词节点
    wordGroup.insertWords.push(focus.node)
  } else if (focus.node instanceof CustomGapNode) { 
    // Gap词
    const hasFormat = focus.node.hasFormat('strikethrough');
    if (hasFormat) {
      wordGroup.gapNodes.hasFormatGapNodes.push(focus.node)
    } else {
    const offset = getGapOffsetLeft(focus.node)
    wordGroup.gapNodes.needFarmatGapNodes.push({
      node: focus.node,
      range: selectionData.isLeftToRight ? [offset, focus.offset + offset] : [focus.offset + offset, focus.node.__text.length + offset],
      offset
    })
    }
  } else {
    // 普通单词
    const focusWords = Object.values(focus.node.offsetListMap).filter(
      (offsetListItem) => {
        return selectionData.isLeftToRight
          ? offsetListItem.range[1] <= focus.offset
          : offsetListItem.range[0] >= focus.offset;
      },
    );
    const shouldNotDelete = focusWords.length === 1 && !focusWords[0].word.text;
    const finnalWords = shouldNotDelete ? [] : focusWords
    if (focus.node.hasFormat('strikethrough')) {
      // 普通单词+删除线
      wordGroup.hasDeleteWords.push(...finnalWords)
    } else {
      // 普通单词
      wordGroup.customWords.push(...finnalWords)
    }
  }
  return wordGroup
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
 * 获取选取区间内部的word
 */
export const getWordNodesByOffsetRange = (
  node: CustomWordNode,
  selectRange: [number, number],
) => {
  const copyNode = JSON.parse(JSON.stringify(node));
  const wordNodes: Array<offsetListMapItem> = [];
  if (copyNode.offsetListMap) {
    Object.keys(copyNode.offsetListMap).forEach((key) => {
      const range = copyNode.offsetListMap[key].range;
      if (range[0] !== range[1]) {
        if (range[0] < selectRange[1] && range[1] > selectRange[0]) {
          wordNodes.push(copyNode.offsetListMap[key]);
        }
      }
    });
  } else {
    wordNodes.push(node as any)
  }
  return wordNodes;
};

/**
 * 获取单行选区的Range:[number,number]
 */
export const getSelectRange = (selectionData: SelectDataType): [number, number] => {
  return [
    Math.min(selectionData.anchor.offset, selectionData.focus.offset),
    Math.max(selectionData.anchor.offset, selectionData.focus.offset),
  ];
};
/**
 * 根据选中的区间扩展选区（光标压中文字的情况）
 */
export const expandRange = (
  node: CustomWordNode,
  selectRange: [number, number],
): [number, number] => {
  const wordNodes = getWordNodesByOffsetRange(node, selectRange);
  const finnalRange = [...selectRange] as [number, number];
  if (wordNodes[0] && node instanceof CustomWordNode) {
    // 处理光标落在单词内部的情况， 自动进行range边界扩展覆盖到整个word
    if (wordNodes[0].range[0] < selectRange[0]) {
      finnalRange[0] = wordNodes[0].range[0];
    }
  } else {
    finnalRange[0] = 0
  }
  if (wordNodes[wordNodes.length - 1] && node instanceof CustomWordNode) {
    if (
      wordNodes[wordNodes.length - 1] &&
      wordNodes[wordNodes.length - 1].range[1] > selectRange[1]
    ) {
      finnalRange[1] = wordNodes[wordNodes.length - 1].range[1];
    }
  } else {
    finnalRange[1] = node.__text?.length
  }
  return finnalRange;
};

/**
 * 根据选中的区间（多行）扩展选区（光标压中文字的情况）
 */
export const expandMultiRowRange = (selectionData: SelectDataType): [number, number] => {
  const isLeftToRight = selectionData.isLeftToRight;
  // 选取focus光标压中的单词，依据这个位置扩展填充光标位置
  const focusWordNode = getNodeInOffset(
    selectionData.focus.node,
    selectionData.focus.offset,
  );
  const anchorWordNode = getNodeInOffset(
    selectionData.anchor.node,
    selectionData.anchor.offset,
  );
  let focusOffset = selectionData.focus.offset;
  let anchorOffset = selectionData.anchor.offset;
  if (focusWordNode) {
    if (focusWordNode instanceof CustomGapNode) {
      //
    } else {
        if (focusWordNode.range) {
        focusOffset = isLeftToRight ? focusWordNode.range[1] : focusWordNode.range[0];
      } else {
        const node = focusWordNode as any
        focusOffset = isLeftToRight ? node.__text.length : 0;
      }
    }
  }
  if (anchorWordNode) {
    if (anchorWordNode instanceof CustomGapNode) {
      //
    }
    else {
      if (anchorWordNode.range) {
        anchorOffset = isLeftToRight ? anchorWordNode.range[0] : anchorWordNode.range[1];
      } else {
        const node = anchorWordNode as any
        anchorOffset = isLeftToRight ? 0 : node.__text.length;
      }
      }
  }
  return [anchorOffset, focusOffset];
};

/**
 *  根据offset获取前面/后面的单词
 */
export const getLeftRightWordByOffset = (node: CustomWordNode, offset: number) => {
  const wordNodes: { left: offsetListMapItem; right: offsetListMapItem } = {
    left: null as any,
    right: null as any,
  };
  debugger
  Object.keys(node.offsetListMap).forEach((key) => {
    const range = node.offsetListMap[key].range;
    if (range[0] !== range[1]) {
      if (range[0] === offset) {
        wordNodes.right = node.offsetListMap[key];
      }
      if (range[1] === offset) {
        wordNodes.left = node.offsetListMap[key];
      }
    }
  });
  return wordNodes;
};


/**
 * 获取gapWord的offset left的值，计算在整个gap-content中的偏移
 */
export const getGapOffsetLeft = (node: CustomGapNode) => {
  let preGapWord = node.getPreviousSibling() as CustomGapNode;
  let offset = 0
  while (preGapWord && preGapWord instanceof CustomGapNode) {
    offset += preGapWord.__text.length
    preGapWord = preGapWord.getPreviousSibling() as CustomGapNode;
  }
  return offset
}
/**
 *  根据offset位置获取当前压中的单词
 */
export const getNodeInOffset = (
  node: CustomWordNode,
  offset: number,
): offsetListMapItem => {
  let wordNodes = null as any;
  if (node.offsetListMap) {
    Object.keys(node.offsetListMap).forEach((key) => {
      const range = node.offsetListMap[key].range;
      if (range[0] < offset && range[1] > offset) {
        wordNodes = node.offsetListMap[key];
      }
    });
  } else {
    // 普通词
    wordNodes = node;
  }

  return wordNodes;
};

/**
 * 计算选中的单词（跨多行选中）
 */
export const computedSelectedWords = (
  selectionData: SelectDataType,
  [anchorOffset, focusOffset]: [number, number],
) => {
  // 区间内选中的Gap
  const selectedGapNodes: Array<CustomGapNode> = []
  const anchorGapNode: {
    node: CustomGapNode,
    range:[number,number]
  } = {
    node: null as any,
    range:[0,0]
  }
  const focusGapNode: {
    node: CustomGapNode,
    range:[number,number]
  } = {
    node: null as any,
    range:[0,0]
  }
  //
  let anchorWords: Array<offsetListMapItem> = []
  let focusWords: Array<offsetListMapItem> = []
  const innerWords = selectionData.selectedNodes.reduce((pre, cur) => {
    if (cur.offsetListMap) {
      const wordsNode = Object.values(cur.offsetListMap);
      pre.push(...wordsNode);
    }
    if (cur instanceof CustomGapNode) {
      // 区间内选中的Gap词
      selectedGapNodes.push(cur)
    }
    return pre;
  }, [] as Array<offsetListMapItem>);
  const anchorNode = selectionData.anchor.node as any
  const focusNode = selectionData.focus.node as any
  if (anchorNode instanceof CustomWordNode) {
    anchorWords = Object.values(anchorNode.offsetListMap).filter(
      (offsetListItem) => {
        return selectionData.isLeftToRight
          ? offsetListItem.range[0] >= anchorOffset
          : offsetListItem.range[1] <= anchorOffset;
      }
    );
  } else if (anchorNode instanceof CustomGapNode) {
    // Gap词
    const parent = anchorNode.getParent() as CustomGapWordContentNode;
    const offset = getGapOffsetLeft(anchorNode)
    const offsetRange:[number,number] = selectionData.isLeftToRight ? [selectionData.anchor.offset + offset, parent.length] : [0, selectionData.anchor.offset + offset]
    anchorGapNode.node = anchorNode
    anchorGapNode.range = offsetRange
    
  }
  if (focusNode instanceof CustomWordNode) {
    focusWords = Object.values(focusNode.offsetListMap).filter(
      (offsetListItem) => {
        return selectionData.isLeftToRight
          ? offsetListItem.range[1] <= focusOffset
          : offsetListItem.range[0] >= focusOffset;
      }
    );
  } else if (focusNode instanceof CustomGapNode) {
    // Gap词
    const parent = focusNode.getParent() as CustomGapWordContentNode;
    const offset = getGapOffsetLeft(focusNode)
    const offsetRange:[number,number] = selectionData.isLeftToRight ? [0, selectionData.focus.offset + offset] : [selectionData.focus.offset + offset, parent.length]
    focusGapNode.node = focusNode
    focusGapNode.range = offsetRange
  }
  // 如果选中的单词是空的，则不选中
  const shouldNotDelete = focusWords.length === 1 && !focusWords[0].word.text
  const focusDelete = shouldNotDelete ? [] : focusWords
  const selectedWords = [...anchorWords, ...innerWords, ...focusDelete];

  return {
    customWords : selectedWords.sort(
      (wordNode1, wordNode2) => wordNode1.word.st - wordNode2.word.st,
    ),
    gapNodes: {
      anchor: anchorGapNode,
      focus: focusGapNode,
      selectedGapNodes
    }
  };
};

// 鼠标抬起-处理点击
export const handleClickKeyup = (
  editor: LexicalEditor,
  selectionData: SelectDataType,
  callback?: (words: Array<Word>, node?: CustomWordNode) => void,
) => {
  const nodes = selectionData.nodes;
  // 点击单词
  const node = nodes[0] as CustomWordNode;
  const words = Object.values(node.offsetListMap || {});
  if (words.length) {
    const nextSiblingNode = node.getNextSibling() as CustomWordNode;
    const isLastClick = selectionData.focus.offset === words[words.length - 1].range[1];
    // 有兄弟节点，而且不是删除线节点，就跳到后面兄弟节点的第一个word上
    if (isLastClick && nextSiblingNode && !nextSiblingNode.hasFormat('strikethrough')) {
      if (nextSiblingNode.offsetListMap) {
        // 普通WordNode
        const wordNodeLists = Object.values(nextSiblingNode.offsetListMap);
        const wordNode = wordNodeLists.filter((wordNode) => wordNode.word.text)[0];
        setSelectRange(editor, nextSiblingNode, wordNode.range);
      } else {
        // 新增词等
        setSelectRange(editor, nextSiblingNode, [0, nextSiblingNode.__text.length]);
      }

    } else {
      const selectRange = getSelectRange(selectionData);
      if (node && node.offsetListMap) {
        if (selectRange[0] >= words[words.length - 1].range[1]) {
          // 已经到了最右边了,准备插入新增词
          const rangeSelection = $createRangeSelection();
          rangeSelection.formatText('italic')
          rangeSelection.setTextNodeRange(node, selectRange[0], node, selectRange[0]);
          $setSelection(rangeSelection);
          return
        }
        Object.keys(node.offsetListMap).forEach((key) => {
          // 寻找并且选中当前光标右边的word >=
          const range = node.offsetListMap[key].range;

          if (selectRange[0] >= range[0] && selectRange[0] < range[1]) {
            const word = node.offsetListMap[key].word;
            // if (word.st === word.ed) {
            //   // 标点符号不处理
            //   return;
            // }
            setSelectRange(editor, node, range, () => {
              callback && callback([word], node);
            }, true);
          }
        });
      }
    }
  } else {
    if (node instanceof CustomGapNode) {
      // Gap词
    } else {
      setSelectRange(editor, node, [0, node.__text.length]);
      // TODO: 选中新增词逻辑
      callback && callback([], node);
    }
    
  }
};

// 鼠标抬起-处理框选
export const handleRangeSelectKeyup = (
  editor: LexicalEditor,
  selectionData: SelectDataType,
  callback?: (words: Array<Word>, node?: CustomWordNode) => void,
) => {
  const nodes = selectionData.nodes;
  if (nodes.length === 1) {
    // 处理单句选中
    if (nodes[0].getType() === 'gap-word') {
      const node = nodes[0] as CustomGapNode;
      const range = getSelectRange(selectionData);
      if (range[1] - range[0] === 1) {
        mouseState.isMouseDown = false;
        setSelectRange(editor, nodes[0] as CustomWordNode, [range[0], range[0]]);
        return 
      }
      const offset = getGapOffsetLeft(node)
      const ofsetRange = [(range[0] + offset), range[1] + offset];
      console.log('range', ofsetRange);
      return 
    }
    const node = nodes[0] as CustomWordNode;
    const selectRange = getSelectRange(selectionData);
    const finnalRange = expandRange(node, selectRange);
    setSelectRange(editor, node, finnalRange);
    callback &&
      callback(
        node instanceof CustomWordNode ? getWordNodesByOffsetRange(node, finnalRange).map((r) => r.word, node) : node,
        node,
      );
  } else {
    // 处理多句选中
    const range = expandMultiRowRange(selectionData);
    setMutiSelectRange(
      editor,
      selectionData.anchor.node,
      selectionData.focus.node,
      range,
    );
    const { customWords, gapNodes } = computedSelectedWords(selectionData, range);
    callback && callback(customWords.filter((r) => r.format !== 4).map((r) => r.word));
  }
};

/**
 * 获取下一个焦点单词
 */
export const findNextFocusWord = (node: CustomWordNode): CustomWordNode | null => {
  let currentNode = node;
  let nextNode = null as any;
  while (!nextNode) {
    const nextSiblingNode = currentNode.getPreviousSibling() as CustomWordNode;
    if (nextSiblingNode) {
      if (!nextSiblingNode.hasFormat('strikethrough') && nextSiblingNode.__text) {
        nextNode = nextSiblingNode;
      } else {
        currentNode = nextSiblingNode;
      }
    } else {
      // 兄弟节点中没找到，就去找父节点
      break;
    }
  }
  if (nextNode) {
    return nextNode;
  } else {
    const parent = node.getParent() as CustomWordContentNode;
    const PreviousParentNode = parent.getParent().getPreviousSibling() as CustomSceneNode;
    if (!PreviousParentNode) {
      return null;
    } else {
      const contentNode = PreviousParentNode.getFirstChild() as CustomWordContentNode;
      const parentNodeLastChildNode = contentNode.getLastChild() as CustomWordNode;
      if (
        parentNodeLastChildNode &&
        !parentNodeLastChildNode.hasFormat('strikethrough') &&
        parentNodeLastChildNode.__text
      ) {
        return parentNodeLastChildNode;
      } else {
        return findNextFocusWord(parentNodeLastChildNode);
      }
    }
  }
};


export const highlightNextWord = (editor, node: CustomWordNode | CustomGapNode): void => {
  const previousNode = findNextFocusWord(node);
  if (previousNode) {
    if (previousNode.offsetListMap) {
      const wordsNodes = Object.values(previousNode.offsetListMap);
      const nextWordNode = wordsNodes[wordsNodes.length - 1];
      setSelectRange(editor, previousNode, nextWordNode.range);
    } else {
      // 普通新增词，就直接选中它
      setSelectRange(editor, previousNode, [0, previousNode.__text.length]);
    }
  } else {
    console.log('end');
  }
}

export const handleDeleteCustomWord = (
  editor: LexicalEditor,
  node: CustomWordNode,
  selectRange: [number, number],
  event: KeyboardEvent,
  callback: any
) => {
  event.preventDefault(); // 阻止默认删除事件
  //处理选中单句删除的情况
  const wordsNodes = Object.values(node.offsetListMap || {});
  //光标未选中任何区间，判断是否需要创建选区
  const needSelectRange = selectRange[0] === selectRange[1];
  if (needSelectRange) {
    // 查找光标左边的word
    const nextWordNode = getLeftRightWordByOffset(node, selectRange[0]).left;
    if (nextWordNode) {
      // 先选中再处理
      setSelectRange(editor, node, nextWordNode.range, () => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
        callback && callback([nextWordNode.word]);
      });
    }
  } else {
    const offsetListMapItemList = getWordNodesByOffsetRange(node, selectRange);
    // 已经选中区间的直接处理
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
    callback && callback(offsetListMapItemList.map((item) => item.word));
  }
  // 光标选中到节点头部，寻找并且选中下一个节点
  if (selectRange[0] === 0) {
    highlightNextWord(editor, node);
  } else {
    // 如果光标未闭合，就选取右侧的offset计算下一个高亮的word,(句子末尾点击的情况)，否则就选取左边的
    const offset = needSelectRange ? selectRange[1] : selectRange[0];
    const copyNode = JSON.parse(JSON.stringify(node));
    const nextWordNode = getLeftRightWordByOffset(copyNode, offset).left;
    const preWordNode = wordsNodes[nextWordNode.pre];
    const range = needSelectRange ? preWordNode.range : nextWordNode.range;
    setSelectRange(editor, copyNode, range);
  }
}

export const handleDeleteGapWord = (
  editor: LexicalEditor,
  node: CustomGapNode,
  event: KeyboardEvent,
  selectionData: SelectDataType
) => {
  event.preventDefault();
  const range = getSelectRange(selectionData);
  const offset = getGapOffsetLeft(node)
  const offsetRange = [(range[0] + offset), range[1] + offset];
  const needSelectRange = range[0] === range[1];
  if (needSelectRange) {
      setSelectRange(editor, node, [range[1] - 1, range[1]], () => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
      })
  } else {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
  }
  if (range[0] === 0) {
    highlightNextWord(editor, node);
  } else {
    const nextRange:[number,number] = needSelectRange ? [range[1] - 2 ,range[1] - 1] : [range[0] - 1, range[0]];
    setSelectRange(editor, node, nextRange);
  }
  console.log(`删除了GAP,id=${node.id}`,range, offsetRange);
}