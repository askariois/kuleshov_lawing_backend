
import AppLayout from '@/layouts/app-layout';
import Header from '@/components/ui/header';
import { router, usePage } from '@inertiajs/react';
import Sorting from './../components/features/sorting/sorting';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';

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
            <Button variant="primary" size={'full'} className='ml-6 text-[18px] font-semibold' onClick={() => onImage('process')}>
               На поиск
            </Button>
         </div>
      </div>)
   }

   return (
      <AppLayout>
         <Header title="Первичная сортировка" subtitle={`Всего: ${images.to ? images.to : 0} / ${images.total}`}>
         </Header>
         {images.data.length > 0 && (
            images.data.map((img) => {
               return <Sorting img={img} images={images} currentPage={currentPage} projectId={projectId} buttons={buttons()} />
            }))}
      </AppLayout>
   )
}
