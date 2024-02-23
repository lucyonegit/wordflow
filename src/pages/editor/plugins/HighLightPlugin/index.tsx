import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createRangeSelection, $setSelection } from 'lexical';

import { useStore } from '../../../../store/global';
import {
  CustomWordNode,
  offsetListMapItem,
} from '../../nodes/WordNode';
const HighLight: React.FC = () => {
  const [editor] = useLexicalComposerContext();
  const nodes = useRef<Array<any>>();
  const preNode = useRef<CustomWordNode>();
  const preWordNode = useRef<offsetListMapItem>();
  const progress = useStore((store) => store.currentTime);
  const selectedWordIds = useStore((store) => store.selectedIds);

  useEffect(() => {
    // 当框选时只跳转seek到首个字
    if (selectedWordIds.length > 1) {
      return;
    }
    
    nodes.current = [...editor.getEditorState()._nodeMap.values()].filter(
      (n) => n.__type === 'scene-asr-word',
    );
    let highLightNode: CustomWordNode = null as any;
    let wordNode: offsetListMapItem = null as any;
    nodes.current.forEach((node: CustomWordNode) => {
      if (node.__format !== 4) {
        const words = Object.values(node.offsetListMap) as Array<offsetListMapItem>;
        for (const w of words) {
          // 检查时间戳是否在区间内;
          if (progress >= w.word.st && progress <= w.word.ed) {
            wordNode = w;
            highLightNode = node;
          }
        }
      }
    });
    // 如果没有找到需要高亮的node就返回
    if (!highLightNode || !wordNode) return;
    if (preNode.current && preNode.current.__key !== highLightNode.__key) {
      console.log('换个句子');
      // 换个句子高亮，清空上一个的active状态
      editor.update(() => {
        if (preNode.current) {
          preNode.current._setActive(false);
        }
      });
    }
    preNode.current = highLightNode;
    // 如果是同一个wordNode就不需要更新【性能优化】
    if (
      preWordNode.current &&
      preWordNode.current.word.text === wordNode.word.text &&
      preWordNode.current.word.st === wordNode.word.st
    ) {
      return;
    }
    preWordNode.current = wordNode;

    editor.update(() => {
      const rangeSelection = $createRangeSelection();
      rangeSelection.setTextNodeRange(
        highLightNode,
        wordNode.range[0],
        highLightNode,
        wordNode.range[1],
      );
      $setSelection(rangeSelection);
      highLightNode._setActive(true);
    });
  }, [editor, progress, selectedWordIds]);
  return <></>;
};

export default HighLight;
