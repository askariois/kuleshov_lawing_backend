import Status from '@/components/ui/status/Status'
import CopyLink from '@/components/ui/copy-link/CopyLink';
import TextLink from '@/components/text-link';
import { router } from '@inertiajs/react';
import SiteChips from '../sitechips/sitechips';


function Sorting({ img, images, projectId, buttons }) {
   const [name, ext] = img.name.split(/\.(?=[^\.]+$)/);

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
                              <span className="font-medium text-[13px] text-[#7C7C7C] flex items-baseline">
                                 {img.path} <CopyLink />
                              </span>
                           </div>


                           <Status status={img.status} />

                        </div>
                        <div className="mt-4">
                           {img.locations.map(item => {
                              return <div className="flex items-baseline text-[15px] text-[#7C7C7C] font-medium">
                                 {item.url} <CopyLink />
                              </div>
                           })}
                           {img.duplicate && (<div className='mt-7'>
                              <div className='text-[18px] font-bold'>Найденые совпадения <span className='text-[32px] text-[#E45454]'>  {img.duplicate.images_count}</span></div>
                              <div className='text-[18px] font-bold'> Платные <span className='text-[32px] text-[#E45454]'>  {img.duplicate.stock_images_count}</span></div>
                              <SiteChips siteNameString={img.duplicate?.site_name} />
                           </div>)}

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

                              <div className='mr-2'> Вперед</div>
                              <svg width="5" height="9" className='rotate-180' viewBox="0 0 5 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                                 <path d="M0.0965174 4.2994L3.96427 8.05006C4.20561 8.28409 4.66699 8.14223 4.66699 7.83399L4.66699 0.332675C4.66699 0.024436 4.20561 -0.117431 3.96427 0.116609L0.0965174 3.86727C-0.0317575 3.99157 -0.0316989 4.17509 0.0965174 4.2994Z" fill="#B1B1B1" />
                              </svg>
                           </div>
                        )}
                     </div>
                  )}
               </div>}


               {buttons}

               <div className='w-full mt-9 flex'>
                  <TextLink href={`/images/${projectId}`} variant="primary" size={'lg'} className='ml-auto'>
                     Завершить обработку
                  </TextLink>
               </div></>
         ) :
            <div>
               <div className='text-xl font-semibold  mb-2'>Все изображения отсортированы </div>
               <TextLink href={`/images/${projectId}`} variant="primary" size={'lg'} className='ml-auto'>
                  Вернуться к списку
               </TextLink></div>
         }
      </>
   )
}

export default Sorting
