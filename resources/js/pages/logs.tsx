import Header from '@/components/ui/header';
import AppLayout from '@/layouts/app-layout';
import { router, usePage } from '@inertiajs/react';
import { Pagination } from '@/components/ui/pagination/pagination';
import dayjs from 'dayjs';
import { Label } from '@/components/ui/label';
import { useEffect, useState } from 'react';
import { Props } from 'node_modules/@headlessui/react/dist/types';

export default function Logs() {
   const { logs, search: initialSearch, errors: serverErrors } = usePage<Props>().props;
   const [search, setSearch] = useState(initialSearch ?? '');

   const page = usePage();
   // или просто:
   const currentPath = page.url;

   const onSearch = (e) => {
      const search = e.target.value;
      router.get(
         currentPath,
         { search: search.trim() },
         {
            preserveState: true,
            replace: true,
            preserveScroll: true,
         }
      );

   }


   const handleClear = () => {
      setSearch('');
   };
   return (
      <AppLayout>
         <Header title="Логи" >
         </Header>

         <div className='flex items-center gap-3'>
            <div className='w-full'>
               <Label htmlFor="search">Поиск</Label>
               <input
                  type="search"
                  placeholder="Поиск..."
                  className="w-full rounded-md border border-gray-300 bg-[#F1F1F1] px-4 py-2 focus:border-blue-500 focus:outline-none"
                  onChange={onSearch}
               />
            </div>
         </div>

         <div className="w-full mt-6 overflow-x-auto">
            <div
               className="grid gap-4 text-sm font-medium text-gray-700 mb-2 border-b border-solid border-[#B1B1B1]/30 py-2"
               style={{
                  gridTemplateColumns:
                     "minmax(356px, 52px) minmax(356px, 1fr) minmax(140px, 1fr)",
               }}
            >
               <div className="font-semibold">Дата+время </div>
               <div className="font-semibold">Наименование страницы</div>
               <div className="font-semibold text-right">Статус</div>
            </div>


            {logs.data.length !== 0 && logs.data.map((log) => {

               return (<div
                  key={log.id}
                  className="grid gap-4 items-center text-sm text-gray-900 border-b border-solid border-[#B1B1B1]/30 py-2 hover:bg-[#F1F1F1] transition"
                  style={{
                     gridTemplateColumns:
                        "minmax(356px, 52px) minmax(356px, 1fr) minmax(140px, 1fr)",
                  }}
               >
                  <div className="text-[#7C7C7C] font-medium text-[13px]">{dayjs(log.crawler_at).format('DD.MM.YYYY  HH:mm')}</div>
                  <div className="text-[#7C7C7C] font-medium text-[13px]">{log.url}</div>
                  <div className="text-[#7C7C7C] font-medium text-[13px] text-right">{log.status}</div>
               </div>
               )
            })}

            <Pagination data={logs} />
         </div>
      </AppLayout>
   )
}
