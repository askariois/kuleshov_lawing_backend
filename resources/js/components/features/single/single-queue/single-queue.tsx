
import AppLayout from '@/layouts/app-layout';
import Header from '@/components/ui/header';
import { router, usePage } from '@inertiajs/react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import Sorting from '@/components/features/sorting/sorting';
import { useState } from 'react';
import { cn } from "@/lib/utils"
import PhotoGenerate from '@/components/features/photo-generate/photo-generate';
import cat from "../../../../images/Image.png"
import preview from "../../../../images/main-page-server.webp"
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Info } from 'lucide-react';


export default function SingleQueue() {
   const { image, currentPage, genereteImages, errors: serverErrors } = usePage<Props>().props;
   const rawId = localStorage.getItem("selectedProjectId");
   const projectId = rawId ? JSON.parse(rawId) : null;
   const [selectedIndex, setSelectedIndex] = useState<string | null>(null);
   const [activeTab, setActiveTab] = useState<'generate' | 'info'>('generate');
   const [selectedImage, setSelectedImage] = useState<string | null>(""); // первое выбрано по дефолту
   const [promt, setPromt] = useState<string | null>(""); // первое выбрано по дефолту

   const handleEditImage = () => {
      const formData = new FormData();
      formData.append('image_url', image.path);
      formData.append('prompt', promt);
      formData.append('n', '1');
      formData.append('size', '1024x1024');
      formData.append('image_id', image.id);

      router.post(`/generate-img/${projectId}`, formData, {
         forceFormData: true,
         onSuccess: () => {
            toast.success('Генерация запущена!');
         },
         onError: (errors) => {
            console.error(errors);
            toast.error('Ошибка: ' + (errors.image_url?.[0] || 'попробуйте ещё'));
         },
      });
   };




   return (
      <>
         <Header title="Результаты генерации">
            <div>
               <div className="relative bg-gray-100  rounded-xl inline-flex">
                  {/* ← ПИЛЮЛЯ: ширина одной кнопки, смещение на ширину первой */}
                  <div
                     className="absolute top-1 left-1 w-[212px] h-9  rounded-lg transition-all duration-300 ease-out z-0"
                     style={{
                        transform: activeTab === 'generate' ? 'translateX(145px)' : 'translateX(0)'
                     }}
                  />

                  {/* КНОПКА 1: Параметры */}
                  <Button
                     variant="secondary"
                     size={'lg'}
                     onClick={() => setActiveTab('generate')}
                     className={cn(
                        "relative z-10 px-8 py-3 rounded-lg font-medium transition-colors",
                        activeTab === 'generate' ? "text-[#3E95FB] !bg-[#F1F1F1]" : "text-gray-700 bg-[#F8F8F8]"
                     )}
                  >
                     Параметры генерации
                  </Button>

                  {/* КНОПКА 2: Инфо */}
                  <Button
                     variant="secondary"
                     size={'lg'}
                     onClick={() => setActiveTab('info')}
                     className={cn(
                        "relative z-10 px-8 py-3 rounded-lg font-medium transition-colors",
                        activeTab === 'info' ? "text-[#3E95FB]" : "text-gray-700 bg-[#F8F8F8]"
                     )}
                  >
                     Инфо об изображении
                  </Button>
               </div>
            </div>
         </Header>

         <div >
            {activeTab === 'generate' && (
               <PhotoGenerate img={image} generateimg={selectedImage} />
            )}

            {activeTab === 'info' && (
               <Sorting img={image} currentPage={currentPage} projectId={projectId} />
            )}
            {activeTab === 'generate' && (
               <>
                  <div className='py-6 w-full flex justify-end border-b b-1 border-[#B1B1B1]/30%'>
                     {/* <Button variant={'secondary'} disabled={false} size={'lg'} className='ml-auto'>В ТЗ на замену</Button> */}
                  </div>
                  <div>

                     {genereteImages.length > 0 && <><div className='font-semibold text-[15px] text-[#111111] mt-6'>Промпт</div> <textarea name="" onChange={(e) => setPromt(e.target.value)} placeholder='Сгенерируй классное изображение в стиле ИТ для классного сайта в сфере ИТ чтобы оно отображало классность нашего ИТ на рынке классного ИТ' className='w-full bg-[#F1F1F1] py-2 px-[10px] rounded-[8px]' rows={5}></textarea></>}

                     <Button type="button" size={'lg'} className='ml-auto mt-2' onClick={handleEditImage}>Сгенерировать</Button>
                  </div>

                  <RadioGroup value={selectedIndex} onValueChange={setSelectedIndex}>
                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                        {genereteImages.map((item, index) => {
                           const id = `img-${index}`;

                           return (
                              <div key={index} className="relative group cursor-pointer">
                                 {/* Кастомная большая радиокнопка */}
                                 <RadioGroupItem
                                    value={id}
                                    id={id}
                                    className="sr-only" // прячем стандартную точку (visually hidden)
                                    onClick={() => setSelectedImage(item.url)}
                                 />

                                 {/* Видимая кастомная кнопка */}
                                 <label
                                    htmlFor={id}
                                    className="absolute top-4 right-4 z-10 flex items-center justify-center w-6 h-6 rounded-full border-[1px] border-white shadow-2xl transition-all duration-300 cursor-pointer
                      data-[state=checked]:ring-2 data-[state=checked]:ring-[#3E95FB]/30
                     data-[state=unchecked]:bg-[#00000033] hover:data-[state=unchecked]:bg-gray-100"
                                    data-state={selectedIndex === id ? 'checked' : 'unchecked'}
                                 >
                                    {/* Твоя иконка только при выборе */}
                                    <svg width="27" height="27" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg" data-state={selectedIndex === id ? 'checked' : 'unchecked'} className="w-7 h-7 text-white opacity-0 data-[state=checked]:opacity-100 transition-opacity">
                                       <path fill-rule="evenodd" clip-rule="evenodd" d="M26.6667 13.3333C26.6667 20.6971 20.6971 26.6667 13.3333 26.6667C5.96953 26.6667 0 20.6971 0 13.3333C0 5.96953 5.96953 0 13.3333 0C20.6971 0 26.6667 5.96953 26.6667 13.3333ZM18.7071 9.29289C19.0976 9.68341 19.0976 10.3166 18.7071 10.7071L12.0404 17.3737C11.6499 17.7643 11.0168 17.7643 10.6262 17.3737L7.95956 14.7071C7.56904 14.3165 7.56904 13.6835 7.95956 13.2929C8.35008 12.9024 8.98325 12.9024 9.37377 13.2929L11.3333 15.2524L14.3131 12.2727L17.2929 9.29289C17.6835 8.90237 18.3165 8.90237 18.7071 9.29289Z" fill="#3E95FB" />
                                    </svg>
                                 </label>

                                 {/* Рамка вокруг изображения при выборе */}
                                 <div className={cn(
                                    "rounded-xl overflow-hidden border-4 transition-all duration-300",
                                    selectedIndex === id
                                       ? "border-[#3E95FB] ring-4 ring-[#3E95FB]/20 shadow-2xl"
                                       : "border-transparent"
                                 )}>
                                    <img
                                       src={item.url}
                                       alt={`Вариант ${index + 1}`}
                                       className="w-full aspect-square object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                                    />
                                 </div>

                                 {/* Номер */}
                                 <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2.5 py-1 rounded backdrop-blur-sm font-medium">
                                    <Info className="w-5 h-5" strokeWidth={2.5} />
                                 </div>
                              </div>
                           );
                        })}</div></RadioGroup>


               </>)}



         </div>
      </ >
   )
}
