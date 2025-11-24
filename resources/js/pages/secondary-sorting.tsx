import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import Header from '@/components/ui/header';
import { router, usePage } from '@inertiajs/react';
import toast from 'react-hot-toast';
import Sorting from '@/components/features/sorting/sorting';

export default function PrimarySorting() {
   const { images, currentPage, filters, errors: serverErrors } = usePage<Props>().props;
   const rawId = localStorage.getItem("selectedProjectId");
   const projectId = rawId ? JSON.parse(rawId) : null;

   const returnUrl = `/secondary-sorting/${projectId}?page=${currentPage}` +
      (filters.search ? `&search=${encodeURIComponent(filters.search)}` : '') +
      (filters.mime_type && filters.mime_type.length > 0
         ? `&mime_type[]=${filters.mime_type.join('&mime_type[]=')}`
         : '');

   const onImage = (status: string) => {
      router.post(`/primary-sorting/${images.data[0].id}/sort`, {
         status,
         project_id: projectId,
         page: currentPage, // ← передаём текущую страницу
         return_to: returnUrl,

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
            <Button variant="secondary" size={'full'} className='text-[18px] font-semibold hover:bg-primary hover:text-white' onClick={() => onImage('author')}>
               Авторское
            </Button>
            <Button variant="secondary" size={'full'} className='text-[18px] font-semibold hover:bg-primary hover:text-white' onClick={() => onImage('free')}>
               Бесплатное
            </Button>
            <Button variant="secondary" size={'full'} className='ml-6 text-[18px] font-semibold hover:bg-primary hover:text-white' onClick={() => onImage('queue')}>
               На генерацию
            </Button>
         </div>
      </div>)
   }


   return (
      <AppLayout>
         <Header title="Вторичная обработка" subtitle={`Всего: ${images.to ? images.to : 0} / ${images.total}`}>
         </Header>
         {images.data.length > 0 && (
            images.data.map((img) => {
               return <Sorting img={img} images={images} currentPage={currentPage} projectId={projectId} buttons={buttons()} />
            }))}
      </AppLayout >
   )
}
