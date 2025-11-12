import React from 'react'
import Sorting from '../../sorting/sorting'
import Header from './../../../ui/header';
import { router, usePage } from '@inertiajs/react';
import Status from '@/components/ui/status/Status';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function SingleDefault() {
   const { image, images, currentPage, errors: serverErrors } = usePage<Props>().props;
   const projectId = localStorage.getItem("selectedProjectId")


   const onImage = (status: string) => {
      router.post(`/primary-sorting/${image.id}/sort`, {
         status,
         project_id: projectId,
         page: currentPage, // ← передаём текущую страницу
         return_to: window.location.pathname + window.location.search, // ← КУДА вернуться
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

   const buttons = () => {
      switch (image.status) {
         case 'raw':
            return (<div className="mt-6 ">
               <div className="flex justify-between gap-1.5 mb-1.5">

                  <Button variant="secondary" size={'full'} className='text-[18px] font-semibold' onClick={() => onImage('design')}>
                     Элемент дизайна
                  </Button>
                  <Button variant="secondary" size={'full'} className='text-[18px] font-semibold' onClick={() => onImage('author')}>
                     Авторское
                  </Button>
                  <Button variant="secondary" size={'full'} className='text-[18px] font-semibold' onClick={() => onImage('clent')}>
                     Уточнить у клиента
                  </Button>
                  <Button variant="primary" size={'full'} className='ml-6 text-[18px] font-semibold' onClick={() => onImage('process')}>
                     На поиск
                  </Button>
               </div>
            </div>);
         case 'process':
            return (<div className="mt-6 ">
               <div className="flex justify-between gap-1.5 mb-1.5">
                  <Button variant="secondary" size={'full'} className='text-[18px] font-semibold' onClick={() => onImage('author')}>
                     Авторское
                  </Button>
                  <Button variant="primary" size={'full'} className='ml-6 text-[18px] font-semibold' onClick={() => onImage('queue')}>
                     На генерацию
                  </Button>
               </div>
            </div>);
         default:
            return "";
      }

   }
   return (
      <>
         <Header title="Изображение">
            <div>
               <div className="relative bg-gray-100  rounded-xl inline-flex">
                  {/* ← ПИЛЮЛЯ: ширина одной кнопки, смещение на ширину первой */}
                  <div
                     className="absolute top-1 left-1 w-[212px] h-9  rounded-lg transition-all duration-300 ease-out z-0"
                  />
               </div>
            </div>
         </Header>

         <div >
            <Sorting img={image} currentPage={currentPage} projectId={projectId} buttons={buttons()} />
         </div></>
   )
}
