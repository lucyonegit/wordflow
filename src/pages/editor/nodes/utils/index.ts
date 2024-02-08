import { SelectDataType } from '../../plugins/EventHandlePlugin/utils/utils';
import { CustomWordNode, offsetListMapItem } from '../WordNode';

export const getOffsetsFromSelectData = (
  selectionData: SelectDataType,
  wordNode: CustomWordNode,
): [number, number] => {
  const wordNodes = Object.values(wordNode.offsetListMap);
  if (selectionData.isLeftToRight) {
    if (wordNode === selectionData.focus.node) {
      return [0, selectionData.focus.offset];
    } else {
      return [selectionData.anchor.offset, wordNodes[wordNodes.length - 1].range[1]];
    }
  } else {
    if (wordNode === selectionData.focus.node) {
      return [selectionData.focus.offset, wordNodes[wordNodes.length - 1].range[1]];
    } else {
      return [0, selectionData.anchor.offset];
    }
  }
};

/**
 * 根据offsets获取选中区域内外的words，并且重新组装每个wordNode的offsetListMap以及range
 */
export const getWordsByOffsets = (
  WordNodes: CustomWordNode,
  offsets: [number, number],
) => {
  const result: {
    leftWords: { [uuid: string]: offsetListMapItem };
    rightWords: { [uuid: string]: offsetListMapItem };
    innerWord: { [uuid: string]: offsetListMapItem };
  } = {
    leftWords: {},
    rightWords: {},
    innerWord: {},
  };
  // 这里判断WordNodes.offsetListMap 是需要保证WordNodes一定是自定义节点
  if (WordNodes.offsetListMap) {
    let preLeftOffsetStart = 0;
    let preRightOffsetStart = 0;
    let preInnerOffsetStart = 0;
    let leftCount = 0;
    let rightCount = 0;
    let innerCount = 0;
    Object.keys(WordNodes.offsetListMap).forEach((wordNodeId) => {
      // 这里需要深拷贝一份数据，避免对影响WordNode原节点，后面的运算要依赖WordNode未拆分前的offset数据
      const wordNode = JSON.parse(JSON.stringify(WordNodes.offsetListMap[wordNodeId]));
      const wordLength = wordNode.word.text.length;
      if (wordNode.range[1] <= offsets[0]) {
        wordNode.range = [preLeftOffsetStart, preLeftOffsetStart + wordLength];
        wordNode.pre = leftCount === 0 ? -1 : leftCount;
        wordNode.next = leftCount + 1;
        result.leftWords[wordNodeId] = wordNode;
        preLeftOffsetStart += wordLength;
        leftCount++;
      } else if (wordNode.range[0] >= offsets[1]) {
        wordNode.range = [preRightOffsetStart, preRightOffsetStart + wordLength];
        wordNode.pre = rightCount === 0 ? -1 : rightCount;
        wordNode.next = rightCount + 1;
        result.rightWords[wordNodeId] = wordNode;
        preRightOffsetStart += wordLength;
        rightCount++;
      } else {
        wordNode.range = [preInnerOffsetStart, preInnerOffsetStart + wordLength];
        wordNode.pre = innerCount === 0 ? -1 : innerCount;
        wordNode.next = innerCount + 1;
        result.innerWord[wordNodeId] = wordNode;
        preInnerOffsetStart += wordLength;
        innerCount++;
      }
    });
  }
  return result;
};
/**
 * 给拆分的WordNode设置offsetListMap
 */
export const setOffsetListMap = (
  WordNode: CustomWordNode,
  offsets: [number, number] | [number],
  splitNodes: Array<CustomWordNode>,
  selectionData: SelectDataType,
) => {
  let currentOffsets = offsets;
  if (offsets.length === 1) {
    // 跨多行选择删除的时候，offset值为[number]，而不是[number, number]，因此需要重新计算
    currentOffsets = getOffsetsFromSelectData(selectionData, WordNode);
  }
  const result = getWordsByOffsets(WordNode, currentOffsets as [number, number]);
  // 将重新拼装的结果赋给splitNodes
  const offsetList: Array<offsetListMapItem> = Object.values(WordNode.offsetListMap);
  const lastWordRange = offsetList[offsetList.length - 1].range;
  // tips:全选的case不用处理
  if (currentOffsets[0] === 0 && lastWordRange[1] !== currentOffsets[1]) {
    // 左边边界
    console.log('左边边界');
    splitNodes[0].offsetListMap = { ...result.leftWords, ...result.innerWord };
    splitNodes[1].offsetListMap = { ...result.rightWords };
  } else if (currentOffsets[0] !== 0 && lastWordRange[1] === currentOffsets[1]) {
    // 右边边界
    console.log('右边边界');
    splitNodes[0].offsetListMap = { ...result.leftWords };
    splitNodes[1].offsetListMap = { ...result.innerWord, ...result.rightWords };
  } else {
    // 中间选中
    console.log('中间选中');
    splitNodes[0].offsetListMap = result.leftWords;
    splitNodes[1].offsetListMap = result.innerWord;
    splitNodes[2].offsetListMap = result.rightWords;
  }
};

/**
 * 合并offsetListMap（WorsdNode merge）
 */
export const combineOffsetListMap = (
  offsetListMap: { [uuid: string]: offsetListMapItem },
  targetOffsetListMap: { [uuid: string]: offsetListMapItem },
) => {
  let wordCount = 0;
  let offset = 0;
  const wordList = [
    ...Object.values(offsetListMap),
    ...Object.values(targetOffsetListMap),
  ] as Array<offsetListMapItem>;
  const copyWordList = JSON.parse(JSON.stringify(wordList)) as Array<offsetListMapItem>;
  copyWordList.sort((a, b) => {
    return a.word.st - b.word.st;
  });
  const newOffsetListMap = copyWordList.reduce((result, cur) => {
    const curWordLength = cur.word.text.length;
    cur.range = [offset, offset + curWordLength];
    cur.pre = wordCount === 0 ? -1 : wordCount;
    cur.next = wordCount + 1;
    result[cur.word.id] = cur;
    offset += curWordLength;
    wordCount++;
    return result;
  }, {} as { [uuid: string]: offsetListMapItem });
  return newOffsetListMap;
};
