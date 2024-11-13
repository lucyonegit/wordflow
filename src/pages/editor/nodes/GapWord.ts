import { EditorConfig, type SerializedTextNode, type Spread, TextNode } from 'lexical';

import { CustomWordNode } from './WordNode';

export interface CustomWordNodeProps {
  time: number;
  id: string;
  showFormatFn:(time: number) => string
}
export type CustomWordNodeType = Spread<
  {
    type: 'gap-word';
    id: string;
    version: 1;
    time: number,
    __key: string | number;
    showFormatFn:(time: number) => string
  },
  SerializedTextNode
>;
export class CustomGapNode extends TextNode {
  id: string
  time: number
  showFormatFn:(time: number) => string = (time: number) => `${time}ms`
  constructor(word: CustomWordNodeProps, key?: string) {
    const { id, time, showFormatFn } = word;
    const formatFn = showFormatFn || ((time: number) => `${time}`)
    super(formatFn(time), key);
    this.showFormatFn = formatFn
    this.id = id
    this.time = time
    
  }
  static getType() {
    return 'gap-word';
  }

  static clone(node: CustomGapNode) {
    const word = {
      time: node.time,
      id: node.id,
      showFormatFn: node.showFormatFn
    };
    return new CustomGapNode(word, node.__key);
  }
  isToken(): boolean {
    return true
  }
  isSimpleText() {
    return true
  }
  isUnmergeable() {
    return false;
  }

  mergeWithSibling(target: CustomGapNode | CustomWordNode) {
    if (target instanceof CustomGapNode) {
      const t = target.time + this.time;
      this.time = t;
      this.setTextContent(this.showFormatFn(t));
      target.remove();
      return this
    } else {
      return this
    }
  }
  static importJSON(serializedNode: CustomWordNodeType) {
    serializedNode.showFormatFn = serializedNode.showFormatFn
        ? new Function('return ' + serializedNode.showFormatFn)() // 将字符串恢复为函数
        : ((time: number) => `${time}`)
    const node = $createWordNode(serializedNode);
    return node;
  }

  createDOM(config: EditorConfig) {
    const dom = super.createDOM(config);
    dom.classList.add('scene-asr-word');
    dom.classList.add('scene-asr-word-gap');
    dom.textContent = this.showFormatFn(this.time); 
    return dom;
  }

  updateDOM(prevNode: CustomGapNode, dom: HTMLElement, config: EditorConfig) {
    super.updateDOM(prevNode, dom, config);
    if (prevNode.time !== this.time || prevNode.__text !== this.__text) {
      return true
    }
    return false
  }

  exportJSON() {
    const serializeJSON = {
      ...super.exportJSON(),
      type: 'gap-word',
      time: this.time,
      showFormatFn: this.showFormatFn.toString()
    };
    return serializeJSON;
  }
}

export function $createWordNode(word: CustomWordNodeProps, key?: string) {
  return new CustomGapNode(word, key);
}
