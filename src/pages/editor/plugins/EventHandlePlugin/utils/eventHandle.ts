import { FORMAT_TEXT_COMMAND, LexicalEditor } from 'lexical';

import { Word } from '../../../nodes/WordNode';
import { CustomWordNode } from '../../../nodes/WordNode';

import {
  findNextFocusWord,
  getCurrentSelectionData,
  getLeftRightWordByOffset,
  getSelectRange,
  getWordNodesByOffsetRange,
  handleClickKeyup,
  handleRangeSelectKeyup,
  setSelectRange,
} from './utils';

export const handleDelete = (
  editor: LexicalEditor,
  callback?: { (words: Array<Word>): void },
) => {
  const selectionData = getCurrentSelectionData();
  const nodes = selectionData.nodes;
  if (nodes.length === 1) {
    const selectRange = getSelectRange(selectionData);
    //处理选中单句删除的情况
    const node = nodes[0] as CustomWordNode;
    const wordsNodes = Object.values(node.offsetListMap);
    // 删除的是普通自定义word
    if (node.offsetListMap) {
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
      // 光标选中到节点头部
      if (selectRange[0] === 0) {
        const previousNode = findNextFocusWord(node);
        if (previousNode) {
          const wordsNodes = Object.values(previousNode.offsetListMap);
          const nextWordNode = wordsNodes[wordsNodes.length - 1];
          setSelectRange(editor, previousNode, nextWordNode.range);
        } else {
          console.log('ending---别删了');
        }
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
  } else {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
    const firstNode = selectionData.indexNode.getNode() as CustomWordNode;
    if (selectionData.indexNode.offset === 0) {
      const previousNode = findNextFocusWord(firstNode);
      if (previousNode) {
        const wordsNodes = Object.values(previousNode.offsetListMap);
        const nextWordNode = wordsNodes[wordsNodes.length - 1];
        setSelectRange(editor, previousNode, nextWordNode.range);
      } else {
        // 处理全部删除完了的情况
        console.log('ending---别删了');
      }
    } else {
      // 选取offset计算下一个高亮的word
      const nextWordNode = getLeftRightWordByOffset(
        firstNode,
        selectionData.indexNode.offset,
      ).left;
      const range = nextWordNode.range;
      setSelectRange(editor, firstNode, range);
    }
  }
};

/**
 * 鼠标抬起事件
 */
export const handleKeyUp = (editor: LexicalEditor, callback?: (words: Array<Word>, node?: CustomWordNode) => void) => {
  CSS.highlights.clear()
  editor.update(() => {
    const selectionData = getCurrentSelectionData();
    if (selectionData.isClick) {
      handleClickKeyup(editor, selectionData, callback);
    } else {
      handleRangeSelectKeyup(editor, selectionData, callback);
    }
  });
};
