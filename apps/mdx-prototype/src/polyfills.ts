// Browser polyfills for Node.js globals
import { Buffer } from 'buffer'
import process from 'process'

// Make Buffer and process available globally
window.Buffer = window.Buffer || Buffer
window.process = window.process || process

// Set NODE_ENV if not already set
if (!window.process.env) {
  window.process.env = {}
}
if (!window.process.env.NODE_ENV) {
  window.process.env.NODE_ENV = 'development'
}

// Define global if not already defined
if (typeof globalThis === 'undefined') {
  window.globalThis = window
}
