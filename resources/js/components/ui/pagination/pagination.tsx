import React from 'react'
import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';

export function Pagination({ data }) {
   return (
      <>
         {data.links && data.links.length > 3 && (
            <div className="flex justify-center items-center gap-1 mt-6 flex-wrap">
               {data.links.map((link, i) => {
                  if (!link.url && !link.active) return null;

                  const isPrev = link.label.includes('Previous');
                  const isNext = link.label.includes('Next');
                  const isDots = link.label === '...';

                  if (isDots) {
                     return <span key={i} className="px-2 text-gray-500">...</span>;
                  }

                  return (
                     <Button
                        key={i}
                        variant={link.active ? 'default' : 'outline'}
                        size="sm"
                        disabled={!link.url}
                        onClick={() => link.url && router.visit(link.url, { preserveState: true })}
                     >
                        {isPrev ? 'Пред.' : isNext ? 'След.' : link.label}
                     </Button>
                  );
               })}
            </div>
         )}
      </>
   )
}
