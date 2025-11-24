import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { useMemo } from 'react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { url } = usePage();

    // Нормализуем текущий URL (убираем query и hash)
    const currentPath = useMemo(() => {
        try {
            return new URL(url, window.location.origin).pathname;
        } catch {
            return url.split('?')[0].split('#')[0];
        }
    }, [url]);

    // Функция для получения href как строки
    const getHref = (href: NavItem['href']): string => {
        if (typeof href === 'string') return href;
        if (href && typeof href === 'object' && 'url' in href) {
            return href.url;
        }
        return '';
    };

    // Проверяем, активен ли пункт
    const isActive = (href: NavItem['href']): boolean => {
        const itemHref = getHref(href);
        if (!itemHref) return false;

        let currentUrl: URL;
        try {
            currentUrl = new URL(url, window.location.origin);
        } catch {
            return false;
        }

        let itemUrl: URL;
        try {
            itemUrl = new URL(itemHref, window.location.origin);
        } catch {
            return false;
        }

        // 1. Сравниваем pathname
        if (currentUrl.pathname !== itemUrl.pathname) return false;

        // 2. Если в меню нет query-параметров — считаем активным любой URL с этим pathname
        if (!itemUrl.search) return true;

        // 3. Если есть query-параметры — проверяем, совпадают ли все параметры из меню
        // (мы не требуем, чтобы были только эти параметры — могут быть дополнительные, например, page=2)
        for (const [key, value] of itemUrl.searchParams.entries()) {
            if (currentUrl.searchParams.get(key) !== value) {
                return false;
            }
        }

        return true;
    };

    return (
        <SidebarGroup className="px-2 py-2">
            <SidebarMenu>
                {items.map((item) => {
                    const href = getHref(item.href);
                    const active = isActive(item.href);

                    return (
                        <SidebarMenuItem key={item.title} className={`${item.border ? 'border-b-1 mb-4 pb-4' : ''}`} >
                            <Link
                                href={href}
                                prefetch
                                className={`
                                        block p-2.5 mx-2 text-[14px] font-medium rounded-md
                                        transition-all duration-200
                                        hover:!text-[#3E95FB]
                                   
                                        ${active
                                        ? 'bg-[#F8F8F8] !text-[#3E95FB] shadow-[0_0_1px_#3E95FB] !hover:bg-[#E3F0FF]'
                                        : 'text-[#111111] bg-[#F8F8F8] !hover:bg-[#F8F8F8] !hover:text-[#3E95FB] '
                                    }
                                    `}
                            >
                                {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup >
    );
}