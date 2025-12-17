import React from 'react'
import Header from './../../../ui/header';
import CopyLink from '@/components/ui/copy-link/CopyLink';
import { usePage } from '@inertiajs/react';
import { Props } from 'node_modules/@headlessui/react/dist/types';
import images from './../../../../routes/images/index';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function SingleTOR() {
   const { image, currentPage, errors: serverErrors } = usePage<Props>().props;
   const tasks = [
      { active: true, old: 'Нет', new: 'Да', status: 'Успешно' },
      { active: false, old: 'Нет', new: 'Да', status: 'Успешно' },
      { active: false, old: 'Да', new: 'Да', status: 'Частично' },
      { active: false, old: 'Да', new: 'Нет', status: 'Не выполнено' },
      { active: false, old: 'Да', new: 'Нет', status: 'Не выполнено' },
   ];
   return (
      <>
         <Header title="Обработка новых изображений">
         </Header>
         <div className="flex  flex-col gap-6">

            <div>
               <div className="text-[24px] font-bold flex items-end">
                  {image.name}
               </div>
               <a href={image.path} className="font-medium text-[13px] text-[#7C7C7C] flex items-baseline  hover:text-primary" target='_blank' rel="noreferrer">
                  {image.path} <CopyLink />
               </a>
            </div>

            <div className='flex justify-between border-b border-solid border-[#B1B1B1]/30 pb-4'>
               <div>
                  <div>Оригинал</div>
                  <div className="basis-1/5 w-[200px] h-[220px] flex justify-center items-center bg-[#00000050] backdrop-blur-sm z-40 rounded-2xl overflow-hidden">
                     <div className='bg-white'>
                        <img src={image.path} alt="" className='w-full h-auto' />
                     </div>
                  </div></div>

               <div>
                  <div className="basis-1/5 w-[200px] h-[220px] flex justify-center items-center bg-[#00000050] backdrop-blur-sm z-40 rounded-2xl overflow-hidden">

                     <div>Генерация</div>
                     <div className='bg-white'>
                        <img src={image.path} alt="" className='w-full h-auto' />
                     </div>
                  </div>

               </div>
            </div>

            <div className='flex items-end gap-1 p-3 bg-[#F8F8F8] rounded-[12px]'>
               <div className='w-full'>
                  <Label htmlFor="search" className=''>Загрузите изображение на сайт и укажите ссылку:</Label>
                  <input
                     type="search"
                     placeholder="Поиск..."
                     className="w-full rounded-md border border-gray-300 bg-[#F1F1F1] px-4 py-2 focus:border-blue-500 focus:outline-none"
                  // onChange={(e) => handleSearch(e.target.value)}
                  /></div>
               <Button variant="grey" size={'lg'}>Просканировать</Button>
            </div>

            <div>
               {tasks.map(({ active: isActive, old: oldImage, new: newImage, status }) => {
                  return (<div className={`flex items-center gap-4 px-6 py-4 rounded-2xl ${isActive ? 'bg-white shadow-sm' : 'bg-gray-50'}`}>
                     {/* Иконка статуса (активная/неактивная) */}
                     <div className="flex-shrink-0">
                        {isActive ? (
                           <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                 <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                           </div>
                        ) : (
                           <div className="w-8 h-8 rounded-full bg-gray-300" />
                        )}
                     </div>

                     {/* Описание задачи */}
                     <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                           Заменить изображение на странице
                        </p>
                        <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                           /articles/kak-perestat-delat-odinkovye-dizainy
                           <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                           </svg>
                        </p>
                     </div>

                     {/* Столбцы: Старое / Новое */}
                     <div className="hidden md:flex items-center gap-12 text-sm">
                        <span className={`font-medium ${oldImage === 'Да' ? 'text-gray-900' : 'text-gray-400'}`}>
                           {oldImage}
                        </span>
                        <span className={`font-medium ${newImage === 'Да' ? 'text-gray-900' : 'text-gray-400'}`}>
                           {newImage}
                        </span>
                     </div>

                     {/* Статус */}
                     <div className={`px-4 py-2 rounded-full text-sm font-medium `}>
                        {status}
                     </div>
                  </div>)
               })}
            </div>
         </div>
      </>
   )
}
