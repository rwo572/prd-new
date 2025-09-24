export interface EditorAction {
  action: string
  value?: any
}

export function applyMarkdownAction(
  editor: any,
  action: string,
  value?: any
) {
  if (!editor) return

  const selection = editor.getSelection()
  const model = editor.getModel()
  
  if (!selection || !model) return

  const selectedText = model.getValueInRange(selection)
  const position = selection.getStartPosition()
  
  let newText = ''
  let cursorOffset = 0
  
  switch (action) {
    case 'bold':
      if (selectedText) {
        newText = `**${selectedText}**`
        cursorOffset = selectedText.length + 4
      } else {
        newText = '**bold text**'
        cursorOffset = 2
        editor.setSelection({
          startLineNumber: position.lineNumber,
          startColumn: position.column + 2,
          endLineNumber: position.lineNumber,
          endColumn: position.column + 11
        })
      }
      break
      
    case 'italic':
      if (selectedText) {
        newText = `*${selectedText}*`
        cursorOffset = selectedText.length + 2
      } else {
        newText = '*italic text*'
        cursorOffset = 1
        editor.setSelection({
          startLineNumber: position.lineNumber,
          startColumn: position.column + 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column + 12
        })
      }
      break
      
    case 'code':
      if (selectedText) {
        newText = `\`${selectedText}\``
        cursorOffset = selectedText.length + 2
      } else {
        newText = '`code`'
        cursorOffset = 1
        editor.setSelection({
          startLineNumber: position.lineNumber,
          startColumn: position.column + 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column + 5
        })
      }
      break
      
    case 'heading':
      const level = value || 1
      const hashes = '#'.repeat(level)
      const lineStart = { lineNumber: position.lineNumber, column: 1 }
      const lineEnd = { lineNumber: position.lineNumber, column: model.getLineMaxColumn(position.lineNumber) }
      const lineText = model.getValueInRange({ 
        startLineNumber: position.lineNumber, 
        startColumn: 1, 
        endLineNumber: position.lineNumber, 
        endColumn: lineEnd.column 
      })
      
      // Remove existing heading markers
      const cleanedText = lineText.replace(/^#{1,6}\s*/, '')
      newText = `${hashes} ${cleanedText}`
      
      editor.executeEdits('', [{
        range: {
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: lineEnd.column
        },
        text: newText
      }])
      
      editor.setPosition({
        lineNumber: position.lineNumber,
        column: newText.length + 1
      })
      return
      
    case 'bulletList':
      if (selectedText) {
        const lines = selectedText.split('\n')
        newText = lines.map((line: string) => `- ${line}`).join('\n')
      } else {
        newText = '- List item'
        editor.setSelection({
          startLineNumber: position.lineNumber,
          startColumn: position.column + 2,
          endLineNumber: position.lineNumber,
          endColumn: position.column + 11
        })
      }
      break
      
    case 'numberedList':
      if (selectedText) {
        const lines = selectedText.split('\n')
        newText = lines.map((line: string, index: number) => `${index + 1}. ${line}`).join('\n')
      } else {
        newText = '1. List item'
        editor.setSelection({
          startLineNumber: position.lineNumber,
          startColumn: position.column + 3,
          endLineNumber: position.lineNumber,
          endColumn: position.column + 12
        })
      }
      break
      
    case 'taskList':
      if (selectedText) {
        const lines = selectedText.split('\n')
        newText = lines.map((line: string) => `☐ ${line}`).join('\n')
      } else {
        newText = '☐ Task item'
        editor.setSelection({
          startLineNumber: position.lineNumber,
          startColumn: position.column + 6,
          endLineNumber: position.lineNumber,
          endColumn: position.column + 15
        })
      }
      break
      
    case 'quote':
      if (selectedText) {
        const lines = selectedText.split('\n')
        newText = lines.map((line: string) => `> ${line}`).join('\n')
      } else {
        newText = '> Quote text'
        editor.setSelection({
          startLineNumber: position.lineNumber,
          startColumn: position.column + 2,
          endLineNumber: position.lineNumber,
          endColumn: position.column + 12
        })
      }
      break
      
    case 'link':
      if (selectedText) {
        newText = `[${selectedText}](url)`
        setTimeout(() => {
          editor.setSelection({
            startLineNumber: position.lineNumber,
            startColumn: position.column + selectedText.length + 3,
            endLineNumber: position.lineNumber,
            endColumn: position.column + selectedText.length + 6
          })
        }, 0)
      } else {
        newText = '[link text](url)'
        setTimeout(() => {
          editor.setSelection({
            startLineNumber: position.lineNumber,
            startColumn: position.column + 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column + 10
          })
        }, 0)
      }
      break
      
    case 'image':
      if (selectedText) {
        newText = `![${selectedText}](image-url)`
      } else {
        newText = '![alt text](image-url)'
        setTimeout(() => {
          editor.setSelection({
            startLineNumber: position.lineNumber,
            startColumn: position.column + 2,
            endLineNumber: position.lineNumber,
            endColumn: position.column + 10
          })
        }, 0)
      }
      break
      
    case 'table':
      newText = `| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |`
      break
      
    case 'horizontalRule':
      // Insert on new line
      const currentLineText = model.getLineContent(position.lineNumber)
      if (currentLineText.trim()) {
        newText = '\n\n---\n\n'
      } else {
        newText = '---\n\n'
      }
      break
      
    case 'undo':
      editor.trigger('keyboard', 'undo', null)
      return
      
    case 'redo':
      editor.trigger('keyboard', 'redo', null)
      return
      
    default:
      return
  }
  
  // Apply the edit (heading, undo, and redo cases return early)
  editor.executeEdits('', [{
    range: selection,
    text: newText
  }])

  // Set cursor position if not selecting text
  if (!selectedText && cursorOffset > 0) {
    // Cursor position is handled in switch cases with setTimeout for some actions
  }
  
  editor.focus()
}