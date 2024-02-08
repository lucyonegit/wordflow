import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  COMMAND_PRIORITY_EDITOR,
  DRAGSTART_COMMAND,
  KEY_BACKSPACE_COMMAND,
} from "lexical";

import { useEvent } from "./hooks/useEvent";
import { handleDelete } from "./utils/eventHandle";
const EventPlugin = () => {
  const [editor] = useLexicalComposerContext();
  useEvent(editor);

  const handleBackspace = (e:KeyboardEvent) => {
    e.preventDefault();
    handleDelete(editor);
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
