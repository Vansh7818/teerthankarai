// "use client";

// import React from "react";
// import MDEditor from "@uiw/react-md-editor";

// const CoverLetterPreview = ({ content }) => {
//   return (
//     <div className="py-4">
//       <MDEditor value={content} preview="preview" height={700} />
//     </div>
//   );
// };

// export default CoverLetterPreview;

// "use client";

// import React, { useState } from "react";

// import MDEditor from "@uiw/react-md-editor";

// import { Button } from "@/components/ui/button";

// import { Edit, Eye } from "lucide-react";

// const CoverLetterPreview = ({ content }) => {
//   const [mode, setMode] = useState("preview");

//   return (
//     <div className="py-4 space-y-4">
//       {/* TOGGLE BUTTON */}
//       <div className="flex justify-end">
//         <Button
//           variant="outline"
//           onClick={() =>
//             setMode(mode === "preview" ? "edit" : "preview")
//           }
//         >
//           {mode === "preview" ? (
//             <>
//               <Edit className="h-4 w-4 mr-2" />
//               Edit
//             </>
//           ) : (
//             <>
//               <Eye className="h-4 w-4 mr-2" />
//               Preview
//             </>
//           )}
//         </Button>
//       </div>

//       {/* SCROLLABLE EDITOR */}
//       <div className="max-h-[80vh] overflow-y-auto rounded-lg border">
//         <MDEditor
//           value={content}
//           preview={mode}
//           height={1000}
//         />
//       </div>
//     </div>
//   );
// };

// export default CoverLetterPreview;



"use client";

import React, { useState } from "react";

import MDEditor from "@uiw/react-md-editor";

import { Button } from "@/components/ui/button";

import { Edit, Eye } from "lucide-react";

const CoverLetterPreview = ({ content, setContent }) => {
  const [mode, setMode] = useState("preview");

  return (
    <div className="py-4 space-y-4">
      {/* TOGGLE BUTTON */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() =>
            setMode(mode === "preview" ? "edit" : "preview")
          }
        >
          {mode === "preview" ? (
            <>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </>
          )}
        </Button>
      </div>

      {/* EDITOR */}
      <div
        className="max-h-[80vh] overflow-y-auto rounded-lg border"
        data-color-mode="light"
      >
        <MDEditor
          value={content}
          onChange={setContent}
          preview={mode}
          height={1000}
          style={{
            backgroundColor: "#ffffff",
            color: "#000000",
          }}
        />
      </div>
    </div>
  );
};

export default CoverLetterPreview;