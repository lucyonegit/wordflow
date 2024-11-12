import { EditorConfig, type SerializedTextNode, type Spread, TextNode } from 'lexical';

export interface CustomWordNodeProps {
  time: number;
  id: string;
}
export type CustomWordNodeType = Spread<
  {
    type: 'gap-word';
    id: string;
    version: 1;
    time:number,
    __key: string | number;
  },
  SerializedTextNode
>;
export class CustomGapNode extends TextNode {
  id: string
  time: number
  constructor(word: CustomWordNodeProps, key?: string) {
    const { id,time} = word;
    super(`text: ${time}ms`, key);
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
    };
    return new CustomGapNode(word, node.__key);
  }
  isToken(): boolean {
    return true
  }
  // isSimpleText() {
  //   return false
  // }
  // isTextEntity(): boolean {
  //   return false
  // }
  isUnmergeable() {
    return false;
  }

  mergeWithSibling(target: CustomGapNode) {
    debugger
    if (target instanceof CustomGapNode) {
      return super.mergeWithSibling(target)
    } else {
      return this
    }
  }
  static importJSON(serializedNode: CustomWordNodeType) {
    const node = new CustomGapNode(serializedNode);
    return node;
  }

  createDOM(config: EditorConfig) {
    const dom = super.createDOM(config);
    dom.classList.add('scene-asr-word');
    dom.classList.add('scene-asr-word-gap');
    dom.textContent = `text: ${this.time}ms`; 
    // 增加停顿词类名
    return dom;
  }

  updateDOM(prevNode: CustomGapNode) {
    if (prevNode.time !== this.time || prevNode.__text !== this.__text) {
      return true
    }
    return false
  }

  exportJSON() {
    const serializeJSON = {
      ...super.exportJSON(),
      type: 'gap-word',
      time: this.time
    };
    return serializeJSON;
  }
}

export function $createWordNode(word: CustomWordNodeProps, key?: string) {
  return new CustomGapNode(word, key);
}
