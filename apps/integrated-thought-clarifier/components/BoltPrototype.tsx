"use client";

// BoltPrototype component - cleaned version without theme switcher
import { useState, useEffect, useRef } from "react";
import { WebContainer } from "@webcontainer/api";
import dynamic from "next/dynamic";
import PrototypeChat from "./PrototypeChat";
import {
  Play,
  RefreshCw,
  Terminal,
  Code2,
  FileText,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Loader2,
  Copy,
  Download,
  Maximize2,
  Minimize2,
  AlertCircle,
  Eye,
  EyeOff,
  Layers,
  MessageSquare,
} from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="animate-spin text-purple-600" size={24} />
    </div>
  ),
});

interface BoltPrototypeProps {
  code: string;
  projectName: string;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  apiKey?: string;
  modelId?: string;
}

interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  content?: string;
  children?: FileNode[];
  expanded?: boolean;
}

// File system structure for the React app
const files = {
  "package.json": {
    file: {
      contents: `{
  "name": "vite-react-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "lucide-react": "^0.263.1",
    "@radix-ui/react-accordion": "^1.1.2",
    "@radix-ui/react-alert-dialog": "^1.0.5",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-popover": "^1.0.7",
    "@radix-ui/react-progress": "^1.0.3",
    "@radix-ui/react-radio-group": "^1.1.3",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slider": "^1.1.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-tooltip": "^1.0.7"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.24",
    "tailwindcss": "^3.3.2",
    "vite": "^4.3.9"
  }
}`,
    },
  },
  "vite.config.js": {
    file: {
      contents: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
    host: true,
    strictPort: true,
    port: 5173
  },
  optimizeDeps: {
    // Pre-bundle dependencies to speed up dev server
    include: ['react', 'react-dom', 'lucide-react']
  }
})`,
    },
  },
  "index.html": {
    file: {
      contents: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
    },
  },
  "postcss.config.js": {
    file: {
      contents: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
    },
  },
  "tailwind.config.js": {
    file: {
      contents: `/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
}`,
    },
  },
  src: {
    directory: {
      "main.jsx": {
        file: {
          contents: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
        },
      },
      "App.jsx": {
        file: {
          contents: "", // Will be filled with the code prop
        },
      },
      lib: {
        directory: {
          "utils.js": {
            file: {
              contents: `import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}`,
            },
          },
        },
      },
      components: {
        directory: {
          ui: {
            directory: {
              "button.jsx": {
                file: {
                  contents: `import * as React from "react"
import { cn } from "../../lib/utils"

const buttonVariants = {
  variant: {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
  },
  size: {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  },
}

export const Button = React.forwardRef(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          buttonVariants.variant[variant],
          buttonVariants.size[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
`,
                },
              },
              "card.jsx": {
                file: {
                  contents: `import * as React from "react"
import { cn } from "../../lib/utils"

export const Card = React.forwardRef(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

export const CardHeader = React.forwardRef(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  )
)
CardHeader.displayName = "CardHeader"

export const CardTitle = React.forwardRef(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight",
        className
      )}
      {...props}
    />
  )
)
CardTitle.displayName = "CardTitle"

export const CardDescription = React.forwardRef(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
)
CardDescription.displayName = "CardDescription"

export const CardContent = React.forwardRef(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
)
CardContent.displayName = "CardContent"

export const CardFooter = React.forwardRef(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  )
)
CardFooter.displayName = "CardFooter"
`,
                },
              },
              "input.jsx": {
                file: {
                  contents: `import * as React from "react"
import { cn } from "../../lib/utils"

export const Input = React.forwardRef(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"
`,
                },
              },
              "label.jsx": {
                file: {
                  contents: `import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cn } from "../../lib/utils"

const Label = React.forwardRef(
  ({ className, ...props }, ref) => (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  )
)
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
`,
                },
              },
              "badge.jsx": {
                file: {
                  contents: `import * as React from "react"
import { cn } from "../../lib/utils"

const badgeVariants = {
  default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
  secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
  destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
  outline: "text-foreground",
}

export function Badge({ className, variant = "default", ...props }) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  )
}
`,
                },
              },
              "alert.jsx": {
                file: {
                  contents: `import * as React from "react"
import { cn } from "../../lib/utils"

const Alert = React.forwardRef(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        "relative w-full rounded-lg border p-4",
        variant === "destructive" &&
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        className
      )}
      {...props}
    />
  )
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn("mb-1 font-medium leading-none tracking-tight", className)}
      {...props}
    />
  )
)
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("text-sm [&_p]:leading-relaxed", className)}
      {...props}
    />
  )
)
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
`,
                },
              },
              "separator.jsx": {
                file: {
                  contents: `import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"
import { cn } from "../../lib/utils"

