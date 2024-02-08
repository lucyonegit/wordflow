import { LexicalEditor } from "lexical";

import { CustomWordNode, offsetListMapItem } from "../../../nodes/WordNode";

export type RangeResult = Array<{
  index: number;  // 结果集中的序号
  range: Range; // 浏览器Range实例
  wordNode: CustomWordNode; //  当前Range下对应的完整行
  words: Array<offsetListMapItem>; // 当前Range下对应的单词
  timeRange: [number, number];  // 当前Range的时间范围
  el: HTMLElement; // 当前Range对应的DOM
  offsets: [number, number]; // 当前Range的offset文字偏移量
}>

/**
 * 获取选取区间内部的word
 */
export const getWordNodesByOffsetRange = (node: CustomWordNode, selectRange: [number, number]) => {
  const wordNodes = [] as Array<offsetListMapItem>;
  Object.keys(node.offsetListMap).forEach((key) => {
    const range = node.offsetListMap[key].range;
    if (range[0] !== range[1]) {
      if (range[0] < selectRange[1] && range[1] > selectRange[0]) {
        wordNodes.push(node.offsetListMap[key]);
      }
    }
  });
  return wordNodes;
};

/**
 * 获取搜索结果的范围列表
 */
export const getSearchResultRangeList = (editor: LexicalEditor, str: string) => {
  let count = 0
  const wordsNodes = [...editor.getEditorState()._nodeMap.values()].filter(
    (node) => node.getType() === "scene-asr-word"
  ) as Array<CustomWordNode>;
  const ranges = wordsNodes.reduce((result, wordNode) => {
    const wordNodeElement = editor.getElementByKey(wordNode.__key) as HTMLElement;
    const textNode = wordNodeElement.firstChild as Text;
    const text = wordNode.__text;
    const indices = [] as Array<number>;
    let startPos = 0;
    while (startPos < text.length) {
      const index = text.indexOf(str, startPos);
      if (index === -1) break;
      indices.push(index);
      startPos = index + str.length;
    }
    if (indices.length !== 0) {
      // 根据搜索词的位置创建选区
      const currentRanges = indices.map((index) => {
        const range = new Range();
        range.setStart(textNode, index);
        range.setEnd(textNode, index + str.length);
        const offsets: [number, number] = [index, index + str.length];
        const words = getWordNodesByOffsetRange(wordNode, offsets);
        const timeRange: [number, number] = [words[0].word.st, words[words.length - 1].word.ed];
        return {
          index: count++,
          range,
          wordNode,
          words,
          timeRange,
          el: wordNodeElement,
          offsets,
        };
      });
      result.push(...currentRanges);
    }
    return result;
  }, [] as RangeResult);
  return ranges
};

/**
 * 设置高亮
 */
export const setHighLight = (ranges, currentFocus) => {
  if (!ranges.length) return
  CSS.highlights.clear();
  const focusRange = ranges[currentFocus];
  const normalRange = ranges.filter((range) => range !== focusRange);
  const normalHighlight = new Highlight(...(normalRange.map((r) => r.range)));
  const focusHighlight = new Highlight(focusRange.range);
  focusRange.el.scrollIntoView({ behavior: "smooth", block: "center" });
  CSS.highlights.set("search-focus", focusHighlight);
  CSS.highlights.set("search-normal", normalHighlight);
};