
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
import SingleQueue from './single-queue/single-queue';


export default function Single() {
   const { image, currentPage, errors: serverErrors } = usePage<Props>().props;
   const renderInfoTab = () => {

      if (['author', 'design', 'raw', 'process', 'clent'].includes(image.status)) {
         return <SingleDefault />;
      }
      if (['queue'].includes(image.status)) {
         return <SingleQueue />;
      }
   }


   return (
      <AppLayout>
         {renderInfoTab()}
      </AppLayout >
   )
}
