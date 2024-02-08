import { ElementNode, type SerializedElementNode, type Spread } from 'lexical';
export interface CustomWordContentNodeProps {
  children: Array<unknown>;
}
export type CustomWordContentNodeType = Spread<
  {
    type: 'words-content';
    children: Array<unknown>;
    __key: string | number;
  },
  SerializedElementNode
>;
export class CustomWordContentNode extends ElementNode {
  children: Array<any>;
  constructor(props: CustomWordContentNodeProps, key?: string) {
    super(key);
    const { children } = props;
    this.children = children;
  }
  static getType() {
    return 'words-content';
  }

  static clone(node: CustomWordContentNode) {
    return new CustomWordContentNode(node, node.__key);
  }

  static importDOM() {
    return {};
  }

  static importJSON(serializedNode: CustomWordContentNodeType) {
    return $createSceneNode(serializedNode);
  }

  createDOM() {
    const dom = document.createElement('div');
    dom.classList.add('scene-words-content');
    return dom;
  }

  updateDOM() {
    return false;
  }

  exportJSON() {
    const serialized = {
      ...super.exportJSON(),
      type: 'words-content'
    };
    return serialized;
  }
}

export function $createSceneNode(props: CustomWordContentNodeProps) {
  return new CustomWordContentNode(props);
}
