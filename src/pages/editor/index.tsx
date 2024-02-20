import { useEffect, useRef, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { Button, Slider } from "antd";
import { SerializedEditorState,SerializedLexicalNode,TextNode } from 'lexical'

import data from "../../mock/data/data";
import { useStore } from "../../store/global";

import { CustomSceneNode } from "./nodes/SceneNode";
import { CustomWordContentNode } from './nodes/WordContentNode'
import { CustomWordNode } from "./nodes/WordNode";
import EventPlugin from "./plugins/EventHandlePlugin";
import HighLightPlugin from './plugins/HighLightPlugin'
import SearchPlugin from './plugins/SearchPlugin'

import './style.less'

const InitPlugin:React.FC = ()=> {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    const editorState = editor.parseEditorState(data as SerializedEditorState<SerializedLexicalNode>);
    editor.setEditorState(editorState, { tag: "load" });
  }, [editor]);
  return ''
}
const SplitPlugin:React.FC = ()=> {
  const [editor] = useLexicalComposerContext();
  
  return (
    <Button
      onClick={() => {
        const nodes = [...editor.getEditorState()._nodeMap.values()].filter(
          (n) => n.__type === 'scene-asr-word',
        );
        editor.update(() => {
          nodes[1].replace(new TextNode('hello'))
        })
        
        console.log(nodes[1])
      }}
    >
      拆分node
    </Button>
  )
}
const ScriptProvider:React.FC = ()=> {
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
          style={{ width: "500px", height: "800px", overflow: "auto" }}
          ref={warper}
        >
          {warperLoaded ? (
            <div>
              <RichTextPlugin
                placeholder={<span>"请输入内容"</span>}
                contentEditable={<ContentEditable />}
                ErrorBoundary={LexicalErrorBoundary}
              />
              <InitPlugin/>
              <EventPlugin />
              <HighLightPlugin/>
            </div>
          ) : (
            ""
          )}
        </div>
        <div style={{ width: "200px" }}>
          {warperLoaded?<SearchPlugin></SearchPlugin>:''}
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
}

export default ScriptProvider;
