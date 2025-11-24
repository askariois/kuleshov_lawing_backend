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
import toast, { Toaster } from 'react-hot-toast';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/ru';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.locale('ru');

import { useLocalStorage } from '@/hooks/useLocalStorage';

const mainNavItems = (projectId: string | null): NavItem[] => [
    { title: 'Все изображения', href: `/images/${projectId}/?mime_type=&status=`, border: true },



    { title: 'ТЗ на замену', href: `/tor/${projectId}` },
    { title: 'Генерация ИЗО', href: `/queue/${projectId}` },
    { title: 'Запрос заказчику', href: `/customer_request/${projectId}`, border: true },
];

interface ISidebarData {
    sidebar: {
        projects: { id: number; name: string; url: string }[];
    };
}

export function AppSidebar() {
    const { sidebar } = usePage<ISidebarData>().props;
    const [selectedProjectId, setSelectedProjectId] = useLocalStorage<string | null>('selectedProjectId', null);

    const isProjectSelected = selectedProjectId !== null;

    const onScan = () => {
        const project = sidebar.projects.find(p => p.id === Number(selectedProjectId));
        if (!project) return;

        router.post('/scan', {
            url: project.url,
            project_id: selectedProjectId,
        }, {
            onSuccess: () => toast.success('Сканирование запущено!'),
            onError: (errors) => console.log('Ошибки:', errors),
        });
    };

    const onSelected = (value: string) => {
        const projectId = value || null;
        setSelectedProjectId(projectId);

        // Редирект только если проект выбран
        if (projectId) {
            window.location.href = `/images/${projectId}`;
        }
    };


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
                        onValueChange={onSelected}
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
                {isProjectSelected && (
                    <>
                        <NavMain items={mainNavItems(selectedProjectId)} />
                        <div className="mx-4 mt-4">
                            <Button type="button" variant="primary" size="lg" className="w-full" onClick={onScan}>
                                Сканирование
                            </Button>
                        </div>
                    </>
                )}

                {!isProjectSelected && (
                    <div className="px-6 py-8 text-center text-sm text-[#7C7C7C]">
                        Выберите проект, чтобы продолжить
                    </div>
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>

            <Toaster position="top-right" reverseOrder={false} />
        </Sidebar>
    );
}