const Separator = React.forwardRef(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
`,
                },
              },
              "avatar.jsx": {
                file: {
                  contents: `import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "../../lib/utils"

const Avatar = React.forwardRef(
  ({ className, ...props }, ref) => (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  )
)
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef(
  ({ className, ...props }, ref) => (
    <AvatarPrimitive.Image
      ref={ref}
      className={cn("aspect-square h-full w-full", className)}
      {...props}
    />
  )
)
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef(
  ({ className, ...props }, ref) => (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-muted",
        className
      )}
      {...props}
    />
  )
)
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
`,
                },
              },
            },
          },
        },
      },
      "index.css": {
        file: {
          contents: `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }
 
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
.hover\\:bg-gray-50:hover { background-color: #f9fafb; }
.hover\\:bg-blue-600:hover { background-color: #2563eb; }
.transition { transition: all 0.2s; }
.cursor-pointer { cursor: pointer; }

/* Button styles */
.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-secondary {
  background-color: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover {
  background-color: #d1d5db;
}`,
        },
      },
    },
  },
};

// Store WebContainer instance globally to prevent multiple boots
let globalWebContainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;
let isInitialized = false;
let lastCodeHash = "";
let dependenciesInstalled = false;
let devServerRunning = false;
let devServerProcess: any = null;
let lastTerminalOutput: string[] = [];
let lastFileContent: string = "";
let lastPreviewUrl: string = "";

// Simple hash function to detect code changes
const hashCode = (str: string): string => {
  if (!str) return "";
  let hash = 0;
  for (let i = 0; i < Math.min(str.length, 1000); i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};
let initCount = 0;

// Force reset to ensure Tailwind dependencies are installed
function resetWebContainer() {
  isInitialized = false;
  initCount++;
  // Force re-initialization every 5 loads to clear any stale state
  if (initCount > 5) {
    globalWebContainerInstance = null;
    bootPromise = null;
    initCount = 0;
  }
}

async function getWebContainerInstance(): Promise<WebContainer> {
  // If already booting, wait for it
  if (bootPromise) {
    try {
      return await bootPromise;
    } catch (e) {
      // If boot failed, return existing instance if available
      if (globalWebContainerInstance) {
        return globalWebContainerInstance;
      }
      throw e;
    }
  }

  // If already booted, return existing instance
  if (globalWebContainerInstance) {
    return globalWebContainerInstance;
  }

  // Start booting
  bootPromise = (async () => {
    try {
      const instance = await WebContainer.boot();
      globalWebContainerInstance = instance;
      return instance;
    } catch (error) {
      // If boot fails, clear the promise so it can be retried
      bootPromise = null;
      throw error;
    }
  })();

  return bootPromise;
}

// Only reset if explicitly needed (commented out for persistence)
// globalWebContainerInstance = null
// bootPromise = null
// isInitialized = false

export default function BoltPrototype({
  code,
  projectName,
  onRegenerate,
  isRegenerating = false,
  apiKey,
  modelId,
}: BoltPrototypeProps) {
  const [webcontainerInstance, setWebcontainerInstance] =
    useState<WebContainer | null>(null);
  const [selectedFile, setSelectedFile] = useState("src/App.jsx");
  const [fileContent, setFileContent] = useState(code);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    "Initializing WebContainer...",
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true); // Default for SSR
  const [showFileExplorer, setShowFileExplorer] = useState(true); // Default for SSR
  const [showCodeEditor, setShowCodeEditor] = useState(true); // Default for SSR
  const [showPreview, setShowPreview] = useState(true); // Default for SSR
  const [showChat, setShowChat] = useState(false); // Chat panel state
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editorWidth, setEditorWidth] = useState(50); // Default for SSR
  const [isDragging, setIsDragging] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper to update terminal output and save globally
  const updateTerminalOutput = (updater: (prev: string[]) => string[]) => {
    setTerminalOutput((prev) => {
      const newOutput = updater(prev);
      lastTerminalOutput = newOutput; // Save globally
      return newOutput;
    });
  };

  // Helper to set preview URL and save globally
  const updatePreviewUrl = (url: string) => {
    lastPreviewUrl = url;
    setPreviewUrl(url);
  };

  const [fileTree, setFileTree] = useState<FileNode[]>([
    {
      name: "src",
      path: "src",
      type: "directory",
      expanded: true,
      children: [
        { name: "App.jsx", path: "src/App.jsx", type: "file", content: code },
        {
          name: "main.jsx",
          path: "src/main.jsx",
          type: "file",
          content: files.src.directory["main.jsx"].file.contents,
        },
        {
          name: "index.css",
          path: "src/index.css",
          type: "file",
          content: files.src.directory["index.css"].file.contents,
        },
        {
          name: "lib",
          path: "src/lib",
          type: "directory",
          expanded: false, // Start collapsed
          children: [
            {
              name: "utils.js",
              path: "src/lib/utils.js",
              type: "file",
              content:
                files.src.directory["lib"].directory["utils.js"].file.contents,
            },
          ],
        },
      ],
    },
    {
      name: "package.json",
      path: "package.json",
      type: "file",
      content: files["package.json"].file.contents,
    },
    {
      name: "vite.config.js",
      path: "vite.config.js",
      type: "file",
      content: files["vite.config.js"].file.contents,
    },
    {
      name: "tailwind.config.js",
      path: "tailwind.config.js",
      type: "file",
      content: files["tailwind.config.js"].file.contents,
    },
    {
      name: "postcss.config.js",
      path: "postcss.config.js",
      type: "file",
      content: files["postcss.config.js"].file.contents,
    },
    {
      name: "index.html",
      path: "index.html",
      type: "file",
      content: files["index.html"].file.contents,
    },
  ]);

  // Load saved preferences from localStorage after mount
  useEffect(() => {
    // Load saved terminal visibility
    const savedTerminal = localStorage.getItem("prototype-show-terminal");
    if (savedTerminal !== null) {
      setShowTerminal(savedTerminal === "true");
    }

    // Load saved file explorer visibility
    const savedExplorer = localStorage.getItem("prototype-show-explorer");
    if (savedExplorer !== null) {
      setShowFileExplorer(savedExplorer === "true");
    }

    // Load saved code editor visibility
    const savedCode = localStorage.getItem("prototype-show-code");
    if (savedCode !== null) {
      setShowCodeEditor(savedCode === "true");
    }

    // Load saved preview visibility
    const savedPreview = localStorage.getItem("prototype-show-preview");
    if (savedPreview !== null) {
      setShowPreview(savedPreview === "true");
    }

    // Load saved editor width
    const savedWidth = localStorage.getItem("prototype-editor-width");
    if (savedWidth) {
      setEditorWidth(parseFloat(savedWidth));
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Check if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true"
      ) {
        return;
      }

      // Skip Monaco editor check in BoltPrototype as we don't have a Monaco editor here

      switch (e.key) {
        case "1":
          e.preventDefault();
          toggleFileExplorer();
          break;
        case "2":
          e.preventDefault();
          toggleCodeEditor();
          break;
        case "3":
          e.preventDefault();
          togglePreview();
          break;
        case "4":
          e.preventDefault();
          toggleTerminal();
          break;
        case "5":
          e.preventDefault();
          setShowChat((prev) => !prev);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [showFileExplorer, showCodeEditor, showPreview, showTerminal]);

  // Save code to localStorage whenever it changes
  useEffect(() => {
    if (code && code.length > 100) {
      localStorage.setItem("prototype-last-code", code);
      localStorage.setItem("prototype-last-updated", new Date().toISOString());
    }
  }, [code]);

  // Initialize WebContainer
  useEffect(() => {
    let mounted = true;

    const initWebContainer = async () => {
      // Check if code has changed
      const currentCodeHash = hashCode(code);
      const codeChanged =
        currentCodeHash !== lastCodeHash && lastCodeHash !== "";

      // If we already have a global instance running, just reuse it
      if (globalWebContainerInstance && isInitialized && !codeChanged) {
        console.log(
          "Reusing existing WebContainer instance",
        );
        setWebcontainerInstance(globalWebContainerInstance);
        setIsLoading(false);
        setIsRunning(true);
        
        // Restore the preview URL if dev server is running
        if (devServerRunning) {
          // Use the saved URL or fallback to default
          const baseUrl = lastPreviewUrl || "http://localhost:5173";
          
          // Add a small delay to ensure the iframe is mounted
          setTimeout(() => {
            // Add timestamp to force iframe to reconnect
            const url = new URL(baseUrl);
            url.searchParams.set("reconnect", Date.now().toString());
            updatePreviewUrl(url.toString());
            console.log("Reconnecting to dev server at:", url.toString());
          }, 200);
        }
        
        // Restore terminal output if available
        if (lastTerminalOutput.length > 0) {
          setTerminalOutput(lastTerminalOutput);
        }
        
        // Restore file content if available
        if (lastFileContent) {
          setFileContent(lastFileContent);
        }
        
        return;
      }

      // If we already have a running instance with the same code, don't reinitialize
      if (
        isInitialized &&
        webcontainerInstance &&
        isRunning &&
        previewUrl &&
        !codeChanged
      ) {
        console.log(
          "WebContainer already initialized with same code, skipping initialization",
        );
        setIsLoading(false);
        return;
      }

      // Update the hash
      lastCodeHash = currentCodeHash;

      try {
        updateTerminalOutput((prev) => [
          ...prev,
          "Getting WebContainer instance...",
        ]);

        // Get or boot the WebContainer singleton with performance tracking
        const startTime = performance.now();
        const instance = await getWebContainerInstance();
        const bootTime = performance.now() - startTime;
        if (bootTime > 100) {
          console.log(`WebContainer boot time: ${bootTime.toFixed(0)}ms`);
        }

        if (!mounted) {
          return;
        }

        setWebcontainerInstance(instance);
        updateTerminalOutput((prev) => [...prev, "✓ WebContainer ready"]);

        // Check if already initialized and running
        if (!isInitialized) {
          // Start with the absolute simplest component possible
          const testComponent = `function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>WebContainer is Loading...</h1>
      <p style={{ color: '#666' }}>If you can see this, the basic setup is working.</p>
      <p style={{ color: '#666', marginTop: '10px' }}>Your prototype will load shortly...</p>
    </div>
  )
}

export default App`;

          // Update the files with test code first
          const filesWithCode = { ...files };
          // Use provided code if available, otherwise use test component
          const initialCode =
            code && code.trim().length > 100 ? code : testComponent;
          filesWithCode.src.directory["App.jsx"].file.contents = initialCode;

          // Only mount files if not already mounted
          if (!dependenciesInstalled) {
            // Mount files
            updateTerminalOutput((prev) => [...prev, "Mounting file system..."]);
            await instance.mount(filesWithCode);
            updateTerminalOutput((prev) => [...prev, "✓ File system mounted"]);

            // Check if node_modules exists (from previous session)
            let skipInstall = false;
            try {
              const nodeModules = await instance.fs.readdir("node_modules");
              if (nodeModules.length > 0) {
                skipInstall = true;
                dependenciesInstalled = true;
                updateTerminalOutput((prev) => [
                  ...prev,
                  "✓ Dependencies already installed (from cache)",
                ]);
              }
            } catch (e) {
              // node_modules doesn't exist, need to install
            }

            if (!skipInstall) {
              // Install dependencies with optimized flags
              updateTerminalOutput((prev) => [
                ...prev,
                "",
                "> npm install",
                "Installing dependencies (first time setup, this will be cached)...",
              ]);
              const installProcess = await instance.spawn("npm", [
                "install",
                "--prefer-offline", // Use cached packages when possible
                "--no-audit", // Skip security audit
                "--no-fund", // Skip funding messages
                "--loglevel=error", // Only show errors
                "--no-save", // Don't update package-lock
              ]);

              installProcess.output.pipeTo(
                new WritableStream({
                  write(data) {
                    if (mounted) {
                      updateTerminalOutput((prev) => {
                        const newOutput = [...prev, data];
                        // Keep only last 100 lines
                        return newOutput.slice(-100);
                      });
                      // Auto-scroll terminal
                      if (terminalRef.current) {
                        terminalRef.current.scrollTop =
                          terminalRef.current.scrollHeight;
                      }
                    }
                  },
                }),
              );

              const installExitCode = await installProcess.exit;

              if (installExitCode !== 0) {
                throw new Error("Installation failed");
              }

              updateTerminalOutput((prev) => [
                ...prev,
                "✓ Dependencies installed successfully (cached for next time)",
                "",
              ]);
              dependenciesInstalled = true;
            }
          }

          // Check if dev server is already running
          if (!devServerRunning) {
            // Start dev server with performance optimizations
            updateTerminalOutput((prev) => [
              ...prev,
              "> npm run dev",
              "Starting development server...",
            ]);
            devServerProcess = await instance.spawn("npm", ["run", "dev"]);
            devServerRunning = true;

            devServerProcess.output.pipeTo(
              new WritableStream({
                write(data) {
                  if (mounted) {
                    updateTerminalOutput((prev) => {
                      const newOutput = [...prev, data];
                      return newOutput.slice(-100);
                    });
                    if (terminalRef.current) {
                      terminalRef.current.scrollTop =
                        terminalRef.current.scrollHeight;
                    }
                  }
                },
              }),
            );

            // Wait for server to be ready with shorter timeout
            let serverStarted = false;
            const serverTimeout = setTimeout(() => {
              if (!serverStarted && mounted) {
                console.warn(
                  "Server start timeout - attempting to set URL manually",
                );
                // Try to set the URL manually after timeout
                updatePreviewUrl("http://localhost:5173");
                setIsRunning(true);
                setIsLoading(false);
                updateTerminalOutput((prev) => [
                  ...prev,
                  "✓ Server running on http://localhost:5173",
                ]);
              }
            }, 5000); // 5 second timeout

            instance.on("server-ready", (port, url) => {
              serverStarted = true;
              clearTimeout(serverTimeout);
              if (mounted) {
                updatePreviewUrl(url);
                setIsRunning(true);
                setIsLoading(false);
                updateTerminalOutput((prev) => [
                  ...prev,
                  `✓ Server running at ${url}`,
                ]);
              }
            });
          } else {
            // Dev server already running, just set the preview URL
            updatePreviewUrl("http://localhost:5173");
            setIsRunning(true);
            setIsLoading(false);
            updateTerminalOutput((prev) => [
              ...prev,
              "✓ Using existing dev server",
            ]);
          }

          isInitialized = true;

          // Now update with the actual generated code if provided
          if (code && code.length > 100) {
            setTimeout(async () => {
              try {
                // Validate and fix the code
                let finalCode = code;

                // Check if code appears truncated
                const lines = finalCode.split("\n");
                const lastLine = lines[lines.length - 1].trim();

                // Check for common truncation issues
                if (
                  lastLine &&
                  !lastLine.endsWith("}") &&
                  !lastLine.endsWith(";") &&
                  !lastLine.includes("export")
                ) {
                  console.warn("Code appears truncated, attempting to fix...");

                  // Count open/close tags
                  const openDivs = (finalCode.match(/<div/g) || []).length;
                  const closeDivs = (finalCode.match(/<\/div>/g) || []).length;
                  const openParens = (finalCode.match(/\(/g) || []).length;
                  const closeParens = (finalCode.match(/\)/g) || []).length;
                  const openBraces = (finalCode.match(/\{/g) || []).length;
                  const closeBraces = (finalCode.match(/\}/g) || []).length;

                  // Try to close unclosed JSX tags
                  if (openDivs > closeDivs) {
                    const divsToClose = openDivs - closeDivs;
                    for (let i = 0; i < divsToClose; i++) {
                      finalCode += "\n</div>";
                    }
                  }

                  // Close unclosed parens
                  if (openParens > closeParens) {
                    const parensToClose = openParens - closeParens;
                    for (let i = 0; i < parensToClose; i++) {
                      finalCode += ")";
                    }
                  }

                  // Close unclosed braces
                  if (openBraces > closeBraces) {
                    const bracesToClose = openBraces - closeBraces;
                    for (let i = 0; i < bracesToClose; i++) {
                      finalCode += "\n}";
                    }
                  }
                }

                // Ensure the code starts with proper imports
                if (
                  !finalCode.includes("import") &&
                  !finalCode.includes("const cn =")
                ) {
                  // Add cn utility if missing
                  finalCode = `const cn = (...classes) => classes.filter(Boolean).join(' ')\n\n${finalCode}`;
                }

                // Ensure export exists
                if (!finalCode.includes("export default")) {
                  finalCode += "\n\nexport default App";
                }

                await instance.fs.writeFile("src/App.jsx", finalCode);
                updateTerminalOutput((prev) => [
                  ...prev,
                  "✓ App.jsx updated with generated prototype",
                ]);
                setFileContent(finalCode);
          lastFileContent = finalCode; // Save globally
              } catch (err) {
                console.error(
                  "Error updating App.jsx with generated code:",
                  err,
                );
                updateTerminalOutput((prev) => [
                  ...prev,
                  `❌ Error updating App.jsx: ${err}`,
                ]);
                // Keep the test component if update fails
              }
            }, 3000); // Wait 3 seconds for dev server to stabilize
          }
        } else {
          // Already initialized, just update the App.jsx with new code
          if (code && code.length > 100) {
            try {
              // Validate and fix the code
              let finalCode = code;

              // Remove any ReactDOM.render() or ReactDOM.createRoot() calls as they belong in main.jsx, not App.jsx
              // Remove all ReactDOM references completely
              finalCode = finalCode.replace(
                /ReactDOM\.(createRoot|render|hydrate|unmountComponentAtNode)[^;]*;/gs,
                "",
              );
              finalCode = finalCode.replace(/ReactDOM\./g, "// ReactDOM.");
              finalCode = finalCode.replace(
                /import\s+ReactDOM\s+from\s+['"]react-dom['"]\s*;?/g,
                "",
              );
              finalCode = finalCode.replace(
                /import\s+\*\s+as\s+ReactDOM\s+from\s+['"]react-dom['"]\s*;?/g,
                "",
              );
              finalCode = finalCode.replace(
                /import\s+{\s*[^}]*\s*}\s*from\s+['"]react-dom['"]\s*;?/g,
                "",
              );
              finalCode = finalCode.replace(
                /import\s+ReactDOM\s+from\s+['"]react-dom\/client['"]\s*;?/g,
                "",
              );

              // Clean up any orphaned closing parentheses or semicolons after removing ReactDOM calls
              finalCode = finalCode.replace(/^\s*\)\s*;?\s*$/gm, "");
              finalCode = finalCode.replace(/^\s*\}\s*\)\s*;?\s*$/gm, "}");

              // Check if code appears truncated
              const lines = finalCode.split("\n");
              const lastLine = lines[lines.length - 1].trim();

              // Check for common truncation issues
              if (
                lastLine &&
                !lastLine.endsWith("}") &&
                !lastLine.endsWith(";") &&
                !lastLine.includes("export")
              ) {
                console.warn("Code appears truncated, attempting to fix...");

                // Count open/close tags
                const openDivs = (finalCode.match(/<div/g) || []).length;
                const closeDivs = (finalCode.match(/<\/div>/g) || []).length;
                const openParens = (finalCode.match(/\(/g) || []).length;
                const closeParens = (finalCode.match(/\)/g) || []).length;
                const openBraces = (finalCode.match(/\{/g) || []).length;
                const closeBraces = (finalCode.match(/\}/g) || []).length;

                // Try to close unclosed JSX tags
                if (openDivs > closeDivs) {
                  const divsToClose = openDivs - closeDivs;
                  for (let i = 0; i < divsToClose; i++) {
                    finalCode += "\n</div>";
                  }
                }

                // Close unclosed parens
                if (openParens > closeParens) {
                  const parensToClose = openParens - closeParens;
                  for (let i = 0; i < parensToClose; i++) {
                    finalCode += ")";
                  }
                }

                // Close unclosed braces
                if (openBraces > closeBraces) {
                  const bracesToClose = openBraces - closeBraces;
                  for (let i = 0; i < bracesToClose; i++) {
                    finalCode += "\n}";
                  }
                }
              }

              // Auto-detect and add missing lucide-react icon imports
              const iconPattern = /<(\w+)\s+(?:size|className|onClick|style)/g;
              const jsxElements = new Set<string>();
              let match;
              while ((match = iconPattern.exec(finalCode)) !== null) {
                const elementName = match[1];
                // Check if it's a capitalized component (likely an icon)
                if (
                  elementName[0] === elementName[0].toUpperCase() &&
                  elementName !== "App" &&
                  !elementName.startsWith("Html")
                ) {
                  jsxElements.add(elementName);
                }
              }

              // Common lucide-react icons
              const lucideIcons = [
                "Gift",
                "ShoppingCart",
                "Package",
                "Star",
                "Heart",
                "Search",
                "Menu",
                "X",
                "ChevronDown",
                "ChevronUp",
                "ChevronLeft",
                "ChevronRight",
                "Plus",
                "Minus",
                "Check",
                "AlertCircle",
                "Info",
                "Loader",
                "Loader2",
                "User",
                "Users",
                "Mail",
                "Phone",
                "Calendar",
                "Clock",
                "Home",
                "Settings",
                "LogOut",
                "LogIn",
                "Edit",
                "Trash",
                "Trash2",
                "Download",
                "Upload",
                "File",
                "Folder",
                "Eye",
                "EyeOff",
                "Lock",
                "Unlock",
                "Shield",
                "Award",
                "TrendingUp",
                "TrendingDown",
                "BarChart",
                "PieChart",
                "Activity",
                "Zap",
                "Sun",
                "Moon",
              ];

              const missingIcons: string[] = [];
              jsxElements.forEach((element) => {
                if (
                  lucideIcons.includes(element) &&
                  !finalCode.includes(`import.*${element}.*from.*lucide-react`)
                ) {
                  missingIcons.push(element);
                }
              });

              // Add missing icon imports
              if (missingIcons.length > 0) {
                const existingLucideImport = finalCode.match(
                  /import\s*{\s*([^}]*)\s*}\s*from\s*['"]lucide-react['"]/,
                );
                if (existingLucideImport) {
                  // Add to existing import
                  const currentIcons = existingLucideImport[1]
                    .split(",")
                    .map((s) => s.trim());
                  const allIcons = [
                    ...new Set([...currentIcons, ...missingIcons]),
                  ].filter(Boolean);
                  finalCode = finalCode.replace(
                    /import\s*{\s*[^}]*\s*}\s*from\s*['"]lucide-react['"]/,
                    `import { ${allIcons.join(", ")} } from 'lucide-react'`,
                  );
                } else {
                  // Add new import at the beginning
                  finalCode = `import { ${missingIcons.join(", ")} } from 'lucide-react'\n${finalCode}`;
                }
              }

              // Check if code uses React hooks
              const usesHooks =
                /\b(useState|useEffect|useCallback|useMemo|useRef|useContext|useReducer)\s*\(/g.test(
                  finalCode,
                );
              const hasReactImport =
                finalCode.includes("import React") ||
                finalCode.includes("from 'react'");

              // Add React and hook imports if missing and hooks are used
              if (usesHooks && !hasReactImport) {
                const hooks = [];
                if (/\buseState\s*\(/g.test(finalCode)) hooks.push("useState");
                if (/\buseEffect\s*\(/g.test(finalCode))
                  hooks.push("useEffect");
                if (/\buseCallback\s*\(/g.test(finalCode))
                  hooks.push("useCallback");
                if (/\buseMemo\s*\(/g.test(finalCode)) hooks.push("useMemo");
                if (/\buseRef\s*\(/g.test(finalCode)) hooks.push("useRef");
                if (/\buseContext\s*\(/g.test(finalCode))
                  hooks.push("useContext");
                if (/\buseReducer\s*\(/g.test(finalCode))
                  hooks.push("useReducer");

                if (hooks.length > 0) {
                  finalCode = `import React, { ${hooks.join(", ")} } from 'react'\n\n${finalCode}`;
                } else {
                  finalCode = `import React from 'react'\n\n${finalCode}`;
                }
              }

              // Ensure the code starts with proper imports
              if (
                !finalCode.includes("import") &&
                !finalCode.includes("const cn =")
              ) {
                // Add cn utility if missing
                finalCode = `const cn = (...classes) => classes.filter(Boolean).join(' ')\n\n${finalCode}`;
              }

              // Ensure export exists and is properly formatted
              if (!finalCode.includes("export default")) {
                // Try to find the main component name
                const componentMatch = finalCode.match(
                  /(?:function|const)\s+(\w+)\s*(?:\(|=)/,
                );
                const componentName = componentMatch
                  ? componentMatch[1]
                  : "App";
                finalCode += `\n\nexport default ${componentName}`;
              } else {
                // Clean up malformed export statements
                finalCode = finalCode.replace(
                  /export\s+default\s+(\w+)\s*;\s*\)\s*;?/g,
                  "export default $1",
                );
                finalCode = finalCode.replace(
                  /export\s+default\s+(\w+)\s*\)\s*;?/g,
                  "export default $1",
                );
              }

              await instance.fs.writeFile("src/App.jsx", finalCode);
              updateTerminalOutput((prev) => [
                ...prev,
                "✓ App.jsx updated with new code",
              ]);
              setFileContent(finalCode);
          lastFileContent = finalCode; // Save globally
            } catch (err) {
              console.error("Error updating App.jsx:", err);
              updateTerminalOutput((prev) => [...prev, `❌ Error: ${err}`]);
            }
          }
          setIsLoading(false);
          setIsRunning(true);
        }
      } catch (error) {
        console.error("WebContainer initialization error:", error);
        if (mounted) {
          setError(
            "Failed to initialize development environment. Please refresh and try again.",
          );
          setIsLoading(false);
          updateTerminalOutput((prev) => [...prev, `❌ Error: ${error}`]);
        }
      }
    };

    // Start initialization
    initWebContainer();

    // Cleanup
    return () => {
      mounted = false;
      // Don't destroy the singleton, just clear local reference
      setWebcontainerInstance(null);
    };
  }, []); // Only run once on mount

  // Update App.jsx when code prop changes
  useEffect(() => {
    if (webcontainerInstance && code && code.trim().length > 0) {
      // Ensure the code is valid
      let finalCode = code;

      // Remove any ReactDOM.render() or ReactDOM.createRoot() calls as they belong in main.jsx, not App.jsx
      // Remove all ReactDOM references completely
      finalCode = finalCode.replace(
        /ReactDOM\.(createRoot|render|hydrate|unmountComponentAtNode)[^;]*;/gs,
        "",
      );
      finalCode = finalCode.replace(/ReactDOM\./g, "// ReactDOM.");
      finalCode = finalCode.replace(
        /import\s+ReactDOM\s+from\s+['"]react-dom['"]\s*;?/g,
        "",
      );
      finalCode = finalCode.replace(
        /import\s+\*\s+as\s+ReactDOM\s+from\s+['"]react-dom['"]\s*;?/g,
        "",
      );
      finalCode = finalCode.replace(
        /import\s+{\s*[^}]*\s*}\s*from\s+['"]react-dom['"]\s*;?/g,
        "",
      );
      finalCode = finalCode.replace(
        /import\s+ReactDOM\s+from\s+['"]react-dom\/client['"]\s*;?/g,
        "",
      );

      // Auto-detect and add missing lucide-react icon imports
      const iconPattern = /<(\w+)\s+(?:size|className|onClick|style)/g;
      const jsxElements = new Set<string>();
      let match;
      while ((match = iconPattern.exec(finalCode)) !== null) {
        const elementName = match[1];
        // Check if it's a capitalized component (likely an icon)
        if (
          elementName[0] === elementName[0].toUpperCase() &&
          elementName !== "App" &&
          !elementName.startsWith("Html")
        ) {
          jsxElements.add(elementName);
        }
      }

      // Common lucide-react icons
      const lucideIcons = [
        "Gift",
        "ShoppingCart",
        "Package",
        "Star",
        "Heart",
        "Search",
        "Menu",
        "X",
        "ChevronDown",
        "ChevronUp",
        "ChevronLeft",
        "ChevronRight",
        "Plus",
        "Minus",
        "Check",
        "AlertCircle",
        "Info",
        "Loader",
        "Loader2",
        "User",
        "Users",
        "Mail",
        "Phone",
        "Calendar",
        "Clock",
        "Home",
        "Settings",
        "LogOut",
        "LogIn",
        "Edit",
        "Trash",
        "Trash2",
        "Download",
        "Upload",
        "File",
        "Folder",
        "Eye",
        "EyeOff",
        "Lock",
        "Unlock",
        "Shield",
        "Award",
        "TrendingUp",
        "TrendingDown",
        "BarChart",
        "PieChart",
        "Activity",
        "Zap",
        "Sun",
        "Moon",
      ];

      const missingIcons: string[] = [];
      jsxElements.forEach((element) => {
        if (
          lucideIcons.includes(element) &&
          !finalCode.includes(`import.*${element}.*from.*lucide-react`)
        ) {
          missingIcons.push(element);
        }
      });

      // Add missing icon imports
      if (missingIcons.length > 0) {
        const existingLucideImport = finalCode.match(
          /import\s*{\s*([^}]*)\s*}\s*from\s*['"]lucide-react['"]/,
        );
        if (existingLucideImport) {
          // Add to existing import
          const currentIcons = existingLucideImport[1]
            .split(",")
            .map((s) => s.trim());
          const allIcons = [
            ...new Set([...currentIcons, ...missingIcons]),
          ].filter(Boolean);
          finalCode = finalCode.replace(
            /import\s*{\s*[^}]*\s*}\s*from\s*['"]lucide-react['"]/,
            `import { ${allIcons.join(", ")} } from 'lucide-react'`,
          );
        } else {
          // Add new import at the beginning
          finalCode = `import { ${missingIcons.join(", ")} } from 'lucide-react'\n${finalCode}`;
        }
      }

      // Check if code uses React hooks
      const usesHooks =
        /\b(useState|useEffect|useCallback|useMemo|useRef|useContext|useReducer)\s*\(/g.test(
          finalCode,
        );
      const hasReactImport =
        finalCode.includes("import React") ||
        finalCode.includes("from 'react'");

      // Add React and hook imports if missing and hooks are used
      if (!hasReactImport) {
        if (usesHooks) {
          const hooks = [];
          if (/\buseState\s*\(/g.test(finalCode)) hooks.push("useState");
          if (/\buseEffect\s*\(/g.test(finalCode)) hooks.push("useEffect");
          if (/\buseCallback\s*\(/g.test(finalCode)) hooks.push("useCallback");
          if (/\buseMemo\s*\(/g.test(finalCode)) hooks.push("useMemo");
          if (/\buseRef\s*\(/g.test(finalCode)) hooks.push("useRef");
          if (/\buseContext\s*\(/g.test(finalCode)) hooks.push("useContext");
          if (/\buseReducer\s*\(/g.test(finalCode)) hooks.push("useReducer");

          if (hooks.length > 0) {
            finalCode = `import React, { ${hooks.join(", ")} } from 'react'\n\n${finalCode}`;
          } else {
            finalCode = `import React from 'react'\n\n${finalCode}`;
          }
        } else {
          finalCode = `import React from 'react'\n\n${finalCode}`;
        }
      }

      // Ensure export exists and is properly formatted
      if (!finalCode.includes("export default")) {
        // Try to find the main component name
        const componentMatch = finalCode.match(
          /(?:function|const)\s+(\w+)\s*(?:\(|=)/,
        );
        const componentName = componentMatch ? componentMatch[1] : "App";
        finalCode += `\n\nexport default ${componentName}`;
      } else {
        // Clean up malformed export statements
        finalCode = finalCode.replace(
          /export\s+default\s+(\w+)\s*;\s*\)\s*;?/g,
          "export default $1",
        );
        finalCode = finalCode.replace(
          /export\s+default\s+(\w+)\s*\)\s*;?/g,
          "export default $1",
        );
      }

      webcontainerInstance.fs
        .writeFile("src/App.jsx", finalCode)
        .then(() => {
          setFileContent(finalCode);
          lastFileContent = finalCode; // Save globally
          if (selectedFile === "src/App.jsx") {
            updateTerminalOutput((prev) => [...prev, "✓ App.jsx updated"]);
          }
        })
        .catch((err) => {
          console.error("Error updating App.jsx:", err);
          updateTerminalOutput((prev) => [
            ...prev,
            `❌ Error updating App.jsx: ${err}`,
          ]);
        });
    }
  }, [code, webcontainerInstance]);

  const handleFileSelect = async (file: FileNode) => {
    if (file.type === "file" && webcontainerInstance) {
      setSelectedFile(file.path);
      try {
        const content = await webcontainerInstance.fs.readFile(
          file.path,
          "utf-8",
        );
        setFileContent(content);
      } catch (error) {
        console.error("Error reading file:", error);
        setFileContent(file.content || "");
      }
    }
  };

  const handleFileChange = async (value: string | undefined) => {
    if (!value || !webcontainerInstance) return;

    setFileContent(value);
    try {
      await webcontainerInstance.fs.writeFile(selectedFile, value);
    } catch (error) {
      console.error("Error writing file:", error);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([fileContent], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.toLowerCase().replace(/\s+/g, "-")}-${selectedFile.split("/").pop()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Toggle handlers with localStorage persistence
  const toggleTerminal = (show?: boolean) => {
    const newState = show !== undefined ? show : !showTerminal;
    setShowTerminal(newState);
    localStorage.setItem("prototype-show-terminal", newState.toString());
  };

  const toggleFileExplorer = (show?: boolean) => {
    const newState = show !== undefined ? show : !showFileExplorer;
    setShowFileExplorer(newState);
    localStorage.setItem("prototype-show-explorer", newState.toString());
  };

  const toggleCodeEditor = (show?: boolean) => {
    const newState = show !== undefined ? show : !showCodeEditor;
    // Don't allow hiding both code and preview
    if (!newState && !showPreview) {
      togglePreview(true);
    }
    setShowCodeEditor(newState);
    localStorage.setItem("prototype-show-code", newState.toString());
  };

  const togglePreview = (show?: boolean) => {
    const newState = show !== undefined ? show : !showPreview;
    // Don't allow hiding both code and preview
    if (!newState && !showCodeEditor) {
      toggleCodeEditor(true);
    }
    setShowPreview(newState);
    localStorage.setItem("prototype-show-preview", newState.toString());
  };

  // Handle drag to resize panels
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      // Only allow dragging when both panels are visible
      if (!showCodeEditor || !showPreview) return;

      const container = containerRef.current.getBoundingClientRect();
      let relativeX = e.clientX - container.left;

      // Adjust for file explorer width if visible
      if (showFileExplorer) {
        relativeX -= 192; // 48 * 4 = 192px (w-48 in Tailwind)
      }

      const availableWidth = container.width - (showFileExplorer ? 192 : 0);
      const newWidth = (relativeX / availableWidth) * 100;

      // Limit the width between 20% and 80%
      if (newWidth >= 20 && newWidth <= 80) {
        setEditorWidth(newWidth);
        // Save to localStorage
        localStorage.setItem("prototype-editor-width", newWidth.toString());
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      // Add cursor style to body during drag
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, showFileExplorer, showCodeEditor, showPreview]);

  const toggleDirectory = (targetPath: string) => {
    const toggleInTree = (nodes: FileNode[]): FileNode[] => {
      return nodes.map((node) => {
        if (node.path === targetPath && node.type === "directory") {
          return { ...node, expanded: !node.expanded };
        }
        if (node.children) {
          return { ...node, children: toggleInTree(node.children) };
        }
        return node;
      });
    };

    setFileTree((prevTree) => toggleInTree(prevTree));
  };

  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes.map((node) => (
      <div key={node.path}>
        <button
          onClick={() =>
            node.type === "directory"
              ? toggleDirectory(node.path)
              : handleFileSelect(node)
          }
          className={`w-full flex items-center gap-1 px-2 py-1 text-sm hover:bg-gray-100 transition-colors ${
            node.type === "file" && selectedFile === node.path
              ? "bg-purple-50 text-purple-700"
              : node.type === "directory"
                ? "text-gray-800 font-medium"
                : "text-gray-700"
          }`}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          title={
            node.type === "directory"
              ? `Click to ${node.expanded ? "collapse" : "expand"}`
              : node.path
          }
        >
          {node.type === "directory" ? (
            <>
              <span
                className="transition-transform inline-block"
                style={{
                  transform: node.expanded ? "rotate(90deg)" : "rotate(0)",
                }}
              >
                <ChevronRight size={12} />
              </span>
              {node.expanded ? (
                <FolderOpen size={14} className="text-blue-600" />
              ) : (
                <Folder size={14} className="text-blue-500" />
              )}
            </>
          ) : (
            <FileText size={14} className="ml-3.5 text-gray-500" />
          )}
          <span className="ml-1 truncate">{node.name}</span>
        </button>
        {node.type === "directory" && node.expanded && node.children && (
          <div>{renderFileTree(node.children, level + 1)}</div>
        )}
      </div>
    ));
  };

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Initialization Error
          </h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-full flex flex-col bg-white ${isFullscreen ? "fixed inset-0 z-50" : ""}`}
    >
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-sm text-gray-900">Prototype</h3>

          {/* Divider */}
          <div className="h-5 w-px bg-gray-300" />

          {/* Panel Toggle Buttons - moved to left */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => toggleFileExplorer()}
              className={`p-1.5 rounded transition-colors ${
                showFileExplorer
                  ? "bg-purple-100 text-purple-700"
                  : "bg-gray-100 text-gray-500"
              }`}
              title="Explorer (1)"
            >
              <Folder size={14} />
            </button>
            <button
              onClick={() => toggleCodeEditor()}
              className={`p-1.5 rounded transition-colors ${
                showCodeEditor
                  ? "bg-purple-100 text-purple-700"
                  : "bg-gray-100 text-gray-500"
              }`}
              title="Code (2)"
            >
              <Code2 size={14} />
            </button>
            <button
              onClick={() => togglePreview()}
              className={`p-1.5 rounded transition-colors ${
                showPreview
                  ? "bg-purple-100 text-purple-700"
                  : "bg-gray-100 text-gray-500"
              }`}
              title="Preview (3)"
            >
              {showPreview ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
            <button
              onClick={() => toggleTerminal()}
              className={`p-1.5 rounded transition-colors ${
                showTerminal
                  ? "bg-purple-100 text-purple-700"
                  : "bg-gray-100 text-gray-500"
              }`}
              title="Terminal (4)"
            >
              <Terminal size={14} />
            </button>
            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-1.5 rounded transition-colors ${
                showChat
                  ? "bg-purple-100 text-purple-700"
                  : "bg-gray-100 text-gray-500"
              }`}
              title="Chat Assistant (5)"
            >
              <MessageSquare size={14} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Action Buttons */}
          <button
            onClick={handleCopy}
            className="px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors flex items-center gap-1"
            title="Copy code"
            disabled={!showCodeEditor}
          >
            <Copy size={12} />
            <span>{copied ? "Copied!" : "Copy"}</span>
          </button>
          <button
            onClick={handleDownload}
            className="px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors flex items-center gap-1"
            title="Download file"
            disabled={!showCodeEditor}
          >
            <Download size={12} />
            <span>Download</span>
          </button>
          <button
            onClick={() => {
              // Force a re-render by changing the iframe src slightly
              if (iframeRef.current && previewUrl) {
                const url = new URL(previewUrl);
                url.searchParams.set("t", Date.now().toString());
                updatePreviewUrl(url.toString());
              }
            }}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-600"
            title="Refresh Preview"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-600"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          {/* Regenerate button - only show if handler exists */}
          {onRegenerate && (
            <>
              <div className="w-px h-5 bg-gray-300 mx-1" />
              <button
                onClick={onRegenerate}
                disabled={isRegenerating}
                className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  size={12}
                  className={isRegenerating ? "animate-spin" : ""}
                />
                <span>{isRegenerating ? "Regenerating..." : "Regenerate"}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex overflow-hidden" ref={containerRef}>
          {/* File Explorer */}
          {showFileExplorer && (
            <div className="w-48 border-r border-gray-200 bg-gray-50 overflow-y-auto flex-shrink-0">
              <div className="p-2 border-b border-gray-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600 uppercase">
                  Explorer
                </span>
                <button
                  onClick={() => toggleFileExplorer(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ChevronRight size={12} />
                </button>
              </div>
              <div className="py-1">{renderFileTree(fileTree)}</div>
            </div>
          )}

          {/* Code Editor */}
          {showCodeEditor && (
            <div
              className="flex flex-col min-w-0 relative"
              style={{
                width: showPreview ? `${editorWidth}%` : "100%",
              }}
            >
              <div className="bg-gray-100 px-3 py-1 border-b border-gray-200 flex items-center gap-2">
                {!showFileExplorer && (
                  <button
                    onClick={() => toggleFileExplorer(true)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <ChevronRight size={12} />
                  </button>
                )}
                <span className="text-xs text-gray-600">{selectedFile}</span>
              </div>
              <div className="flex-1">
                <MonacoEditor
                  height="100%"
                  language={
                    selectedFile.endsWith(".css") ? "css" : "javascript"
                  }
                  value={fileContent}
                  onChange={handleFileChange}
                  theme="vs"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: "on",
                    wordWrap: "on",
                    automaticLayout: true,
                    tabSize: 2,
                    scrollBeyondLastLine: false,
                    padding: { top: 10, bottom: 10 },
                  }}
                />
              </div>
            </div>
          )}

          {/* Draggable Divider - only show when both panels are visible */}
          {showCodeEditor && showPreview && (
            <div
              className={`w-1 bg-gray-200 hover:bg-purple-400 cursor-col-resize transition-colors relative ${
                isDragging ? "bg-purple-500" : ""
              }`}
              onMouseDown={handleMouseDown}
              style={{ touchAction: "none" }}
            >
              <div className="absolute inset-y-0 -left-1 -right-1 z-10" />
            </div>
          )}

          {/* Preview */}
          {showPreview && (
            <div
              className="flex-1 flex flex-col min-w-0"
              style={{
                width: showCodeEditor ? `${100 - editorWidth}%` : "100%",
              }}
            >
              <div className="bg-gray-100 px-3 py-1 border-b border-gray-200">
                <span className="text-xs text-gray-600">Preview</span>
              </div>
              {isLoading ? (
                <div className="h-full flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <Loader2
                      className="animate-spin mx-auto mb-3 text-purple-600"
                      size={32}
                    />
                    <p className="text-sm text-gray-600">
                      Setting up development environment...
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {dependenciesInstalled
                        ? "Starting server..."
                        : "Installing dependencies (first time only)..."}
                    </p>
                  </div>
                </div>
              ) : previewUrl ? (
                <iframe
                  ref={iframeRef}
                  key={previewUrl.split('?')[0]} // Key based on base URL to prevent unnecessary remounts
                  src={previewUrl}
                  className="w-full h-full bg-white"
                  title="Preview"
                  allow="cross-origin-isolated"
                  sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <Loader2
                      className="animate-spin mx-auto mb-3 text-purple-600"
                      size={32}
                    />
                    <p className="text-sm text-gray-600">Starting server...</p>
                    <button
                      onClick={() => {
                        // Try to force set the preview URL
                        updatePreviewUrl("http://localhost:5173");
                        setIsRunning(true);
                        setIsLoading(false);
                      }}
                      className="mt-4 px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                    >
                      Try Manual Connect
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chat Panel */}
          {showChat && (
            <div className="w-80 flex-shrink-0">
              <PrototypeChat
                apiKey={apiKey}
                modelId={modelId}
                prototypeCode={fileContent}
                projectName={projectName}
                onCodeUpdate={async (newCode) => {
                  // Update the code in the editor and WebContainer
                  setFileContent(newCode);
                  if (webcontainerInstance) {
                    try {
                      await webcontainerInstance.fs.writeFile(
                        "src/App.jsx",
                        newCode,
                      );
                      updateTerminalOutput((prev) => [
                        ...prev,
                        "✓ Code updated from chat assistant",
                      ]);

                      // Update the file tree to reflect the change
                      setFileTree((prevTree) => {
                        const updateContent = (
                          nodes: FileNode[],
                        ): FileNode[] => {
                          return nodes.map((node) => {
                            if (node.path === "src/App.jsx") {
                              return { ...node, content: newCode };
                            }
                            if (node.children) {
                              return {
                                ...node,
                                children: updateContent(node.children),
                              };
                            }
                            return node;
                          });
                        };
                        return updateContent(prevTree);
                      });
                    } catch (error) {
                      console.error("Error updating code:", error);
                      updateTerminalOutput((prev) => [
                        ...prev,
                        `❌ Error updating code: ${error}`,
                      ]);
                    }
                  }
                }}
              />
            </div>
          )}
        </div>

        {/* Terminal */}
        {showTerminal && (
          <div className="h-48 border-t border-gray-200 bg-gray-900 text-gray-100 overflow-hidden flex flex-col">
            <div className="px-3 py-1 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
              <span className="text-xs font-medium">Terminal</span>
              <button
                onClick={() => toggleTerminal(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                <ChevronDown size={12} />
              </button>
            </div>
            <div
              ref={terminalRef}
              className="flex-1 p-2 overflow-y-auto font-mono text-xs"
            >
              {terminalOutput.map((line, i) => (
                <div key={i} className="whitespace-pre-wrap">
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
