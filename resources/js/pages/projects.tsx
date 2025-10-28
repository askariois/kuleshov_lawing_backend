// resources/js/Pages/Projects/Index.tsx

import AppLayout from '@/layouts/app-layout';
import Header from '../components/ui/header';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import Modal from '@/components/widget/modal/modal';
import { Input } from '@/components/ui/input';
import { router, useForm, usePage } from '@inertiajs/react';
import { PageProps } from '@inertiajs/core';

// === Проект ===
interface Project {
    id: number;
    name: string;
    url: string;
    last_scan: string | null;
    images_count: number;
    processed_images: number;
    not_processed_images: number;
    format_images: string;
    autoscan: boolean;
    time_autoscan: string | null;
}

// === Пагинатор (Laravel) ===
interface Paginator<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

// === Props страницы ===
interface Props extends PageProps {
    projects: Paginator<Project>;  // ← Правильно
    flash?: { success?: string };
    errors?: Record<string, string>;
}
export default function Projects() {
    const [add, setAdd] = useState(false);
    const { projects, flash, errors: serverErrors } = usePage<Props>().props;

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        url: 'https://', // Предзаполняем https://
    });

    const onAdd = () => setAdd(!add);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/projects', data, {
            onSuccess: () => {
                setAdd(false);
                setData({ name: '', url: '' });
            },
            onError: (errors) => {
                console.log('Ошибки валидации:', errors);
            },
        });
    };


    return (
        <AppLayout>
            <Header title="Проекты" subtitle={`Всего: ${projects.data.length}`}>
                <Button variant="primary" size="lg" onClick={onAdd}>
                    Добавить проект
                </Button>
            </Header>

            {/* Flash сообщение */}
            {flash?.success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
                    {flash.success}
                </div>
            )}

            {/* Поиск */}
            <div className="mb-6">
                <Label htmlFor="search">Поиск</Label>
                <input
                    type="search"
                    placeholder="Поиск..."
                    className="w-full rounded-md border border-gray-300 bg-[#F1F1F1] px-4 py-2 focus:border-blue-500 focus:outline-none"
                />
            </div>

            {/* Таблица */}
            <div className="w-full mt-6 overflow-x-auto">
                <div
                    className="grid gap-4 text-sm font-medium text-gray-700 mb-2 border-b border-solid border-[#B1B1B1]/30 py-2"
                    style={{
                        gridTemplateColumns:
                            "minmax(300px, 2fr) minmax(120px, 1fr) minmax(100px, 1fr) minmax(100px, 1fr) minmax(100px, 1fr) minmax(20px, 0.2fr)",
                    }}
                >
                    <div className="font-semibold">URL</div>
                    <div className="font-semibold">Посл. сканирование</div>
                    <div className="font-semibold">Всего изобр.</div>
                    <div className="font-semibold">Обработанно</div>
                    <div className="font-semibold">Не обработано</div>
                    <div className="font-semibold"></div>
                </div>

                {projects.data.length !== 0 && projects.data.map((project) => (
                    <div
                        key={project.id}
                        className="grid gap-4 items-center text-sm text-gray-900 border-b border-solid border-[#B1B1B1]/30 py-2"
                        style={{
                            gridTemplateColumns:
                                "minmax(300px, 2fr) minmax(120px, 1fr) minmax(100px, 1fr) minmax(100px, 1fr) minmax(100px, 1fr) minmax(20px, 0.2fr)",
                        }}
                    >
                        <div>
                            <a href={project.url} target="_blank" className="text-blue-600 hover:underline">
                                {project.url}
                            </a>
                        </div>
                        <div>{project.last_scan || '—'}</div>
                        <div className="text-[#7C7C7C] font-medium">{project.images_count}</div>
                        <div className="text-[#7C7C7C] font-medium">{project.processed_images}</div>
                        <div className="text-[#7C7C7C] font-medium">{project.not_processed_images}</div>
                        <div className="flex justify-center">
                            <svg width="13" height="14" viewBox="0 0 13 14" fill="none">
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M7.5192 0.101493C7.27233 2.98023e-08 6.95933 0 6.33333 0C5.70733 0 5.39433 2.98023e-08 5.14746 0.101493C4.81826 0.23682 4.55672 0.496387 4.42037 0.823087C4.35812 0.972227 4.33377 1.14567 4.32423 1.39866C4.31023 1.77045 4.1181 2.11459 3.79345 2.30062C3.46879 2.48664 3.07242 2.47969 2.74099 2.30584C2.51545 2.18753 2.35193 2.12175 2.19066 2.10068C1.83739 2.05452 1.48012 2.14953 1.19744 2.3648C0.985425 2.52625 0.828925 2.79527 0.515932 3.33329C0.202939 3.87131 0.0464451 4.14032 0.0115651 4.40327C-0.0349482 4.75387 0.0607851 5.10844 0.277698 5.389C0.376705 5.51707 0.515845 5.62467 0.731799 5.75933C1.04927 5.95733 1.25355 6.2946 1.25353 6.66667C1.25351 7.03873 1.04924 7.37593 0.731799 7.57387C0.515812 7.7086 0.376645 7.81627 0.277632 7.94433C0.0607185 8.22487 -0.0350081 8.5794 0.0114985 8.93C0.0463785 9.19293 0.202878 9.462 0.515865 10C0.828858 10.538 0.985358 10.8071 1.19737 10.9685C1.48005 11.1837 1.83733 11.2787 2.19059 11.2326C2.35185 11.2115 2.51536 11.1457 2.74089 11.0275C3.07235 10.8536 3.46873 10.8467 3.79341 11.0327C4.11809 11.2187 4.31022 11.5629 4.32423 11.9347C4.33377 12.1877 4.35812 12.3611 4.42037 12.5103C4.55672 12.8369 4.81826 13.0965 5.14746 13.2319C5.39433 13.3333 5.70733 13.3333 6.33333 13.3333C6.95933 13.3333 7.27233 13.3333 7.5192 13.2319C7.8484 13.0965 8.10993 12.8369 8.24626 12.5103C8.30853 12.3611 8.33293 12.1877 8.34246 11.9347C8.35646 11.5629 8.54853 11.2187 8.8732 11.0327C9.19786 10.8466 9.59426 10.8536 9.92573 11.0275C10.1513 11.1457 10.3147 11.2115 10.476 11.2325C10.8293 11.2787 11.1865 11.1837 11.4692 10.9685C11.6813 10.807 11.8377 10.538 12.1507 9.99993C12.4637 9.46193 12.6202 9.19293 12.6551 8.93C12.7016 8.5794 12.6059 8.2248 12.389 7.94427C12.2899 7.8162 12.1508 7.70853 11.9348 7.57387C11.6174 7.37593 11.4131 7.03867 11.4131 6.6666C11.4131 6.29453 11.6174 5.9574 11.9348 5.75947C12.1509 5.62473 12.29 5.51713 12.3891 5.389C12.6059 5.10849 12.7017 4.75391 12.6552 4.40331C12.6203 4.14037 12.4638 3.87135 12.1508 3.33333C11.8378 2.79531 11.6813 2.5263 11.4693 2.36485C11.1866 2.14957 10.8293 2.05457 10.4761 2.10073C10.3148 2.12179 10.1513 2.18757 9.9258 2.30587C9.59433 2.47973 9.19793 2.48668 8.87327 2.30064C8.5486 2.11461 8.35647 1.77044 8.3424 1.39863C8.33286 1.14565 8.30853 0.97222 8.24626 0.823087C8.10993 0.496387 7.8484 0.23682 7.5192 0.101493ZM6.33333 8.66667C7.44633 8.66667 8.34853 7.77127 8.34853 6.66667C8.34853 5.56207 7.44633 4.66667 6.33333 4.66667C5.22033 4.66667 4.31811 5.56207 4.31811 6.66667C4.31811 7.77127 5.22033 8.66667 6.33333 8.66667Z"
                                    fill="#B1B1B1"
                                />
                            </svg>
                        </div>
                    </div>
                ))}
            </div>

            {/* Модалка */}
            <Modal show={add} onHide={onAdd} title="Новый проект">
                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="name">Название проекта</Label>
                        <Input
                            id="name"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Мой сайт"
                            required
                        />
                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>

                    <div>
                        <Label htmlFor="url">URL сайта</Label>
                        <Input
                            id="url"
                            type="text"
                            value={data.url}
                            onChange={(e) => setData('url', e.target.value)}
                            placeholder="https://example.com"
                            required
                        />
                        {(errors.url || serverErrors?.url) && (
                            <p className="text-red-500 text-sm mt-1">{errors.url || serverErrors?.url}</p>
                        )}
                    </div>

                    <Button type="submit" disabled={processing} className="w-full" size="lg">
                        {processing ? 'Создаём...' : 'Создать проект'}
                    </Button>
                </form>
            </Modal>
        </AppLayout>
    );
}