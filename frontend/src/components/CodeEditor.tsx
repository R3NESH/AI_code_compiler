import { useEffect, useRef } from 'react'
import { EditorView, hoverTooltip } from '@codemirror/view'
import { EditorState, Extension, StateEffect } from '@codemirror/state'
import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { oneDark } from '@codemirror/theme-one-dark'
import { linter, Diagnostic } from '@codemirror/lint'
import { python } from '@codemirror/lang-python'
import { cpp } from '@codemirror/lang-cpp'
import { java } from '@codemirror/lang-java'
import { javascript } from '@codemirror/lang-javascript'

type Language = 'python' | 'javascript' | 'cpp' | 'java'

type Props = {
  value: string
  language: Language
  onChange(value: string): void
}

const keywordDocs: Record<Language, Record<string, string>> = {
  python: {
    def: 'Define a function: def name(params):\nExample: def greet(name):\n    return f"Hello, {name}!"',
    for: 'Loop: for item in iterable:\nExample: for i in range(5):\n    print(i)',
    if: 'Conditional: if condition:\nExample: if x > 0:\n    print("Positive")',
    import: 'Import modules: import module\nExample: import math\nfrom datetime import datetime',
    while: 'While loop: while condition:\nExample: while x < 10:\n    x += 1',
    class: 'Class definition: class Name:\nExample: class Person:\n    def __init__(self, name):\n        self.name = name',
    try: 'Exception handling: try:\nExample: try:\n    result = 10 / 0\nexcept ZeroDivisionError:\n    print("Cannot divide by zero")',
    with: 'Context manager: with statement\nExample: with open("file.txt") as f:\n    content = f.read()',
    lambda: 'Anonymous function: lambda params: expression\nExample: square = lambda x: x * x',
    return: 'Return value from function\nExample: def add(a, b):\n    return a + b'
  },
  javascript: {
    function: 'Define a function: function name(params) { }\nExample: function greet(name) {\n    return `Hello, ${name}!`;\n}',
    let: 'Block-scoped variable declaration\nExample: let count = 0;\nif (true) {\n    let count = 1; // Different variable\n}',
    const: 'Constant variable declaration\nExample: const PI = 3.14159;\nconst user = { name: "John" };',
    import: 'ES Module import\nExample: import React from "react";\nimport { useState } from "react";',
    export: 'Export from module\nExample: export const API_URL = "https://api.example.com";\nexport default function App() {}',
    class: 'Class definition: class Name { }\nExample: class Person {\n    constructor(name) {\n        this.name = name;\n    }\n}',
    async: 'Async function declaration\nExample: async function fetchData() {\n    const response = await fetch("/api/data");\n    return response.json();\n}',
    await: 'Wait for Promise to resolve\nExample: const data = await fetchData();',
    try: 'Exception handling: try { } catch { }\nExample: try {\n    riskyOperation();\n} catch (error) {\n    console.error(error);\n}',
    for: 'For loop: for(init; condition; inc) { }\nExample: for (let i = 0; i < 5; i++) {\n    console.log(i);\n}'
  },
  cpp: {
    int: 'Integral type (32-bit): int variable_name;\nExample: int age = 25;\nint numbers[5] = {1, 2, 3, 4, 5};',
    for: 'For loop: for(init; condition; inc) { }\nExample: for (int i = 0; i < 10; i++) {\n    cout << i << endl;\n}',
    include: 'Include header files: #include <header>\nExample: #include <iostream>\n#include <vector>\n#include <string>',
    using: 'Using directive: using namespace std;\nExample: using namespace std;\n// Now you can use cout instead of std::cout',
    class: 'Class definition: class Name { };\nExample: class Car {\nprivate:\n    string brand;\npublic:\n    void setBrand(string b) { brand = b; }\n};',
    vector: 'Dynamic array: vector<type> name;\nExample: vector<int> numbers;\nnumbers.push_back(42);',
    string: 'String type: string variable_name;\nExample: string name = "Hello";\ncout << name.length();',
    if: 'Conditional: if (condition) { }\nExample: if (x > 0) {\n    cout << "Positive";\n} else {\n    cout << "Negative or zero";\n}',
    while: 'While loop: while (condition) { }\nExample: while (i < 10) {\n    cout << i;\n    i++;\n}',
    return: 'Return value from function\nExample: int add(int a, int b) {\n    return a + b;\n}'
  },
  java: {
    class: 'Class declaration: class Name { }\nExample: public class Person {\n    private String name;\n    public Person(String name) {\n        this.name = name;\n    }\n}',
    public: 'Access modifier: public\nExample: public class Main {\n    public static void main(String[] args) {\n        // Code here\n    }\n}',
    static: 'Static member belongs to the class, not instances\nExample: public static void main(String[] args) {\n    // Static method\n}',
    private: 'Private access modifier\nExample: private String name;\nprivate int age;',
    void: 'Method that returns nothing\nExample: public void printMessage() {\n    System.out.println("Hello");\n}',
    String: 'String type: String variable_name;\nExample: String name = "John";\nSystem.out.println(name.length());',
    int: 'Integer type: int variable_name;\nExample: int age = 25;\nint[] numbers = {1, 2, 3, 4, 5};',
    if: 'Conditional: if (condition) { }\nExample: if (age >= 18) {\n    System.out.println("Adult");\n} else {\n    System.out.println("Minor");\n}',
    for: 'For loop: for(init; condition; inc) { }\nExample: for (int i = 0; i < 5; i++) {\n    System.out.println(i);\n}',
    import: 'Import packages: import package.Class;\nExample: import java.util.ArrayList;\nimport java.util.Scanner;'
  }
}

