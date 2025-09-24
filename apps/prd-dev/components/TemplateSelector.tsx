'use client'

import { Briefcase, Smartphone, Brain, ShoppingCart, Users } from 'lucide-react'
import { templates } from '@/lib/templates'

interface TemplateSelectorProps {
  onSelectTemplate: (template: string) => void
}

const templateIcons = {
  b2b: Briefcase,
  b2c: ShoppingCart,
  ai: Brain,
  mobile: Smartphone,
  platform: Users,
}

export default function TemplateSelector({ onSelectTemplate }: TemplateSelectorProps) {
  return (
    <div className="space-y-3">
      {templates.map((template) => {
        const Icon = templateIcons[template.category]
        return (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template.content)}
            className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-primary-100">
                <Icon size={16} className="text-gray-600 group-hover:text-primary-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">{template.name}</h4>
                <p className="text-xs text-gray-500 mt-1">{template.description}</p>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}