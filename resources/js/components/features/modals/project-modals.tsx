import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import Modal from '@/components/widget/modal/modal'
import { useConfirm } from '@/hooks/useConfirm'
import { router } from '@inertiajs/react'
import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { GeneralTab } from '../project/GeneralTab'
import { SubdomainsTab } from '../project/SubdomainsTab'
import { SitemapsTab } from '../project/SitemapsTab'

export default function ProjectModals({ toogle, setToogle, project_parent, className }) {

   const [activeTab, setActiveTab] = useState<TabType>('general')

   return (
      <Modal show={toogle} onHide={() => setToogle(false)} title="Настройки проекта" subtitle={project_parent.url} className={className}>
         <div className="space-y-6">
            {/* Список поддоменов */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="w-full ">
               <TabsList className="grid w-full grid-cols-3 gap-3">
                  <TabsTrigger value="general" >Общие</TabsTrigger>
                  <TabsTrigger value="subdomains">
                     Поддомены
                  </TabsTrigger>
                  <TabsTrigger value="sitemaps">Sitemaps</TabsTrigger>
               </TabsList>


               {activeTab === 'general' && (
                  <GeneralTab
                     description={project_parent?.description}
                     project_parent={project_parent}
                     setToogle={setToogle}

                  // isSaving={true}
                  />
               )}

               {activeTab === 'subdomains' && (
                  <SubdomainsTab
                     subdomains={project_parent?.subdomains || []}
                     project_parent={project_parent}

                  />
               )}

               {activeTab === 'sitemaps' && <SitemapsTab />}
            </Tabs>


         </div>
      </Modal>
   )
}
