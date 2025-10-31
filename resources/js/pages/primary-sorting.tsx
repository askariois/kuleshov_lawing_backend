import Status from '@/components/ui/status/Status'
import React from 'react'
import { Button } from '@/components/ui/button';
import CopyLink from '@/components/ui/copy-link/CopyLink';
import AppLayout from '@/layouts/app-layout';
import Header from '@/components/ui/header';
import { router, usePage } from '@inertiajs/react';
import toast from 'react-hot-toast';
import TextLink from '@/components/text-link';

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



   return (
      <AppLayout>
         <Header title="Первичная сортировка" subtitle={`Всего: ${images.to ? images.to : 0} / ${images.total}`}>
         </Header>

         {images.data.length > 0 ? (<>         {images.data.map((img) => {
            const [name, ext] = img.name.split(/\.(?=[^\.]+$)/); // делим по последней точке

            return (<div className="flex  flex-row gap-6">
               <div className="basis-1/2 w-[520px] h-[520px] flex justify-center items-center bg-[#00000050] backdrop-blur-sm z-40 rounded-2xl overflow-hidden">
                  <div className='bg-white'>
                     <img src={img.path} alt="" className='w-full h-auto' />
                  </div>
               </div>
               <div className="flex flex-col basis-1/2">
                  <div>
                     <div className="mt-2 leading-[1.3]">
                        <div className="text-[24px] font-bold flex items-baseline">
                           {name}
                           <span className="text-[16px] font-semibold text-[#7C7C7C]">
                              .{ext}
                           </span>
                        </div>{" "}
                        <span className="font-medium text-[13px] text-[#7C7C7C] flex items-baseline">
                           {img.path} <CopyLink />
                        </span>
                     </div>
                     <div className="mt-4">
                        {img.locations.map(item => {
                           return <div className="flex items-baseline text-[15px] text-[#7C7C7C] font-medium">
                              {item.url} <CopyLink />
                           </div>
                        })}

                     </div>
                  </div>
               </div>

            </div>)
         })}

            <div className='w-1/2 ml-auto'>
               {images.links && (
                  <div className="mt-6 flex justify-between gap-4">
                     {/* Кнопка "Предыдущий" */}
                     {images.links.find(link => link.label.includes('Previous'))?.url ? (
                        <div className='flex items-center text-[#7C7C7C] text-[13px] font-medium cursor-pointer'
                           onClick={() => {
                              const prevUrl = images.links.find(link => link.label.includes('Previous'))?.url;
                              if (prevUrl) router.visit(prevUrl, { preserveState: true });
                           }}
                        >
                           <svg width="5" height="9" viewBox="0 0 5 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M0.0965174 4.2994L3.96427 8.05006C4.20561 8.28409 4.66699 8.14223 4.66699 7.83399L4.66699 0.332675C4.66699 0.024436 4.20561 -0.117431 3.96427 0.116609L0.0965174 3.86727C-0.0317575 3.99157 -0.0316989 4.17509 0.0965174 4.2994Z" fill="#B1B1B1" />
                           </svg>
                           <div className='ml-2'> Назад</div>
                        </div>
                     ) : (
                        <div className='flex items-center text-[#7C7C7C] text-[13px] font-medium '>
                           <svg width="5" height="9" viewBox="0 0 5 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M0.0965174 4.2994L3.96427 8.05006C4.20561 8.28409 4.66699 8.14223 4.66699 7.83399L4.66699 0.332675C4.66699 0.024436 4.20561 -0.117431 3.96427 0.116609L0.0965174 3.86727C-0.0317575 3.99157 -0.0316989 4.17509 0.0965174 4.2994Z" fill="#B1B1B1" />
                           </svg>
                           <div className='ml-2'> Назад</div>
                        </div>
                     )}


                     {/* Кнопка "Следующий" */}
                     {images.links.find(link => link.label.includes('Next'))?.url ? (
                        <div className='flex items-center text-[#7C7C7C] text-[13px] font-medium cursor-pointer'
                           onClick={() => {
                              const nextUrl = images.links.find(link => link.label.includes('Next'))?.url;
                              if (nextUrl) router.visit(nextUrl, { preserveState: true });
                           }}
                        >
                           <div className='mr-2'> Вперед</div>

                           <svg width="5" height="9" viewBox="0 0 5 9" className='rotate-180' fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M0.0965174 4.2994L3.96427 8.05006C4.20561 8.28409 4.66699 8.14223 4.66699 7.83399L4.66699 0.332675C4.66699 0.024436 4.20561 -0.117431 3.96427 0.116609L0.0965174 3.86727C-0.0317575 3.99157 -0.0316989 4.17509 0.0965174 4.2994Z" fill="#B1B1B1" />
                           </svg>

                        </div>
                     ) : (
                        <div className='flex items-center text-[#7C7C7C] text-[13px] font-medium '>
                           <svg width="5" height="9" className='rotate-180' viewBox="0 0 5 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M0.0965174 4.2994L3.96427 8.05006C4.20561 8.28409 4.66699 8.14223 4.66699 7.83399L4.66699 0.332675C4.66699 0.024436 4.20561 -0.117431 3.96427 0.116609L0.0965174 3.86727C-0.0317575 3.99157 -0.0316989 4.17509 0.0965174 4.2994Z" fill="#B1B1B1" />
                           </svg>
                           <div className='mr-2'> Вперед</div>
                        </div>
                     )}
                  </div>
               )}
            </div>


            <div className="mt-6 ">
               <div className="flex justify-between gap-1.5 mb-1.5">
                  <Button variant="secondary" size={'full'} className='text-[18px] font-semibold' type="button" onClick={() => {
                     const nextUrl = images.links.find(link => link.label.includes('Next'))?.url;
                     if (nextUrl) router.visit(nextUrl, { preserveState: true });
                  }}>
                     Пропустить
                  </Button>
                  <Button variant="secondary" size={'full'} className='text-[18px] font-semibold' onClick={() => onImage('design')}>
                     Элемент дизайна
                  </Button>
                  <Button variant="secondary" size={'full'} className='text-[18px] font-semibold' onClick={() => onImage('author')}>
                     Авторское
                  </Button>
                  <Button variant="secondary" size={'full'} className='text-[18px] font-semibold' onClick={() => onImage('clent')}>
                     Уточнить у клиента
                  </Button>
                  {/* <Button variant="primary" size={'full'} className='ml-6 text-[18px] font-semibold'>
                  На поиск
               </Button> */}
               </div>
            </div>

            <div className='w-full mt-9 flex'>
               <TextLink href={`/images/${projectId}`} variant="primary" size={'lg'} className='ml-auto'>
                  Завершить обработку
               </TextLink>
            </div></>) : <div>
            <div className='text-xl font-semibold  mb-2'>Все изображения отсортированы </div>
            <TextLink href={`/images/${projectId}`} variant="primary" size={'lg'} className='ml-auto'>
               Вернуться к списку
            </TextLink></div>}

      </AppLayout >
   )
}
