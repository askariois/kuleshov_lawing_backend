// components/SiteChips.tsx
import { Badge } from '@/components/ui/badge';
import CopyLink from '@/components/ui/copy-link/CopyLink';

type SiteChipsProps = {
   siteNameString: string | null;
};

export default function SiteChips({ siteNameString }: SiteChipsProps) {
   const sites = siteNameString
      ? siteNameString.split(',').map(s => s.trim()).filter(Boolean)
      : [];

   if (sites.length === 0) {
      return <span className="text-xs text-gray-400">—</span>;
   }

   return (
      <div className="flex flex-col gap-1.5 ">
         {sites.slice(0, 10).map((site, i) => (
            <div key={i} variant="secondary" className="text-[15px] text-[#7C7C7C] font-medium flex items-center">
               {site} <CopyLink />
            </div>
         ))}

      </div>
   );
}