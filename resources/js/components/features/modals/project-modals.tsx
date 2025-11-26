import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Modal from '@/components/widget/modal/modal'
import { useConfirm } from '@/hooks/useConfirm'
import { router } from '@inertiajs/react'
import React, { useState } from 'react'
import toast from 'react-hot-toast'

export default function ProjectModals({ toogle, setToogle, project_parent }) {
   const [editingSubdomain, setEditingSubdomain] = useState<Project | null>(null);
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
      if (!project_parent || !newSubdomain.trim()) return;

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
      <Modal show={toogle} onHide={() => setToogle(false)} title="Настройки проекта" subtitle={project_parent.url}>
         <div className="space-y-6">

            {/* Основной домен */}
            <div>
               <Label>Основной домен</Label>
               <div className="mt-1 px-4 py-3 bg-gray-100 rounded-lg font-medium text-gray-700">
                  {project_parent.url}
               </div>
            </div>

            {/* Список поддоменов */}
            <div>
               <Label className="flex items-center justify-between">
                  <span>Поддомены</span>
                  <span className="text-sm text-gray-500">
                     {project_parent?.subdomains?.length || 0} шт.
                  </span>
               </Label>

               <div className="mt-3 space-y-2">
                  {project_parent?.subdomains && project_parent.subdomains.length > 0 ? (
                     project_parent.subdomains.map((sub) => (
                        <div
                           key={sub.id}
                           className="group flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 hover:border-gray-300 transition"
                        >
                           {editingSubdomain?.id === sub.id ? (
                              <form onSubmit={updateSubdomain} className="flex-1 flex items-center gap-3">
                                 <Input
                                    value={editingSubdomain.url}
                                    onChange={(e) => setEditingSubdomain({ ...editingSubdomain, url: e.target.value })}
                                    className="flex-1 text-sm"
                                    autoFocus
                                 />
                                 <Button size="sm" type="submit">Сохранить</Button>
                                 <Button size="sm" variant="secondary" onClick={() => setEditingSubdomain(null)}>
                                    Отмена
                                 </Button>
                              </form>
                           ) : (
                              <>
                                 <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-800">{sub.url}</div>
                                    <div className="text-xs text-gray-500">
                                       {sub.images_count} изображений
                                    </div>
                                 </div>

                                 <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                                    <button
                                       onClick={() => setEditingSubdomain(sub)}
                                       className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                    >
                                       Редактировать
                                    </button>
                                    <button
                                       onClick={() => deleteSubdomain(sub.id)}
                                       className="text-red-600 hover:text-red-800 text-xs font-medium"
                                    >
                                       Удалить
                                    </button>
                                 </div>
                              </>
                           )}
                        </div>
                     ))
                  ) : (
                     <p className="text-sm text-gray-500 py-4 text-center bg-gray-50 rounded-lg">
                        Поддомены не добавлены
                     </p>
                  )}
               </div>
            </div>

            {/* Форма добавления поддомена */}
            <form onSubmit={addSubdomain} className="flex gap-3">
               <Input
                  placeholder="https://blog.example.com"
                  value={newSubdomain}
                  onChange={(e) => setNewSubdomain(e.target.value)}
                  className="flex-1"
               />
               <Button type="submit" disabled={isAdding || !newSubdomain.trim()}>
                  {isAdding ? 'Добавляем...' : '+ Добавить'}
               </Button>
            </form>

         </div>
      </Modal>
   )
}
