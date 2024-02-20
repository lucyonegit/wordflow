import { EditorConfig, type SerializedTextNode, type Spread, TextNode } from 'lexical';

import { getCurrentSelectionData } from '../plugins/EventHandlePlugin/utils/utils';

import { combineOffsetListMap, setOffsetListMap } from './utils/index';
export interface CustomWordNodeProps {
  text: string;
  wordType: 'gap' | 'repeat' | 'tone' | 'other';
  offsetListMap: {
    [uuid: string]: offsetListMapItem;
  };
}
export interface Word {
  id: string;
  text: string;
  type: number;
  st: number;
  ed: number;
}
export interface offsetListMapItem {
  range: [number, number];
  pre: number;
  next: number;
  word: Word;
  format: number;
}
export type CustomWordNodeType = Spread<
  {
    type: 'scene-asr-word';
    id: number;
    version: 1;
    text: string;
    wordType: 'gap' | 'repeat' | 'tone' | 'other';
    offsetListMap: {
      [uuid: string]: offsetListMapItem;
    };
    __key: string | number;
  },
  SerializedTextNode
>;
export class CustomWordNode extends TextNode {
  offsetListMap: { [uuid: string]: offsetListMapItem };
  isActive: boolean;
  wordType: 'gap' | 'repeat' | 'tone' | 'other';
  constructor(word: CustomWordNodeProps, key?: string) {
    const { text, offsetListMap, wordType } = word;
    super(text, key);
    this.isActive = false;
    this.offsetListMap = offsetListMap;
    this.wordType = wordType;
  }
  static getType() {
    return 'scene-asr-word';
  }

  static clone(node: CustomWordNode) {
    const word = {
      text: node.__text,
      offsetListMap: node.offsetListMap,
      wordType: node.wordType,
    };
    return new CustomWordNode(word, node.__key);
  }

  splitText(...offsets: [number, number]) {
    const selectionData = getCurrentSelectionData();
    // TODO: split的结果一定是wordNode（目前项目中没有其他节点，未来需要check）
    const splitNodes = super.splitText(...offsets) as Array<CustomWordNode>;
    if (splitNodes.length > 1) {
      // 拆分后有多个子WordNode的的情况才需要重组offsetListMap
      setOffsetListMap(this, offsets, splitNodes, selectionData);
    }
    console.log(splitNodes)
    return splitNodes;
  }
  isSimpleText() {
    return true;
  }
  mergeWithSibling(target: CustomWordNode) {
    const mergeResult = super.mergeWithSibling(target) as CustomWordNode;
    const offsetListMap = combineOffsetListMap(this.offsetListMap, target.offsetListMap);
    mergeResult.offsetListMap = offsetListMap;
    return mergeResult;
  }

  isUnmergeable() {
    if (
      this.wordType === 'gap' ||
      this.wordType === 'tone' ||
      this.wordType === 'repeat'
    ) {
      return true;
    }
    return false;
  }

  static importJSON(serializedNode: CustomWordNodeType) {
    const node = new CustomWordNode(serializedNode);
    node.setFormat(serializedNode.format);
    return node;
  }

  createDOM(config: EditorConfig) {
    const dom = super.createDOM(config);
    dom.classList.add('scene-asr-word');
    // 增加停顿词类名
    if (this.wordType === 'gap') {
      dom.classList.add('scene-word-gap');
    }
    // 增加语气词类名
    if (this.wordType === 'tone') {
      dom.classList.add('scene-word-tone');
    }
    // 增加重复词类名
    if (this.wordType === 'repeat') {
      dom.classList.add('scene-word-repeat');
    }
    return dom;
  }

  _setActive(status: boolean) {
    const r = this.getWritable();
    r.isActive = status;
  }
  updateDOM(prevNode: CustomWordNode, dom: HTMLElement, config: EditorConfig) {
    if (prevNode.isActive !== this.isActive) {
      dom.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
    return super.updateDOM(prevNode, dom, config);
  }

  exportJSON() {
    const serializeJSON = {
      ...super.exportJSON(),
      type: 'scene-asr-word',
      offsetListMap: this.offsetListMap,
    };
    return serializeJSON;
  }
}

export function $createWordNode(word: CustomWordNodeProps, key?: string) {
  return new CustomWordNode(word, key);
}
