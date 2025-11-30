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
import toast from 'react-hot-toast';
import { log } from 'console';
import {
   Sidebar,
   SidebarContent,
   SidebarFooter,
   SidebarHeader,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
   Select,
   SelectContent,
   SelectGroup,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import { statusData } from '@/untils/status-data';
import { useConfirm } from '@/hooks/useConfirm';
import { cn } from '@/lib/utils';


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
   const [selectedStatus, setSelectedStatus] = useState<string | null>(filters.status || '');
   const { confirm, ConfirmDialog } = useConfirm();


   // Полный список mime-значений
   const allMimeValues = mimeTypes.map(m => m.value);

   // Применение фильтра
   // Универсальная функция применения фильтров
   const applyFilters = (newStatus?: string, newMimes?: string[], search?: string) => {
      const status = newStatus !== undefined ? newStatus : selectedStatus;
      const mimes = newMimes !== undefined ? newMimes : selectedMimes;
      const searchValue = search !== undefined ? search : filters.search;

      router.get(
         `/images/${id}/`,
         {
            status: status || null,
            mime_type: mimes.length === allMimeValues.length || mimes.length === 0 ? null : mimes,
            search: searchValue || null,
         },
         {
            preserveState: true,
            replace: true,
            only: ['images', 'filters', 'raw_count', 'process'],
         }
      );
   };


   // Активные mime из URL
   useEffect(() => {
      if (allMimeValues.length > 0 && selectedMimes.length === 0) {
         setSelectedMimes(allMimeValues);
      }
      // Устанавливаем начальный статус из URL или "all"
      if (!selectedStatus && filters.status) {
         setSelectedStatus(filters.status);
      }
   }, [allMimeValues, filters.status]);

   // Обработчик чекбокса
   const handleMimeFilter = (mime: string, checked: boolean) => {
      const newMimes = checked
         ? [...selectedMimes, mime]
         : selectedMimes.filter(m => m !== mime);

      setSelectedMimes(newMimes);
      applyFilters(undefined, newMimes);
   };


   const onImage = async (status: string, image) => {
      const agreed = await confirm({
         title: 'Вы уверены, что хотите сменить статус?',
         message: 'Это действие нельзя отменить.',
         confirmText: 'Сменить статус',
         cancelText: 'Отмена'
      });
      if (agreed) {
         router.post(`/primary-sorting/${image.id}/sort`, {
            status,
            project_id: id,
            return_to: `/images/${image.project_id}/`,
         }, {
            preserveState: true,
            preserveScroll: true,
            replace: true, // ← URL не добавляется в историю
            onSuccess: () => {
               toast.success('Успешно отредактировали статус');
               // Бэкенд сам вернёт X-Inertia-Location → URL обновится
            },
            onError: () => {
               toast.error('Ошибка');
            },
         });
      }

   };

   const handleSearch = (search: string) => {
      applyFilters(undefined, undefined, search);
   };

   const [contextMenu, setContextMenu] = useState<ContextMenuPosition>({
      x: 0,
      y: 0,
      image: null,
   });

   const menuRef = useRef<HTMLDivElement>(null);

   // Закрытие меню при клике вне его
   useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
         if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
            setContextMenu({ x: 0, y: 0, image: null });
         }
      };

      if (contextMenu.image) {
         document.addEventListener('click', handleClickOutside);
         document.addEventListener('contextmenu', handleClickOutside);
      }

      return () => {
         document.removeEventListener('click', handleClickOutside);
         document.removeEventListener('contextmenu', handleClickOutside);
      };
   }, [contextMenu.image]);

   // Обработчик правого клика по строке
   const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>, image: IImage) => {
      e.preventDefault(); // Отключаем стандартное меню
      e.stopPropagation();

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;

      setContextMenu({
         x,
         y,
         image,
      });
   };

   // Действия в меню
   const copyImageUrl = (path: string) => {
      navigator.clipboard.writeText(path);
      setContextMenu({ x: 0, y: 0, image: null });
      // Можно добавить toast уведомление
   };

   const openInNewTab = (id: number) => {
      window.open(`/single/${id}`, '_blank');
      setContextMenu({ x: 0, y: 0, image: null });
   };
   const handleStatusChange = (value: string) => {
      const newStatus = value === 'all' ? null : value;
      setSelectedStatus(newStatus);
      applyFilters(newStatus);
   };



   return (
      <AppLayout>
         <Header title="Все изображения" subtitle={`Всего: ${images.total}`}>
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
            <div className='flex items-center gap-3'>
               <div className='w-[75%]'>
                  <Label htmlFor="search">Поиск</Label>
                  <input
                     type="search"
                     placeholder="Поиск..."
                     className="w-full rounded-md border border-gray-300 bg-[#F1F1F1] px-4 py-2 focus:border-blue-500 focus:outline-none"
                     onChange={(e) => handleSearch(e.target.value)}
                  />
               </div>
               <div className='w-1/4'>
                  <SidebarMenu>
                     <Label htmlFor="project-select" >
                        Статус
                     </Label>
                     <Select value={selectedStatus || 'all'} onValueChange={handleStatusChange}>
                        <SelectTrigger
                           id="project-select"
                           className="w-full bg-[#F1F1F1] text-[#111111] cursor-pointer"
                        >
                           <SelectValue placeholder="Выберите проект" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#F1F1F1]">
                           <SelectGroup>
                              {statusData.map((item) => (
                                 <SelectItem key={item.id} value={String(item.name)}>
                                    {item.label}
                                 </SelectItem>
                              ))}
                           </SelectGroup>
                        </SelectContent>
                     </Select>
                  </SidebarMenu>
               </div>
            </div>
            <div className="w-1/4">
               <Label>Сортировка</Label>
               <Select
                  value={filters.sort_by + ':' + filters.sort_order}
                  onValueChange={(value) => {
                     const [sort_by, sort_order] = value.split(':');
                     router.get(`/images/${id}/`, {
                        ...filters,
                        sort_by,
                        sort_order,
                     }, {
                        preserveState: true,
                        replace: true,
                        only: ['images', 'filters', 'raw_count', 'process'],
                     });
                  }}
               >
                  <SelectTrigger className="bg-[#F1F1F1]">
                     <SelectValue placeholder="Сортировка" />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectGroup>
                        <SelectItem value="name:asc">Имя (A → Z)</SelectItem>
                        <SelectItem value="name:desc">Имя (Z → A)</SelectItem>
                     </SelectGroup>
                  </SelectContent>
               </Select>
            </div>



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

               {images.data.map((image) => (
                  <div
                     key={image.id}
                     onContextMenu={(e) => handleContextMenu(e, image)}
                     className={cn(
                        "grid gap-4 items-center text-sm text-gray-900 border-b border-solid border-[#B1B1B1]/30 py-2 transition cursor-pointer relative",
                        // Подсветка при hover
                        "hover:bg-[#F1F1F1]",
                        // Подсветка, если это текущая строка с открытым меню
                        contextMenu.image?.id === image.id && "bg-[#F1F1F1]"
                     )}
                     style={{
                        gridTemplateColumns:
                           "minmax(52px, 52px) minmax(356px, 2fr) minmax(80px, 1fr) minmax(80px, 1fr) minmax(356px, 1fr) minmax(140px, 1fr)",
                     }}
                  >
                     {/* Обычный левый клик — переход */}
                     <Link
                        href={`/single/${image.id}`}
                        className="contents" // Чтобы Link занимал всю строку, но не ломал grid
                        onClick={(e) => e.button === 2 && e.preventDefault()} // Блокируем переход при правом клике
                     >
                        <div>
                           <img src={image.path} alt={image.name} className="w-14 h-14 object-cover rounded-md border" />
                        </div>
                        <div className="space-y-1">
                           <div className='text-[13px] font-medium'>{image.name}</div>
                           <div className="text-[10px] text-[#7C7C7C] flex items-center">
                              /wp-content/{image.name} <CopyLink />
                           </div>
                        </div>
                        <div className="text-[#7C7C7C] text-[13px]">{image.mime_type}</div>
                        <div className="text-[#7C7C7C] text-[13px]">
                           {image.width ? `${image.width} x ${image.height}` : "—"}
                        </div>
                        <div className="text-[#7C7C7C] text-[13px]">
                           {image.locations[0]?.url}
                           {image.locations.length > 1 && <span className="block text-xs">+ещё {image.locations.length - 1}</span>}
                        </div>
                        <div className="text-right">
                           <Status status={image.status} />
                        </div>
                     </Link>
                  </div>
                  // ← Оберни Link в div с onContextMenu
               ))}

               <Pagination data={images} />
            </div>

            {/* === Кастомное контекстное меню === */}
            {contextMenu.image && (
               <div
                  ref={menuRef}
                  className="fixed z-[9999] bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px] text-sm"
                  style={{
                     top: contextMenu.y,
                     left: contextMenu.x,
                  }}
               >
                  <button
                     onClick={() => copyImageUrl(contextMenu.image!.path)}
                     className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 w-full text-left"
                  >
                     В ближайшее время появится фунции
                  </button>
                  <hr className="my-2 border-gray-200" />

                  <button
                     onClick={() => onImage('raw', contextMenu.image)}
                     className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 w-full text-left text-blue-600"
                  >
                     Сменить статус
                  </button>

                  {/* Можно добавить удаление, смену статуса и т.д. */}
               </div>
            )}

            {/* Наложение при открытом меню (опционально, для UX) */}
            {contextMenu.image && (
               <div
                  className="fixed inset-0 z-[9998]"
                  onContextMenu={(e) => e.preventDefault()}
               />
            )}

         </div>
         <ConfirmDialog />
      </AppLayout >
   );
}