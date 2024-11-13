import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  COMMAND_PRIORITY_EDITOR,
  KEY_BACKSPACE_COMMAND,
} from "lexical";

import { handleKeyUp } from "./utils/eventHandle";
const EventPlugin = () => {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    const rootDom = editor.getRootElement();
    const handle = () =>
      handleKeyUp(editor, (node: any) => {
        console.log(node);
      });
    rootDom && rootDom.addEventListener('mouseup', handle);
    return () => {
      rootDom && rootDom.removeEventListener('mouseup', handle);
    };
  }, [editor]);

  const handleBackspace = () => {
    return true;
  };
  editor.registerCommand(
    KEY_BACKSPACE_COMMAND,
    handleBackspace,
    COMMAND_PRIORITY_EDITOR
  );
  return '';
};

export default EventPlugin;
