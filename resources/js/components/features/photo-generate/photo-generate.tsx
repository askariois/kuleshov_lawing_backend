import React from 'react'

export default function PhotoGenerate({ img, generateimg }) {
   console.log(generateimg);

   return (
      <div>
         <div className="flex  flex-row gap-6">
            <div className="basis-1/2  w-[520px]">
               <div className='text-[18px] font-bold mb-1'>Оригинал</div>
               <div className=" h-[520px] flex justify-center items-center bg-[#00000050] backdrop-blur-sm z-40 rounded-2xl overflow-hidden">
                  <div className='bg-white'>
                     <img src={img.path} alt="" className='w-full h-auto' />
                  </div>
               </div>
            </div>
            <div className="basis-1/2  w-[520px]">
               <div className='text-[18px] font-bold mb-1'>Генерация</div>
               <div className=" h-[520px] flex justify-center items-center bg-[#00000050] backdrop-blur-sm z-40 rounded-2xl overflow-hidden">
                  <div className='bg-white'>
                     <img src={generateimg} alt="" className='w-full h-auto' />
                  </div>
               </div>
            </div>
         </div>
      </div>
   )
}
