import Status from '@/components/ui/status/Status'
import CopyLink from '@/components/ui/copy-link/CopyLink';
import TextLink from '@/components/text-link';
import { router } from '@inertiajs/react';
import SiteChips from '../sitechips/sitechips';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/hooks/useConfirm';
import toast from 'react-hot-toast';


function Sorting({ img, images, projectId, buttons }) {
   const { confirm, ConfirmDialog } = useConfirm();

   const [name, ext] = img.name.split(/\.(?=[^\.]+$)/);
   const [showAllLocations, setShowAllLocations] = useState<Record<number, boolean>>({});
   // Функция переключения
   const toggleShowAll = (imageId: number) => {
      setShowAllLocations(prev => ({
         ...prev,
         [imageId]: !prev[imageId],
      }));
   };

   const onDuplicate = async (id) => {
      const agreed = await confirm({
         title: 'Вы уверены, что хотите запустить перезапустить поиск?',
         message: 'Это действие нельзя отменить.',
         confirmText: 'Запустить',
         cancelText: 'Отмена'
      });
      if (agreed) {
         router.post(`/secondary-sorting/${id}/check-duplicates`, {}, {
            preserveState: false,
            preserveScroll: false,
            replace: true,
            onSuccess: () => {
               toast.success('Перазапуск запущен!');
            },
            onError: (errors) => {
               console.log('Ошибки валидации:', errors);
            },
         });
      }
   }

   const freeLogic = async () => {
      const agreed = await confirm({
         title: 'Вы уверены, что хотите запустить Автоматический перенос на Бесплатное?',
         message: 'Это действие нельзя отменить.',
         confirmText: 'Запустить',
         cancelText: 'Отмена'
      });
      if (agreed) {
         router.get(`/secondary-free`, {}, {
            preserveState: false,
            preserveScroll: false,
            replace: true,
            onSuccess: () => {
               toast.success('Процесс запущен!');
            },
            onError: (errors) => {
               console.log('Ошибки валидации:', errors);
            },
         });
      }
   }


   return (
      <>
         {img ? (
            <>
               <div className="flex  flex-row gap-6">
                  <div className="basis-1/2 w-[520px] h-[520px] flex justify-center items-center bg-[#00000050] backdrop-blur-sm z-40 rounded-2xl overflow-hidden">
                     <div className='bg-white'>
                        <img src={img.path} alt="" className='w-full h-auto' />
                     </div>
                  </div>
                  <div className="flex flex-col basis-1/2">
                     <div>
                        <div className="mt-2 leading-[1.3] flex justify-between items-center w-full">
                           <div>
                              <div className="text-[24px] font-bold flex items-baseline">
                                 {name}
                                 <span className="text-[16px] font-semibold text-[#7C7C7C]">
                                    .{ext}
                                 </span>
                              </div>{" "}
                              <a href={img.path} className="font-medium text-[13px] text-[#7C7C7C] flex items-baseline  hover:text-primary" target='_blank' rel="noreferrer">
                                 {img.path} <CopyLink />
                              </a>
                           </div>


                           <div className='flex items-center flex-col justify-center'>
                              <Status status={img.status} />
                              {img.status == "process" &&
                                 <Button type="button" variant={img?.duplicate?.status == "pending" ? "pending" : 'primary'} className='mt-4' onClick={img?.duplicate?.status == "pending" ? router.reload({ preserveScroll: true }) : () => onDuplicate(img.id)}>
                                    {img?.duplicate?.status == "pending" ? "Ожидается" : "Перезапуск"}
                                 </Button>
                              }
                           </div>

                        </div>
                        <div className="mt-4">
                           {/* Показываем все или только первые 5 */}
                           {img.locations
                              .slice(0, showAllLocations[img.id] ? undefined : 5)
                              .map((item, index) => (
                                 <div key={index} className="flex items-center gap-2">
                                    <a
                                       href={item.url}
                                       target="_blank"
                                       rel="noopener noreferrer"
                                       className="text-[15px] text-[#7C7C7C] font-medium hover:text-primary truncate block max-w-full"
                                    >
                                       {item.url}
                                    </a>
                                    <CopyLink text={item.url} />
                                 </div>
                              ))}

                           {/* Кнопка "Показать ещё", если ссылок больше 5 */}
                           {img.locations.length > 5 && (
                              <button
                                 onClick={() => toggleShowAll(img.id)}
                                 className="text-[13px] font-medium text-primary hover:underline mt-1 cursor-pointer"
                              >
                                 {showAllLocations[img.id]
                                    ? 'Свернуть'
                                    : `+ ещё ${img.locations.length - 5}`}
                              </button>
                           )}
                           {img.duplicate && (
                              <div className='mt-7'>
                                 <div className='text-[18px] font-bold'>
                                    Найденные совпадения <span className='text-[32px] text-primary'>{img.duplicate.images_count}</span>
                                 </div>
                                 <div className='text-[18px] font-bold'>
                                    Платные <span className='text-[32px] text-[#E45454]'>{img.duplicate.stock_images_count}</span>
                                 </div>

                                 {/* Новый красивый вывод дублей */}
                                 {img.duplicate.sources && img.duplicate.sources.length > 0 ? (
                                    <div className="mt-4 space-y-2">
                                       {img.duplicate.sources.map((source) => (
                                          <a
                                             key={source.id}
                                             href={source.url}
                                             target="_blank"
                                             rel="noopener noreferrer"
                                             className={cn(
                                                "flex items-center gap-2  text-sm font-semibold transition-all",
                                                source.is_paid
                                                   ? " text-red-700 hover:text-blue-700"
                                                   : "bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200"
                                             )}
                                          >
                                             <span>{source.domain}</span>

                                          </a>
                                       ))}
                                    </div>
                                 ) : (
                                    <div className="text-gray-500 text-sm mt-2">Дубли не найдены</div>
                                 )}
                              </div>
                           )}

                        </div>
                     </div>
                  </div>

               </div>

               {images && images.links && <div className='w-1/2 ml-auto'>
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
                           <div></div>
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
                           <div></div>
                        )}
                     </div>
                  )}
               </div>}


               {buttons}

               <div className='w-full mt-9 flex justify-end gap-3'>
                  {img.status == "process" && <Button onClick={freeLogic} variant="primary" size={'lg'} className='ml-auto'>
                     Автоматический перенос на бесплатно
                  </Button>}

                  <TextLink href={`/images/${projectId}`} variant="primary" size={'lg'} >
                     Назад к списку
                  </TextLink>
               </div></>
         ) :
            <div>
               <div className='text-xl font-semibold  mb-2'>Все изображения отсортированы </div>
               <TextLink href={`/images/${projectId}`} variant="primary" size={'lg'} className='ml-auto'>
                  Вернуться к списку
               </TextLink></div>
         }
         <ConfirmDialog />

      </>
   )
}

export default Sorting
