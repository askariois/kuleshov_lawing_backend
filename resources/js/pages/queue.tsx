// resources/js/Pages/Projects/Index.tsx

import AppLayout from '@/layouts/app-layout';
import Header from '../components/ui/header';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { PageProps } from '@inertiajs/core';
import CopyLink from '@/components/ui/copy-link/CopyLink';
import Status from '../components/ui/status/Status';
import { Pagination } from '@/components/ui/pagination/pagination';
import Modal from '@/components/widget/modal/modal';
import { useState } from 'react';
import TextLink from '@/components/text-link';

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

export default function Queue() {
   const { images, project, errors: serverErrors } = usePage<Props>().props;
   const [isModalOpen, setIsModalOpen] = useState(true);

   return (
      <AppLayout>
         <Header title="Генерация изображений" subtitle={`Всего: ${images.total}`}>
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
               return (<Link
                  href={`/single/${image.id}`}
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
                  <div className="text-[#7C7C7C] font-medium text-[13px]">{image.locations[0].url} {image.locations.length > 1 && <div>+ещё {image.locations.length - 1}</div>}</div>

                  <div className={`font-medium text-[13px] `}>
                     <Status status={image.status} />
                  </div>
               </Link>
               )
            })}

            <Pagination data={images} />
         </div>
         {!project.ai_description && <Modal show={isModalOpen} onHide={() => setIsModalOpen(false)} title="Вы еще не создали промт для этого проекта">
            <form className="space-y-4">
               <div className='flex flex-col gap-3'>
                  <TextLink href={'/projects'} className="w-full bg-[#3E95FB] hover:text-white text-white text-center" size="lg">
                     Перейти на проект
                  </TextLink>
               </div>
            </form>
         </Modal>}


      </AppLayout >
   );
}