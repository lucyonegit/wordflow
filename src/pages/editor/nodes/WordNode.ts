import { EditorConfig, type SerializedTextNode, type Spread, TextNode } from 'lexical';

import { CustomGapNode } from './GapWord';

export interface CustomWordNodeProps {
  text: string;
  wordType: 'gap' | 'repeat' | 'tone' | 'other';
}
export type CustomWordNodeType = Spread<
  {
    type: 'scene-asr-word';
    id: number;
    version: 1;
    text: string;
    wordType: 'gap' | 'repeat' | 'tone' | 'other';
    __key: string | number;
  },
  SerializedTextNode
>;
export class CustomWordNode extends TextNode {
  wordType: 'gap' | 'repeat' | 'tone' | 'other' = 'other';
  constructor(word: CustomWordNodeProps, key?: string) {
    const { text, wordType } = word;
    super(text, key);
    this.wordType = wordType||'other';
  }
  static getType() {
    return 'scene-asr-word';
  }

  static clone(node: CustomWordNode) {
    const word = {
      text: node.__text,
      wordType: node.wordType,
    };
    return new CustomWordNode(word, node.__key);
  }

  splitText(...offsets: [number, number]) {
    let splitNodes = super.splitText(...offsets) as Array<CustomWordNode>;
    if (splitNodes.length > 1) {
      splitNodes = splitNodes.map((node => {
        if (node.__type === 'text') {
          const newNode = new CustomWordNode({
            text: node.__text,
            wordType: node.wordType,
          })
          node.replace(newNode)
          return newNode
        }
        return node
      }))
    }
    return splitNodes;
  }

  mergeWithSibling(target: CustomWordNode | CustomGapNode) {
    if(target instanceof CustomWordNode) {
      return super.mergeWithSibling(target)
    }
    return this;
  }

  isSimpleText() {
    return true;
  }

  static importJSON(serializedNode: CustomWordNodeType) {
    const node = new CustomWordNode(serializedNode);
    node.setFormat(serializedNode.format);
    return node;
  }

  createDOM(config: EditorConfig) {
    const dom = super.createDOM(config);
    dom.classList.add('scene-asr-word');
    return dom;
  }
  updateDOM(prevNode: CustomWordNode, dom: HTMLElement, config: EditorConfig) {
    return super.updateDOM(prevNode, dom, config);
  }

  exportJSON() {
    const serializeJSON = {
      ...super.exportJSON(),
      type: 'scene-asr-word',
      wordType: this.wordType,
    };
    return serializeJSON;
  }
}

export function $createWordNode(word: CustomWordNodeProps, key?: string) {
  return new CustomWordNode(word, key);
}
