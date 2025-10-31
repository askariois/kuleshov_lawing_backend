import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { BookOpen, Folder } from 'lucide-react';
import AppLogo from './app-logo';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/ru'; // для русского

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);


const mainNavItems: NavItem[] = [
    { title: 'Изображения', href: '/images/' + localStorage.getItem("selectedProjectId"), border: true },
    { title: 'ТЗ на замену', href: '/projects' },
    { title: 'Запрос заказчику', href: '/customer_request/' + localStorage.getItem("selectedProjectId"), border: true },
];


interface ISidebarData {
    sidebar: {
        projects: { id: number; name: string; url: string }[];
    };
}

export function AppSidebar() {
    const { sidebar } = usePage<ISidebarData>().props;
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(localStorage.getItem('selectedProjectId') || null);

    // Определяем, выбран ли проект
    const isProjectSelected = selectedProjectId !== null;

    const onScan = () => {
        router.post('/scan', { 'url': sidebar.projects.find(p => p.id == selectedProjectId)?.url, 'project_id': selectedProjectId }, {
            onSuccess: () => {
                toast.success('Сканирование запущено!')

            },
            onError: (errors) => {
                console.log('Ошибки валидации:', errors);
            },
        });
    }

    const onSelected = (value: string) => {
        setSelectedProjectId(value || null);
        localStorage.setItem('selectedProjectId', value || '');
    }

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/projects" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

                <SidebarMenu className="px-2 border-b border-b-[1px] pb-4">
                    <Label htmlFor="project-select" className="text-[11px] text-[#7C7C7C] mb-1 block">
                        Проект:
                    </Label>
                    <Select
                        value={selectedProjectId || ''}
                        onValueChange={(value) => onSelected(value)}
                    >
                        <SelectTrigger
                            id="project-select"
                            className="w-full bg-[#F1F1F1] text-[#111111] cursor-pointer"
                        >
                            <SelectValue placeholder="Выберите проект" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#F1F1F1]">
                            <SelectGroup>
                                {sidebar.projects.map((item) => (
                                    <SelectItem key={item.id} value={String(item.id)}>
                                        {item.name}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {/* Показываем NavMain и кнопку ТОЛЬКО если проект выбран */}
                {isProjectSelected && (
                    <>
                        <NavMain items={mainNavItems} />

                        <div className="mx-4 mt-4">
                            <Button type="button" variant="primary" size="lg" className="w-full" onClick={onScan}>
                                Сканирование
                            </Button>
                        </div>
                    </>
                )}

                {/* Опционально: placeholder, если ничего не выбрано */}
                {!isProjectSelected && (
                    <div className="px-6 py-8 text-center text-sm text-[#7C7C7C]">
                        Выберите проект, чтобы продолжить
                    </div>
                )}
            </SidebarContent>
            <Toaster
                position="top-right"
                reverseOrder={false}
            />
        </Sidebar>
    );
}