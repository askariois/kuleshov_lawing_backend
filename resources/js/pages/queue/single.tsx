
import AppLayout from '@/layouts/app-layout';
import Header from '@/components/ui/header';
import { router, usePage } from '@inertiajs/react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import Sorting from '@/components/features/sorting/sorting';
import { useState } from 'react';
import { cn } from "@/lib/utils"
import PhotoGenerate from '@/components/features/photo-generate/photo-generate';


export default function QueueSingle() {
   const { image, currentPage, errors: serverErrors } = usePage<Props>().props;
   const projectId = localStorage.getItem("selectedProjectId")

   const [activeTab, setActiveTab] = useState<'generate' | 'info'>('generate');

   const onImage = (status: string) => {
      router.post(`/primary-sorting/${images.data[0].id}/sort`, {
         status,
         project_id: projectId,
         page: currentPage, // ← передаём текущую страницу
      }, {
         preserveState: true,
         preserveScroll: true,
         replace: true, // ← URL не добавляется в историю
         onSuccess: () => {
            toast.success('Сортировка прошла успешно');
            // Бэкенд сам вернёт X-Inertia-Location → URL обновится
         },
         onError: () => {
            toast.error('Ошибка');
         },
      });


   };


   return (
      <AppLayout>
         <Header title="Результаты генерации">
            <div>
               <div className="relative bg-gray-100  rounded-xl inline-flex">
                  {/* ← ПИЛЮЛЯ: ширина одной кнопки, смещение на ширину первой */}
                  <div
                     className="absolute top-1 left-1 w-[212px] h-9  rounded-lg transition-all duration-300 ease-out z-0"
                     style={{
                        transform: activeTab === 'generate' ? 'translateX(145px)' : 'translateX(0)'
                     }}
                  />

                  {/* КНОПКА 1: Параметры */}
                  <Button
                     variant="secondary"
                     size={'lg'}
                     onClick={() => setActiveTab('generate')}
                     className={cn(
                        "relative z-10 px-8 py-3 rounded-lg font-medium transition-colors",
                        activeTab === 'generate' ? "text-[#3E95FB] !bg-[#F1F1F1]" : "text-gray-700 bg-[#F8F8F8]"
                     )}
                  >
                     Параметры генерации
                  </Button>

                  {/* КНОПКА 2: Инфо */}
                  <Button
                     variant="secondary"
                     size={'lg'}
                     onClick={() => setActiveTab('info')}
                     className={cn(
                        "relative z-10 px-8 py-3 rounded-lg font-medium transition-colors",
                        activeTab === 'info' ? "text-[#3E95FB]" : "text-gray-700 bg-[#F8F8F8]"
                     )}
                  >
                     Инфо об изображении
                  </Button>
               </div>
            </div>
         </Header>

         <div >
            {activeTab === 'generate' && (
               <PhotoGenerate img={image} />
            )}

            {activeTab === 'info' && (
               <Sorting img={image} currentPage={currentPage} projectId={projectId} />
            )}
         </div>
      </AppLayout >
   )
}
