import { useEffect, useRef, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { Button, Slider } from "antd";
import {
  $getSelection,
  $isRangeSelection,
  SerializedEditorState,
  SerializedLexicalNode,
  TextNode,
} from "lexical";

import data from "../../mock/data/data";
import { useStore } from "../../store/global";

import { CustomGapNode } from "./nodes/GapWord";
import { CustomSceneNode } from "./nodes/SceneNode";
import { CustomWordContentNode } from "./nodes/WordContentNode";
import { CustomWordNode } from "./nodes/WordNode";
import EventPlugin from "./plugins/EventHandlePlugin";
import { getCurrentSelectionData } from "./plugins/EventHandlePlugin/utils/eventHandle";

import "./style.less";

const InitPlugin: React.FC = () => {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    const editorState = editor.parseEditorState(
      data as SerializedEditorState<SerializedLexicalNode>
    );
    editor.setEditorState(editorState, { tag: "load" });
  }, [editor]);
  return "";
};
const SplitPlugin: React.FC = () => {
  const [editor] = useLexicalComposerContext();

  return (
    <div>
    <Button
      onClick={() => {
        editor.update(() => {
          // 获取当前选区信息
          const r = getCurrentSelectionData();
          const node = r.nodes[r.nodes.length - 1] as TextNode;
          const offset = r.anchor.offset; // 保存当前选区的偏移量

          const [partNode1, partNode2] = node.splitText(
            0,
            offset
          ) as TextNode[];
          // 确保新分割出来的节点文本内容被更新
          partNode1 && partNode1.setTextContent(partNode1.__text);
          partNode2 && partNode2.setTextContent(partNode2.__text);
          const method = offset === 0 ? 'insertBefore' : 'insertAfter';
          const time = parseInt(1000 * Math.random() + '');
          partNode1[method](new CustomGapNode({
            id: new Date().getTime().toString(),
            time,
            showFormatFn: (time: number) => `${time}ms`
          }));
          const selection = $getSelection();
          if (selection && $isRangeSelection(selection)) {
            selection.setTextNodeRange(partNode1, offset === 0 ? 0 :partNode1.__text.length, partNode1, offset === 0 ? 0 : partNode1.__text.length);
          }
        });
      }}
    >
      拆分node
      </Button>
      <Button onClick={() => {
        editor.getEditorState().read(() => {
          const r = editor.getEditorState().toJSON();
          console.log(r.root.children.reduce((pre, item) => {
            const nodes = (item as any).children[0].children;
            const lineText = nodes.reduce((pre1, item1) => {
              // TODO: 这里需要根据node类型处理字符串拼接规则
              pre1 += item1.text
              return pre1
            }, '')
            pre += lineText;
            return pre
          },''));
        })
      }}>获取所有nodes</Button>
      </div>
  );
};
const ScriptProvider: React.FC = () => {
  const warper = useRef(null);
  const time1 = useRef(0);
  const setCurrentTime = useStore((state) => state.setCurrentTime);
  const initialConfig = useRef({
    namespace: "ScriptEditor",
    theme: {
      ltr: "ltr",
      rtl: "rtl",
      placeholder: "editor-placeholder",
      paragraph: "editor-paragraph",
      text: {
        bold: "Editor__textBold",
        code: "Editor__textCode",
        italic: "Editor__textItalic",
        strikethrough: "Editor__textStrikethrough",
        underlineStrikethrough: "Editor__textUnderlineStrikethrough",
      },
      scene: {
        sceneNode: "scene-node",
        sceneTime: "scene-time",
      },
    },
    onError: (error: Error) => console.log("editor error", error),
    nodes: [
      CustomSceneNode,
      CustomWordContentNode,
      CustomWordNode,
      CustomGapNode,
      {
        replace: TextNode,
        with: (node) => {
          const config = {
            text: node.__text,
            ...node,
          };
          return new CustomWordNode(config);
        },
      },
    ],
  });
  const [warperLoaded, setWarperLoaded] = useState(false);
  useEffect(() => {
    setWarperLoaded(true);
  }, []);

  return (
    <LexicalComposer initialConfig={initialConfig.current}>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <div
          id="editorContainer"
          style={{
            width: "500px",
            height: "800px",
            overflow: "auto",
            paddingRight: "20px",
          }}
          ref={warper}
        >
          {warperLoaded ? (
            <div className="editor">
              <RichTextPlugin
                placeholder={<span>"请输入内容"</span>}
                contentEditable={<ContentEditable />}
                ErrorBoundary={LexicalErrorBoundary}
              />
              <InitPlugin />
              <EventPlugin />
              {/* <HighLightPlugin /> */}
            </div>
          ) : (
            ""
          )}
        </div>
        <div style={{ width: "200px" }}>
    
          <Button
            onClick={() => {
              setInterval(() => {
                time1.current += 50;
                setCurrentTime(time1.current);
              }, 20);
            }}
          >
            start
          </Button>
          <Slider
            min={0}
            max={100000}
            step={1}
            vertical={false}
            defaultValue={0}
            onChange={(value) => setCurrentTime(value)}
          />
          <SplitPlugin></SplitPlugin>
        </div>
      </div>
    </LexicalComposer>
  );
};

export default ScriptProvider;
