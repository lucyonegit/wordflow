import { ElementNode, type SerializedElementNode, type Spread } from 'lexical';
export interface CustomSceneNodeProps {
  id: number;
  time: string;
  children: Array<unknown>;
}
export type CustomSceneNodeType = Spread<
  {
    type: 'scene-node';
    id: number;
    version: 1;
    time: string;
    __key: string | number;
  },
  SerializedElementNode
>;
export class CustomSceneNode extends ElementNode {
  id: number;
  time: string;
  children: Array<any>;
  constructor(props: CustomSceneNodeProps, key?: string) {
    super(key);
    const { id, time, children } = props;
    this.id = id;
    this.time = time;
    this.children = children;
  }
  static getType() {
    return 'scene-node';
  }

  static clone(node: CustomSceneNode) {
    return new CustomSceneNode(node, node.__key);
  }

  static importDOM() {
    return {};
  }

  static importJSON(serializedNode: CustomSceneNodeType) {
    return $createSceneNode(serializedNode);
  }

  createDOM(config: any) {
    const { sceneNode, sceneTime } = config.theme.scene;
    const dom = document.createElement('div');
    const time = document.createElement('div');
    dom.classList.add(sceneNode);
    time.classList.add(sceneTime);
    time.textContent = this.time;
    time.setAttribute('contenteditable', 'false');
    dom.appendChild(time);
    return dom;
  }
  $updateTime(time, dom) {
    this.getWritable().time = time;
    const timeDom = dom.querySelector('.scene-time');
    if (timeDom) {
      timeDom.textContent = time;
    }
  }

  updateDOM(prevNode: CustomSceneNode, dom: HTMLElement) {
    if (prevNode.time !== this.time) {
      this.$updateTime(this.time, dom);
    }
    return false;
  }

  exportJSON() {
    const serialized = {
      ...super.exportJSON(),
      type: 'scene-node',
      version: 1,
    };
    return serialized;
  }
}

export function $createSceneNode(props: CustomSceneNodeProps) {
  return new CustomSceneNode(props);
}
