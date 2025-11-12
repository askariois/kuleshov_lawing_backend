
import AppLayout from '@/layouts/app-layout';
import Header from '@/components/ui/header';
import { router, usePage } from '@inertiajs/react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import Sorting from '@/components/features/sorting/sorting';
import { useState } from 'react';
import { cn } from "@/lib/utils"
import PhotoGenerate from '@/components/features/photo-generate/photo-generate';
import SinglDefault from './single-default/single-default';
import { Props } from 'node_modules/@headlessui/react/dist/types';
import SingleDefault from './single-default/single-default';


export default function Single() {
   const { image, currentPage, errors: serverErrors } = usePage<Props>().props;

   const [activeTab, setActiveTab] = useState<'generate' | 'info'>('generate');

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

   const renderInfoTab = () => {

      if (['author', 'design', 'raw', 'process'].includes(image.status)) {
         return <SingleDefault />;
      }
   }


   return (
      <AppLayout>
         {renderInfoTab()}
      </AppLayout >
   )
}
