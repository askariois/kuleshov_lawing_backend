// components/project-settings/tabs/GeneralTab.tsx
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { router, useForm, usePage } from '@inertiajs/react'
import React from 'react'
import toast from 'react-hot-toast'

interface GeneralTabProps {
   description?: string
   onSave: (prompt: string) => void
   isSaving?: boolean
}

export function GeneralTab({ description = '', isSaving = false, project_parent, setToogle }: GeneralTabProps) {

   const rawId = localStorage.getItem("selectedProjectId");
   const projectId = rawId ? JSON.parse(rawId) : null;
   const { data, setData, put, processing, wasSuccessful, errors } = useForm({
      ai_description: project_parent.ai_description,
   })

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      put(`/projects/${project_parent.id}`, {
         data,
         onSuccess: () => {
            setToogle(false);
            toast.success('Успешно обновлено');
         },
         onError: (errors) => {
            console.log('Ошибки:', errors);
            toast.error('Не удалось сохранить');
         },
      });
   }


   return (
      <div className="space-y-6 pt-6 border-t">
         <form onSubmit={handleSubmit} className="space-y-4">
            <div>
               <Label htmlFor="prompt">Системный промпт (инструкции для ИИ)</Label>
               <textarea
                  id="prompt"
                  name="ai_description"
                  rows={8}
                  value={data.ai_description}
                  onChange={(e) => setData('ai_description', e.target.value)} // ← ИСПРАВЛЕНО!
                  className="mt-2 w-full rounded-lg border-gray-300 bg-gray-50 p-4 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Я — аниме-художник 90-х. Делай огромные глаза, пастельные тона..."
               />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={processing}>
               {processing ? 'Сохраняем...' : 'Сохранить промпт'}
            </Button>
         </form>
      </div>
   )
}