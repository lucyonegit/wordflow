import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  COMMAND_PRIORITY_EDITOR,
  DRAGSTART_COMMAND,
  KEY_BACKSPACE_COMMAND,
} from "lexical";

import { useEvent } from "./hooks/useEvent";
import {useGapEvent} from './hooks/useGapClick'
import { handleDelete } from "./utils/eventHandle";
const EventPlugin = () => {
  const [editor] = useLexicalComposerContext();
  useEvent(editor);
  useGapEvent(editor);

  const handleBackspace = (e:KeyboardEvent) => {
    handleDelete(editor,e);
    return true;
  };
  editor.registerCommand(
    KEY_BACKSPACE_COMMAND,
    handleBackspace,
    COMMAND_PRIORITY_EDITOR
  );
  editor.registerCommand(
    DRAGSTART_COMMAND,
    (e) => {
      e.preventDefault();
      return true;
    },
    COMMAND_PRIORITY_EDITOR
  );
  return '';
};

export default EventPlugin;