function languageExtensions(lang: Language): Extension {
  switch (lang) {
    case 'python':
      return python()
    case 'cpp':
      return cpp()
    case 'java':
      return java()
    case 'javascript':
    default:
      return javascript()
  }
}

function simpleLinter(lang: Language) {
  return linter((view): Diagnostic[] => {
    const text = view.state.doc.toString()
    const diags: Diagnostic[] = []

    // Very basic checks per language
    if (lang === 'python') {
      // check indentation for def/for/if followed by next line
      const lines = text.split(/\r?\n/)
      lines.forEach((line, i) => {
        if (/^(def|for|if)\b.*:\s*$/.test(line)) {
          const next = lines[i + 1] ?? ''
          if (next && !/^\s+/.test(next)) {
            diags.push({
              from: view.state.doc.line(i + 2).from,
              to: view.state.doc.line(i + 2).from,
              severity: 'warning',
              message: 'Expected an indented block after this line',
              actions: [{ name: 'Indent next line', apply(view) { view.dispatch({ changes: { from: view.state.doc.line(i + 2).from, insert: '    ' } }) } }]
            })
          }
        }
      })
    }

    if (lang === 'cpp' || lang === 'java' || lang === 'javascript') {
      // Improved missing semicolon heuristic - more specific patterns
      const lines = text.split(/\r?\n/)
      lines.forEach((line, i) => {
        const trimmed = line.trim()
        if (trimmed.length === 0) return
        
        // Skip lines that shouldn't have semicolons
        if (/^(if|for|while|switch|class|function|else|try|catch|finally|do|return|#|import|export|const|let|var)\b/.test(trimmed)) {
          return
        }
        
        // Skip lines ending with {, }, or already having ;
        if (/[{};]\s*$/.test(trimmed)) {
          return
        }
        
        // Check for statements that typically need semicolons
        if (/^(int|string|char|bool|float|double|void|auto|const|static|public|private|protected)\s+\w+/.test(trimmed) ||
            /^\w+\s*=\s*[^=]/.test(trimmed) ||
            /^\w+\s*\(/.test(trimmed) ||
            /^\w+\s*\.\w+/.test(trimmed)) {
          diags.push({
            from: view.state.doc.line(i + 1).to - line.trimEnd().length,
            to: view.state.doc.line(i + 1).to,
            severity: 'info',
            message: 'Possible missing semicolon',
            actions: [{ name: 'Add ;', apply(view) { view.dispatch({ changes: { from: view.state.doc.line(i + 1).to, insert: ';' } }) } }]
          })
        }
      })
    }

    return diags
  })
}

// Removed unused HoverTooltipField

function tooltipExtension(lang: Language): Extension {
  const dict = keywordDocs[lang]
  return hoverTooltip((view, pos) => {
    const { from, to, text } = view.state.doc.lineAt(pos)
    let start = pos, end = pos
    
    // Find word boundaries using character-by-character matching
    while (start > from && /[A-Za-z0-9_#]/.test(text[start - from - 1])) {
      start--
    }
    while (end < to && /[A-Za-z0-9_#]/.test(text[end - from])) {
      end++
    }
    
    const token = view.state.sliceDoc(start, end)
    const info = dict[token as keyof typeof dict]
    if (!info) return null
    
    return {
      pos: start,
      end,
      create() {
        const dom = document.createElement('div')
        dom.style.padding = '12px 16px'
        dom.style.background = '#1f2937'
        dom.style.color = '#f9fafb'
        dom.style.border = '1px solid #374151'
        dom.style.borderRadius = '8px'
        dom.style.maxWidth = '400px'
        dom.style.fontSize = '14px'
        dom.style.lineHeight = '1.5'
        dom.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.3)'
        dom.style.zIndex = '1000'
        
        // Split info into lines and format
        const lines = info.split('\n')
        const title = lines[0]
        const example = lines.slice(1).join('\n')
        
        const titleEl = document.createElement('div')
        titleEl.textContent = title
        titleEl.style.fontWeight = 'bold'
        titleEl.style.color = '#60a5fa'
        titleEl.style.marginBottom = '8px'
        
        const exampleEl = document.createElement('pre')
        exampleEl.textContent = example
        exampleEl.style.background = '#111827'
        exampleEl.style.padding = '8px'
        exampleEl.style.borderRadius = '4px'
        exampleEl.style.margin = '0'
        exampleEl.style.fontSize = '12px'
        exampleEl.style.color = '#d1d5db'
        exampleEl.style.overflow = 'auto'
        exampleEl.style.maxHeight = '200px'
        
        dom.appendChild(titleEl)
        if (example) {
          dom.appendChild(exampleEl)
        }
        
        return { dom }
      }
    }
  })
}

export function CodeEditor({ value, language, onChange }: Props) {
  const ref = useRef<HTMLDivElement | null>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!ref.current) return
    const state = EditorState.create({
      doc: value,
      extensions: [
        oneDark,
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        languageExtensions(language),
        simpleLinter(language),
        tooltipExtension(language),
        EditorView.updateListener.of(v => {
          if (v.docChanged) onChange(v.state.doc.toString())
        }),
        EditorView.editable.of(true),
        EditorView.lineWrapping,
        EditorView.theme({
          '&': {
            fontSize: '15px',
            fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace"
          },
          '.cm-content': {
            padding: '16px 0',
            lineHeight: '1.7'
          },
          '.cm-line': {
            padding: '0 16px'
          },
          '.cm-gutters': {
            fontSize: '14px',
            paddingRight: '8px'
          }
        })
      ]
    })
    const view = new EditorView({ state, parent: ref.current })
    viewRef.current = view
    return () => view.destroy()
  }, [])

  useEffect(() => {
    // swap language on change
    const view = viewRef.current
    if (!view) return
    view.dispatch({
      effects: StateEffect.reconfigure.of([
        oneDark,
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        languageExtensions(language),
        simpleLinter(language),
        tooltipExtension(language),
        EditorView.editable.of(true),
        EditorView.lineWrapping,
        EditorView.updateListener.of(v => { if (v.docChanged) onChange(v.state.doc.toString()) }),
        EditorView.theme({
          '&': {
            fontSize: '15px',
            fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace"
          },
          '.cm-content': {
            padding: '16px 0',
            lineHeight: '1.7'
          },
          '.cm-line': {
            padding: '0 16px'
          },
          '.cm-gutters': {
            fontSize: '14px',
            paddingRight: '8px'
          }
        })
      ])
    })
  }, [language])

  useEffect(() => {
    const view = viewRef.current
    if (view && value !== view.state.doc.toString()) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } })
    }
  }, [value])

  return <div ref={ref} style={{ width: '100%', height: '100%' }} />
}


