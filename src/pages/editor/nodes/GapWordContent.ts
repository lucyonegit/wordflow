import { ElementNode, type SerializedElementNode, type Spread } from 'lexical';
export interface CustomGapWordContentNodeProps {
  id: string,
  children: Array<unknown>;
  startPos: number,
  endPos: number,
  length:number
}
export type CustomGapWordContentNodeType = Spread<
  {
    type: 'gap-words-content';
    id: string,
    startPos: number,
    endPos: number,
    children: Array<unknown>;
    length:number,
    __key: string | number;
  },
  SerializedElementNode
>;
export class CustomGapWordContentNode extends ElementNode {
  id: string;
  startPos: number;
  endPos: number;
  children: Array<any>;
  length: number;
  constructor(props: CustomGapWordContentNodeProps, key?: string) {
    super(key);
    const { children, startPos, endPos, id,length } = props;
    this.id = id;
    this.startPos = startPos;
    this.endPos = endPos;
    this.length = length
    this.children = children;
  }
  static getType() {
    return 'gap-words-content';
  }

  static clone(node: CustomGapWordContentNode) {
    
    return new CustomGapWordContentNode(node, node.__key);
  }

  static importDOM() {
    return {};
  }

  static importJSON(serializedNode: CustomGapWordContentNodeType) {
    return $createSceneNode(serializedNode);
  }

  createDOM() {
    const dom = document.createElement('span');
    dom.classList.add('gap-words-content');
    return dom;
  }

  updateDOM() {
    return false;
  }

  exportJSON() {
    const serialized = {
      ...super.exportJSON(),
      type: 'gap-words-content'
    };
    return serialized;
  }
}

export function $createSceneNode(props: CustomGapWordContentNodeProps) {
  return new CustomGapWordContentNode(props);
}
