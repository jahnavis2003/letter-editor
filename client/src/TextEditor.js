import React from "react";
import { Editor } from "primereact/editor";

export default function BasicDemo({ value, onTextChange }) {
  const renderHeader = () => {
    return (
        <span className="ql-formats">
            <button className="ql-bold" aria-label="Bold"></button>
            <button className="ql-italic" aria-label="Italic"></button>
            <button className="ql-underline" aria-label="Underline"></button>
        </span>
    );
  };

  const header = renderHeader();

    return (
        <div className="card">
            <Editor value={value} onTextChange={onTextChange} headerTemplate={header} style={{ height: '500px' }} />
        </div>
    )
}
        