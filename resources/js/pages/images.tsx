// resources/js/Pages/Projects/Index.tsx

import AppLayout from '@/layouts/app-layout';
import Header from '../components/ui/header';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useEffect, useRef, useState } from 'react';
import Modal from '@/components/widget/modal/modal';
import { Input } from '@/components/ui/input';
import { router, useForm, usePage } from '@inertiajs/react';
import { PageProps } from '@inertiajs/core';
import CopyLink from '@/components/ui/copy-link/CopyLink';

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
   const { images, errors: serverErrors } = usePage<Props>().props;

   const { data, setData, post, processing, errors } = useForm({
      name: '',
      url: 'https://', // Предзаполняем https://
   });

   console.log(images);
   return (
      <AppLayout>
         <Header title="Изображения" subtitle={`Всего: ${images.total}`}>

         </Header>



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

               return (<div
                  key={image.id}
                  className="grid gap-4 items-center text-sm text-gray-900 border-b border-solid border-[#B1B1B1]/30 py-2"
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
                  <div className="text-[#7C7C7C] font-medium text-[13px]">{image.locations.map(loc => (
                     <li key={loc.id}>
                        <a href={loc.url} target="_blank">{loc.url}</a>
                     </li>
                  ))}</div>
                  <div className={`font-medium text-[13px] `}></div>
                  <div className="flex justify-center">
                  </div>
               </div>
               )
            })}
         </div>

      </AppLayout >
   );
}