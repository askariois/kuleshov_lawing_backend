import Status from '@/components/ui/status/Status'
import React from 'react'
import { Button } from '@/components/ui/button';
import CopyLink from '@/components/ui/copy-link/CopyLink';
import AppLayout from '@/layouts/app-layout';
import Header from '@/components/ui/header';
import { router, usePage } from '@inertiajs/react';
import toast from 'react-hot-toast';
import TextLink from '@/components/text-link';
import Sorting from '@/components/features/sorting/sorting';

export default function PrimarySorting() {
   const { images, currentPage, errors: serverErrors } = usePage<Props>().props;
   const projectId = localStorage.getItem("selectedProjectId")

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

   const buttons = () => {
      return (<div className="mt-6 ">
         <div className="flex justify-between gap-1.5 mb-1.5">

            <Button variant="secondary" size={'full'} className='text-[18px] font-semibold' onClick={() => onImage('author')}>
               Авторское
            </Button>
            <Button variant="primary" size={'full'} className='ml-6 text-[18px] font-semibold' onClick={() => onImage('ToR')}>
               На обработку
            </Button>
         </div>
      </div>)
   }


   return (
      <AppLayout>
         <Header title="Вторичная обработка" subtitle={`Всего: ${images.to ? images.to : 0} / ${images.total}`}>
         </Header>
         <Sorting images={images} currentPage={currentPage} projectId={projectId} buttons={buttons()} />
      </AppLayout >
   )
}
