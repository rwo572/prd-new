import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface PRDDB extends DBSchema {
  prds: {
    key: string
    value: {
      id: string
      projectName: string
      content: string
      createdAt: Date
      updatedAt: Date
      version: number
    }
  }
  messages: {
    key: string
    value: {
      id: string
      projectId: string
      messages: any[]
      timestamp: Date
    }
  }
}

let db: IDBPDatabase<PRDDB> | null = null

async function getDB() {
  if (!db) {
    db = await openDB<PRDDB>('prd-dev', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('prds')) {
          db.createObjectStore('prds', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('messages')) {
          db.createObjectStore('messages', { keyPath: 'id' })
        }
      },
    })
  }
  return db
}

export async function savePRDLocally(projectName: string, content: string) {
  const database = await getDB()
  const id = projectName.toLowerCase().replace(/\s+/g, '-')
  
  const existing = await database.get('prds', id)
  
  if (existing) {
    await database.put('prds', {
      ...existing,
      content,
      updatedAt: new Date(),
      version: existing.version + 1
    })
  } else {
    await database.put('prds', {
      id,
      projectName,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    })
  }
}

export async function loadPRD(projectName: string) {
  const database = await getDB()
  const id = projectName.toLowerCase().replace(/\s+/g, '-')
  return await database.get('prds', id)
}

export async function listPRDs() {
  const database = await getDB()
  return await database.getAll('prds')
}

export function exportPRD(projectName: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}-prd.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function generatePromptForTool(content: string, tool: 'v0' | 'cursor' | 'claude'): string {
  const basePrompt = `Create a working prototype based on the following PRD:\n\n${content}\n\n`
  
  const toolSpecific = {
    v0: 'Build a modern, responsive React application with Tailwind CSS. Focus on creating a beautiful UI with smooth interactions.',
    cursor: 'Implement the full application with proper file structure, TypeScript types, and comprehensive error handling.',
    claude: 'Generate a complete, production-ready application following best practices for code organization, testing, and documentation.'
  }
  
  return basePrompt + toolSpecific[tool]
}