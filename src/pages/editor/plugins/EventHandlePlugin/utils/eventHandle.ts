import { $createRangeSelection, $setSelection, FORMAT_TEXT_COMMAND, LexicalEditor } from 'lexical';

import { CustomGapNode } from '../../../nodes/GapWord';
import { Word } from '../../../nodes/WordNode';
import { CustomWordNode } from '../../../nodes/WordNode';

import {
  getCurrentSelectionData,
  getLeftRightWordByOffset,
  getSelectRange,
  getWordGroupFromSelectionData,
  handleClickKeyup,
  handleDeleteCustomWord,
  handleDeleteGapWord,
  handleRangeSelectKeyup,
  highlightNextWord,
  setSelectRange,
} from './utils';

export const handleDelete = (
  editor: LexicalEditor,
  event: KeyboardEvent,
  callback?: { (words: Array<Word>): void },
) => {
  const selectionData = getCurrentSelectionData();
  const nodes = selectionData.nodes;
  if (nodes.length === 1) {
    const selectRange = getSelectRange(selectionData);
    //处理选中单句删除的情况
    const node = nodes[0] as CustomWordNode;
    const wordsNodes = Object.values(node.offsetListMap || {});
    // 删除的是普通自定义word
    if (node instanceof CustomWordNode && node.offsetListMap && wordsNodes.length) {
      handleDeleteCustomWord(editor, node, selectRange, event, callback);
    } else {
      //删除gap
      if (node instanceof CustomGapNode) {
        handleDeleteGapWord(editor, node, event, selectionData);
      } else {
      // 删除新增词等其他词，后面还需移动光标
      setSelectRange(editor, node, [0, node.__text.length], () => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
          // TODO: 返回值
          callback && callback([]);
        });
      }
    }
  } else {
    debugger
    event.preventDefault();
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
      const deleteWordsMap = getWordGroupFromSelectionData(selectionData)
      // 格式化语气词
      deleteWordsMap.gapNodes.needFarmatGapNodes.forEach((gap) => {
        const range = $createRangeSelection();
        range.setTextNodeRange(gap.node, gap.range[0] - gap.offset, gap.node, gap.range[1] - gap.offset);
        if (!gap.node.hasFormat('strikethrough')) {
          editor.update(() => {
          $setSelection(range);
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
          });
        }
      })
      callback && callback(deleteWordsMap.customWords.map((r) => r.word));
      const firstNode = selectionData.indexNode.getNode() as CustomWordNode;
      
      if (selectionData.indexNode.offset === 0) {
        highlightNextWord(editor, firstNode);
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
  editor.update(() => {
    const selectionData = getCurrentSelectionData();
    if (selectionData.isClick) {
      handleClickKeyup(editor, selectionData, callback);
    } else {
      handleRangeSelectKeyup(editor, selectionData, callback);
    }
  });
};
