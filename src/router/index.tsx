import { createBrowserRouter } from "react-router-dom";

import Editor from '../pages/editor/index'

const router = createBrowserRouter([
  {
    path: "/",
    element: <Editor/>,
  },
  {
    path: "/editor",
    element: <Editor/>,
  },
]);

export default router;
