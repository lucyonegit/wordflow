import { EditorConfig, type SerializedTextNode, type Spread, TextNode } from 'lexical';

export interface CustomWordNodeProps {
  text: string;
  id: string;
}
export type CustomWordNodeType = Spread<
  {
    type: 'gap-word';
    id: string;
    version: 1;
    text: string;
    __key: string | number;
  },
  SerializedTextNode
>;
export class CustomGapNode extends TextNode {
  id : string
  constructor(word: CustomWordNodeProps, key?: string) {
    const { text, id} = word;
    super(text, key);
    this.id = id
  }
  static getType() {
    return 'gap-word';
  }

  static clone(node: CustomGapNode) {
    const word = {
      text: node.__text,
      id: node.id,
    };
    return new CustomGapNode(word, node.__key);
  }

  isSimpleText() {
    return true;
  }
  splitText(...offsets: [number, number]) {
    let splitNodes = super.splitText(...offsets);
    if (splitNodes.length > 1) {
      splitNodes = splitNodes.map((node => {
        if (node.__type === 'text') {
          const newNode = new CustomGapNode({
            text: node.__text,
            id: this.id
          })
          node.replace(newNode)
          return newNode
        }
        return node
      }))
    }
    return splitNodes;
  }
  isUnmergeable() {
    return false;
  }
  mergeWithSibling(target: CustomGapNode) {
    if (target instanceof CustomGapNode) {
      return super.mergeWithSibling(target)
    } else {
      return this
    }
  }
  static importJSON(serializedNode: CustomWordNodeType) {
    const node = new CustomGapNode(serializedNode);
    node.setFormat(serializedNode.format);
    return node;
  }

  createDOM(config: EditorConfig) {
    const dom = super.createDOM(config);
    dom.classList.add('gap-word');
    // 增加停顿词类名
    return dom;
  }

  updateDOM(prevNode: CustomGapNode, dom: HTMLElement, config: EditorConfig) {
    return super.updateDOM(prevNode, dom, config);
  }

  exportJSON() {
    const serializeJSON = {
      ...super.exportJSON(),
      type: 'gap-word'
    };
    return serializeJSON;
  }
}

export function $createWordNode(word: CustomWordNodeProps, key?: string) {
  return new CustomGapNode(word, key);
}
