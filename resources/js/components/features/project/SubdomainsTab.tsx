// components/project-settings/tabs/SubdomainsTab.tsx
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useConfirm } from '@/hooks/useConfirm'
import { router } from '@inertiajs/react'
import React, { useState } from 'react'
import toast from 'react-hot-toast'

interface Subdomain {
   id: number
   url: string
   images_count?: number
}

interface SubdomainsTabProps {
   subdomains: Subdomain[]
   onAdd: (url: string) => void
   onDelete: (id: number) => void
   isAdding?: boolean,
   project_parent?: number
}

export function SubdomainsTab({ subdomains, project_parent }: SubdomainsTabProps) {
   const [newUrl, setNewUrl] = React.useState('')
   const [newSubdomain, setNewSubdomain] = useState('');
   const [isAdding, setIsAdding] = useState(false);
   const { confirm, ConfirmDialog } = useConfirm();



   const deleteSubdomain = async (subdomainId: number) => {
      const agreed = await confirm({
         title: 'Удалить поддомен?',
         message: 'Все данные по этому поддомену будут удалены безвозвратно.',
         confirmText: 'Удалить',
         cancelText: 'Отмена',
      });

      if (!agreed) return;

      router.delete(`/projects/subdomain/${subdomainId}`, {
         onSuccess: () => {
            toast.success('Поддомен удалён');
            router.reload({ only: ['projects'] });
         },
      });
   };


   const addSubdomain = async (e: React.FormEvent) => {
      e.preventDefault();

      setIsAdding(true);


      router.post('/projects', {
         parent_id: project_parent.id,
         url: newSubdomain.trim(),
         name: newSubdomain.trim(),
      }, {
         onSuccess: () => {
            toast.success('Поддомен добавлен');
            setNewSubdomain('');
            router.reload({ only: ['projects'] });
         },
         onError: (errors) => {
            console.log('Ошибки валидации:', errors);
         },
      });
   };


   return (
      <div className="space-y-6 pt-6 border-t">
         <div>
            <Label>Поддомены</Label>
            <div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
               {subdomains.length > 0 ? (
                  subdomains.map((sub) => (
                     <div
                        key={sub.id}
                        className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 border hover:border-gray-300 transition group"
                     >
                        <div>
                           <div className="text-sm font-medium">{sub.url}</div>
                           <div className="text-xs text-muted-foreground">
                              {sub.images_count || 0} изображений
                           </div>
                        </div>
                        <button
                           onClick={() => onDelete(sub.id)}
                           className="text-red-600 opacity-0 group-hover:opacity-100 transition text-xs font-medium"
                        >
                           Удалить
                        </button>
                     </div>
                  ))
               ) : (
                  <p className="text-center py-8 text-sm text-muted-foreground bg-gray-50 rounded-lg">
                     Поддомены не добавлены
                  </p>
               )}
            </div>
         </div>

         <form onSubmit={addSubdomain} className="flex gap-3">
            <Input
               placeholder="https://blog.example.com"
               value={newUrl}
               onChange={(e) => setNewUrl(e.target.value)}
            />
            <Button type="submit" disabled={isAdding || !newUrl.trim()}>
               {isAdding ? 'Добавляем...' : '+ Добавить'}
            </Button>
         </form>
      </div>
   )
}