import { useConfirm } from '@/hooks/useConfirm';
import primary from '@/routes/primary';
import { router } from '@inertiajs/react';
import React from 'react'

export default function ScanButtons({ project, isAnyScanning, sitemap, subdomain }) {
   const { confirm, ConfirmDialog } = useConfirm();
   const returnUrl = subdomain ? `/subdomains/${project.parent_id}` : "/projects";



   const onScan_1 = async (url, id) => {
      const agreed = await confirm({
         title: 'Вы уверены, что хотите запустить сканирование?',
         message: 'Это действие нельзя отменить.',
         confirmText: 'Запустить',
         cancelText: 'Отмена'
      });
      if (agreed) {
         router.post('/scan', { 'url': url, 'project_id': id, return_url: returnUrl }, {
            onSuccess: () => {
               toast.success('Сканирование запущено!')
            },
            onError: (errors) => {
               console.log('Ошибки валидации:', errors);
            },
         });
      }
   }

   const onScan_2 = async (url, id) => {
      const agreed = await confirm({
         title: 'Вы уверены, что хотите запустить сканирование?',
         message: 'Это действие нельзя отменить.',
         confirmText: 'Запустить',
         cancelText: 'Отмена'
      });
      if (agreed) {
         router.post('/scan_2', { 'url': url, 'project_id': id, return_url: returnUrl }, {
            onSuccess: () => {
               toast.success('Сканирование запущено!')
            },
            onError: (errors) => {
               console.log('Ошибки валидации:', errors);
            },
         });
      }

   }

   return (
      <>
         {project.scan_status === "running" && <div className={`bg-[#F59106] rounded-[4px] p-2 cursor-pointer`} >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-spin">
               <g clip-path="url(#clip0_342_26)">
                  <path d="M6 1V3" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M6 9V11" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M2.46484 2.46497L3.87984 3.87997" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M8.12012 8.12L9.53512 9.535" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M1 6H3" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M9 6H11" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M2.46484 9.535L3.87984 8.12" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M8.12012 3.87997L9.53512 2.46497" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
               </g>
               <defs>
                  <clipPath id="clip0_342_26">
                     <rect width="12" height="12" fill="white" />
                  </clipPath>
               </defs>
            </svg>
         </div>}


         {isAnyScanning && project.scan_status !== "running" && (
            <div className={`bg-[#B1B1B1] rounded-[4px] p-2 cursor-pointer`} >
               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="9" fill="white" opacity="0.15" />
                  <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
                  <path d="M8 8L16 16" stroke="white" strokeWidth="3" strokeLinecap="round" />
               </svg>
            </div>
         )}

         {((project.scan_status === "completed" || project.scan_status === "idle") && !isAnyScanning) && (
            <div className={`${sitemap ? "bg-primary" : " bg-[#0AA947]"} rounded-[4px] p-2 cursor-pointer`} onClick={sitemap ? () => onScan_2(project.url, project.id) : () => onScan_1(project.url, project.id)}>
               <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" >
                  <path d="M8.7043 3.67629C9.76525 4.25325 9.76525 5.74675 8.7043 6.3237L2.29831 9.80725C1.26717 10.368 0 9.63815 0 8.48355V1.51645C0 0.36184 1.26718 -0.36799 2.29831 0.19274L8.7043 3.67629Z" fill="white" />
               </svg>
            </div >
         )
         }
         < ConfirmDialog />
      </>
   )
}
