import { useEffect, useRef } from "react";
import { monaco, configureMonaco } from "@/lib/monaco";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  theme?: string;
  height?: string | number;
  readOnly?: boolean;
}

export default function CodeEditor({
  value,
  onChange,
  language,
  theme = "e1-theme",
  height = "100%",
  readOnly = false,
}: CodeEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Configure Monaco on first use
      configureMonaco();

      // Create the editor
      editorRef.current = monaco.editor.create(containerRef.current, {
        value,
        language,
        theme,
        readOnly,
        fontSize: 14,
        fontFamily: "'Roboto Mono', 'JetBrains Mono', monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        wordWrap: "on",
        lineNumbers: "on",
        renderLineHighlight: "line",
        selectOnLineNumbers: true,
        matchBrackets: "always",
        autoIndent: "advanced",
        formatOnPaste: true,
        formatOnType: true,
        tabSize: 4,
        insertSpaces: true,
      });

      // Set up change listener
      const disposable = editorRef.current.onDidChangeModelContent(() => {
        if (editorRef.current) {
          onChange(editorRef.current.getValue());
        }
      });

      return () => {
        disposable.dispose();
        if (editorRef.current) {
          editorRef.current.dispose();
        }
      };
    }
  }, []);

  useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== value) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  useEffect(() => {
    if (editorRef.current) {
      monaco.editor.setModelLanguage(editorRef.current.getModel()!, language);
    }
  }, [language]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ readOnly });
    }
  }, [readOnly]);

  return (
    <div 
      ref={containerRef} 
      style={{ height: typeof height === "number" ? `${height}px` : height }}
      className="border border-border rounded-md overflow-hidden"
    />
  );
}
