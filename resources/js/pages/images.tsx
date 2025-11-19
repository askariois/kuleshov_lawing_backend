// resources/js/Pages/Projects/Index.tsx

import AppLayout from '@/layouts/app-layout';
import Header from '../components/ui/header';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useEffect, useRef, useState } from 'react';
import Modal from '@/components/widget/modal/modal';
import { Input } from '@/components/ui/input';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { PageProps } from '@inertiajs/core';
import CopyLink from '@/components/ui/copy-link/CopyLink';
import Status from './../components/ui/status/Status';
import { Pagination } from '@/components/ui/pagination/pagination';
import TextLink from '@/components/text-link';
import { Checkbox } from '@/components/ui/checkbox';


// === Проект ===
interface IImage {
   id: number;
   name: string;
   path: string;
   width: string;
   height: string;
   mime_type: string | null;
   size: string | null;
   status: string;
   project_id: number;
   locations: { id: number; url: string }[];
}

// === Пагинатор (Laravel) ===
interface Paginator<T> {
   data: T[];
   current_page: number;
   last_page: number;
   per_page: number;
   total: number;
   links: {
      url: string | null;
      label: string;
      active: boolean;
   }[];
}

// === Props страницы ===
interface Props extends PageProps {
   images: Paginator<IImage>;  // ← Правильно
   flash?: { success?: string };
   errors?: Record<string, string>;
}




export default function Images() {
   const rawId = localStorage.getItem("selectedProjectId");
   const id = rawId ? rawId.replace(/^"|"$/g, '') : null;
   const { images, raw_count, process, mimeTypes, filters, errors: serverErrors } = usePage<Props>().props;
   const [selectedMimes, setSelectedMimes] = useState<string[]>([]);
   // Полный список mime-значений
   const allMimeValues = mimeTypes.map(m => m.value);

   // Применение фильтра
   const applyFilter = (mimes: string[]) => {
      router.get(
         `/images/${id}/`,
         {
            mime_type: mimes.length === allMimeValues.length ? null : mimes,
         },
         {
            preserveState: true,
            replace: true,
            only: ['images', 'filters', 'raw_count'],
         }
      );
   };


   // Активные mime из URL
   useEffect(() => {
      if (allMimeValues.length > 0 && selectedMimes.length === 0) {
         setSelectedMimes(allMimeValues);
         // Сразу применяем фильтр по всем
         applyFilter(allMimeValues);
      }
   }, [allMimeValues]);

   // Обработчик чекбокса
   const handleMimeFilter = (mime: string, checked: boolean) => {
      const newMimes = checked
         ? [...selectedMimes, mime]
         : selectedMimes.filter(m => m !== mime);

      setSelectedMimes(newMimes);
      applyFilter(newMimes);
   };

   const handleSearch = (search: string) => {
      router.get(
         `/images/${id}/`,
         {
            search: search || null,
            mime_type: selectedMimes.length === allMimeValues.length ? null : selectedMimes,
         },
         { preserveState: true, replace: true, only: ['images', 'filters'] }
      );
   };



   return (
      <AppLayout>
         <Header title="Изображения" subtitle={`Всего: ${images.total}`}>
            <div className='gap-1 flex'>
               <TextLink onClick={(e) => {
                  e.preventDefault();
                  router.get(`/primary-sorting/${id}`, {
                     search: '', // сюда current search из состояния, если есть
                     mime_type: selectedMimes.length === allMimeValues.length ? null : selectedMimes,
                  });
               }} variant={raw_count > 0 ? "primary" : "secondary"} size={'lg'} disabled={raw_count > 0 ? false : true}>Первичная сортировка ({raw_count})</TextLink>
               <TextLink href={`/secondary-sorting/${id}`} variant={process > 0 ? "primary" : "secondary"} size={'lg'} disabled={process > 0 ? false : true}>Вторичная обработка ({process})</TextLink>
            </div>
         </Header>

         {/* Поиск */}
         <div className="mb-6">
            <Label htmlFor="search">Поиск</Label>
            <input
               type="search"
               placeholder="Поиск..."
               className="w-full rounded-md border border-gray-300 bg-[#F1F1F1] px-4 py-2 focus:border-blue-500 focus:outline-none"
               onChange={(e) => handleSearch(e.target.value)}
            />

            <div className='flex gap-1 mt-2'>
               {mimeTypes.map((mimeType) => {
                  const isChecked = selectedMimes.includes(mimeType.value);

                  return (
                     <div
                        key={mimeType.value}
                        className='bg-[#F1F1F1] p-2 rounded-[8px] flex items-center cursor-pointer'
                     >
                        <Checkbox
                           className='bg-[#B1B1B1] cursor-pointer'
                           id={`${mimeType.value}-checkbox`}
                           checked={isChecked}
                           onCheckedChange={(checked) => handleMimeFilter(mimeType.value, !!checked)}
                        />
                        <Label
                           htmlFor={`${mimeType.value}-checkbox`}
                           className="text-[12px] text-[#111111] ml-[2px] cursor-pointer"
                        >
                           {mimeType.label}
                        </Label>
                     </div>
                  );
               })}
            </div>
         </div>

         {/* Таблица */}
         <div className="w-full mt-6 overflow-x-auto">
            <div
               className="grid gap-4 text-sm font-medium text-gray-700 mb-2 border-b border-solid border-[#B1B1B1]/30 py-2"
               style={{
                  gridTemplateColumns:
                     "minmax(52px, 52px) minmax(356px, 2fr) minmax(80px, 1fr) minmax(80px, 1fr) minmax(356px, 1fr) minmax(140px, 1fr)",
               }}
            >
               <div className="font-semibold">IMG</div>
               <div className="font-semibold">Наименование</div>
               <div className="font-semibold">Формат</div>
               <div className="font-semibold">Размер</div>
               <div className="font-semibold">Расположение</div>
               <div className="font-semibold text-right">Статус</div>
            </div>

            {images.data.length !== 0 && images.data.map((image) => {

               return (<Link
                  href={`/single/${image.id}`}
                  key={image.id}
                  className="grid gap-4 items-center text-sm text-gray-900 border-b border-solid border-[#B1B1B1]/30 py-2 hover:bg-[#F1F1F1] transition"
                  style={{
                     gridTemplateColumns:
                        "minmax(52px, 52px) minmax(356px, 2fr) minmax(80px, 1fr) minmax(80px, 1fr) minmax(356px, 1fr) minmax(140px, 1fr)",
                  }}

               >
                  <div>
                     <img
                        src={image.path}
                        alt={image.name}
                        className="w-14 h-14 object-cover rounded-md border border-solid border-[#B1B1B1]/30"
                     />
                  </div>
                  <div className="space-y-1">
                     <div className='text-[13px] text-[#111111] font-medium'>{image.name}</div>
                     <div className="text-[10px] font-medium text-[#7C7C7C] flex items-center">
                        <div> /wp-content/{image.name}</div> <CopyLink />
                     </div>
                  </div>
                  <div className="text-[#7C7C7C] font-medium text-[13px]">{image.mime_type}</div>
                  <div className="text-[#7C7C7C] font-medium text-[13px]">{image.width ? `${image.width} x ${image.height}` : "Не указано"}</div>
                  <div className="text-[#7C7C7C] font-medium text-[13px]">{image.locations[0].url}     {image.locations.length > 1 && <div>+ещё {image.locations.length - 1}</div>}</div>


                  <div className={`font-medium text-[13px] `}>
                     <Status status={image.status} />
                  </div>

               </Link>
               )
            })}

            <Pagination data={images} />
         </div>

      </AppLayout >
   );
}