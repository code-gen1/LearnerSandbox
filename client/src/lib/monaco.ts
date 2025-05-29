import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

// Configure Monaco Editor
export function configureMonaco() {
  // Java language configuration
  monaco.languages.register({ id: 'java' });
  
  // Python language configuration  
  monaco.languages.register({ id: 'python' });

  // Set theme
  monaco.editor.defineTheme('e1-theme', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955' },
      { token: 'keyword', foreground: '569CD6' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'type', foreground: '4EC9B0' },
    ],
    colors: {
      'editor.background': '#1E1E1E',
      'editor.foreground': '#D4D4D4',
      'editorLineNumber.foreground': '#858585',
      'editor.selectionBackground': '#264F78',
      'editor.inactiveSelectionBackground': '#3A3D41',
    }
  });

  monaco.editor.setTheme('e1-theme');
}

export { monaco };
