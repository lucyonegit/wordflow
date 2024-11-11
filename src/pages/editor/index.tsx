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
import { CustomGapWordContentNode } from "./nodes/GapWordContent";
import { CustomSceneNode } from "./nodes/SceneNode";
import { CustomWordContentNode } from "./nodes/WordContentNode";
import { CustomWordNode } from "./nodes/WordNode";
import EventPlugin from "./plugins/EventHandlePlugin";
import { getCurrentSelectionData } from "./plugins/EventHandlePlugin/utils/utils";

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
    <Button
      onClick={() => {
        editor.update(() => {
          // 获取当前选区信息
          const r = getCurrentSelectionData();
          const node = r.nodes[r.nodes.length - 1] as TextNode;
          const offset = r.anchor.offset; // 保存当前选区的偏移量
          // 临时允许拆分
          node.getWritable().isUnmergeable = () => true;
          const [partNode1] = node.splitText(
            0,
            offset
          ) as TextNode[];
          const method = offset === 0 ? 'insertBefore' : 'insertAfter';
          partNode1[method](new CustomGapNode({
            id: new Date().getTime().toString(),
            text: '[BreakTime=1100]',
          }));
          node.getWritable().isUnmergeable = () => false;
          const selection = $getSelection();
          if (selection && $isRangeSelection(selection)) {
            selection.setTextNodeRange(partNode1, offset === 0 ? 0 :partNode1.__text.length, partNode1, offset === 0 ? 0 : partNode1.__text.length);
          }
        });
      }}
    >
      拆分node
    </Button>
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
      CustomGapWordContentNode,
      CustomGapNode,
      // {
      //   replace: TextNode,
      //   with: (node) => {
      //     const config = {
      //       text: node.__text,
      //       offsetListMap: [],
      //       ...node,
      //     };
      //     return new CustomWordNode(config);
      //   },
      // },
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
