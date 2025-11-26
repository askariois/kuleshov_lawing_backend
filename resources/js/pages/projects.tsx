// resources/js/Pages/Projects/Index.tsx

import AppLayout from '@/layouts/app-layout';
import Header from '../components/ui/header';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useEffect, useRef, useState } from 'react';
import Modal from '@/components/widget/modal/modal';
import { Input } from '@/components/ui/input';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { PageProps } from '@inertiajs/core';
import dayjs from 'dayjs';
import CopyLink from '@/components/ui/copy-link/CopyLink';
import { local } from '@/routes/storage';
import toast from 'react-hot-toast';
import { useConfirm } from '@/hooks/useConfirm';
import { Checkbox } from '@radix-ui/react-checkbox';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import ProjectModals from '@/components/features/modals/project-modals';

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
    subdomains?: Project[]; // ← добавляем поддомены
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


interface ProgressData {
    progress: number;
    processed_pages: number;
    total_pages: number;
    status: 'pending' | 'running' | 'completed' | 'failed';
}


export default function Projects() {
    const [add, setAdd] = useState(false);
    const [setting, setSetting] = useState(false);
    const { projects, flash, errors: serverErrors } = usePage<Props>().props;
    const [progressMap, setProgressMap] = useState<Record<number, ProgressData>>({});
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const { confirm, ConfirmDialog } = useConfirm();

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        url: 'https://', // Предзаполняем https://
        return_url: "/projects"
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



    useEffect(() => {
        const projectIds = projects.data.map(p => p.id);
        if (projectIds.length === 0) return;

        const initial: Record<number, ProgressData> = {};
        projectIds.forEach(id => {
            initial[id] = { progress: 0, processed_pages: 0, total_pages: 0, status: 'pending' };
        });
        setProgressMap(initial);

        const poll = async () => {
            const responses = await Promise.all(
                projectIds.map(id =>
                    fetch(`/progress?project_id=${id}`)
                        .then(r => r.json())
                        .catch(() => null)
                )
            );

            const updated: Record<number, ProgressData> = {};
            responses.forEach((data, i) => {
                if (data?.status) {
                    updated[projectIds[i]] = data;
                }
            });

            setProgressMap(prev => ({ ...prev, ...updated }));
        };

        poll();
        const interval = setInterval(poll, 2000);

        return () => clearInterval(interval);
    }, [projects.data]);

    const onImage = (projectId: number) => {
        window.location.href = `/images/${projectId}`;
    }

    const onScan = async (url, id) => {
        const agreed = await confirm({
            title: 'Вы уверены, что хотите запустить сканирование?',
            message: 'Это действие нельзя отменить.',
            confirmText: 'Запустить',
            cancelText: 'Отмена'
        });
        if (agreed) {
            router.post('/scan', { 'url': url, 'project_id': id }, {
                onSuccess: () => {
                    toast.success('Сканирование запущено!')
                },
                onError: (errors) => {
                    console.log('Ошибки валидации:', errors);
                },
            });
        }

    }

    const openSettings = (project: Project) => {
        setSelectedProject(project);
        setSetting(true);
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
                            "minmax(160px, 2fr) minmax(120px, 2fr)  minmax(120px, 2fr) minmax(120px, 1fr) minmax(100px, 1fr) minmax(100px, 1fr) minmax(100px, 1fr) minmax(120px, 0.2fr)",
                    }}
                >
                    <div className="font-semibold">URL</div>
                    <div className="font-semibold">Процесс сканирования</div>
                    <div className="font-semibold">Кол-во поддоменов</div>
                    <div className="font-semibold">Посл. сканирование</div>
                    <div className="font-semibold">Всего изобр.</div>
                    <div className="font-semibold">Обработанно</div>
                    <div className="font-semibold">Не обработано</div>
                    <div className="font-semibold"></div>
                </div>

                {projects.data.length !== 0 && projects.data.map((project) => {
                    const progress = progressMap[project.id] || { progress: 0, status: 'pending' };
                    const isRunning = progress.status === 'running';
                    const isCompleted = progress.status === 'completed';

                    return (<div
                        key={project.id}
                        className="grid gap-4 items-center text-sm text-gray-900 border-b border-solid border-[#B1B1B1]/30 py-2"
                        style={{
                            gridTemplateColumns:
                                "minmax(160px, 2fr) minmax(120px, 2fr) minmax(120px, 2fr) minmax(120px, 1fr) minmax(100px, 1fr) minmax(100px, 1fr) minmax(100px, 1fr) minmax(120px, 0.2fr)",
                        }}
                    >
                        <div>
                            <div onClick={() => onImage(project.id)} className="text-blue-600 hover:underline cursor-pointer">
                                {project.url}
                            </div>
                        </div>
                        <div className="space-y-1">
                            {isRunning && (
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-blue-600 h-full transition-all duration-500"
                                        style={{ width: `${progress.progress}%` }}
                                    />
                                </div>
                            )}
                            <div className="text-xs text-gray-500">
                                {isRunning && `${Math.round(progress.progress)}%`}
                                {isCompleted && 'Готово'}
                                {!isRunning && !isCompleted && '—'}
                            </div>
                        </div>
                        <div className={`${project.subdomains_count > 0 ? "text-primary" : "text-[#7C7C7C]"} font-bold`}>

                            {project.subdomains_count > 0 ? <Link href={`/subdomains/${project.id}`}>{project.subdomains_count}</Link> : <div>{project.subdomains_count}</div>}

                        </div>

                        <div className="text-[#7C7C7C] font-bold">{project.last_scan ? dayjs(project.last_scan).format('DD.MM.YYYY  HH:mm') : '—'}</div>
                        <div className="text-[#7C7C7C] font-bold">{project.images_count}</div>
                        <div className="text-[#7C7C7C] font-bold">{project.processed_images}</div>
                        <div className={`font-bold ${project.not_processed_images == 0 ? "text-[#0AA947]" : "text-[#E45454]"}`}>{project.not_processed_images}</div>
                        <div className="flex justify-center items-center gap-4">
                            <Link href={`/logs/${project.id}`} className='hover:scale-110 transition-transform duration-200'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12.666678428649902" height="13.333332061767578" viewBox="0 0 19 20" className='hover:fill-blue-500 cursor-pointer transition'>
                                    <g transform="translate(3,2)" stroke="#B1B1B1" stroke-width="2" stroke-linecap="round">
                                        <line x1="0" y1="0" x2="13" y2="0" />
                                        <line x1="0" y1="4" x2="16" y2="4" />
                                        <line x1="0" y1="8" x2="14" y2="8" />
                                        <line x1="0" y1="12" x2="15" y2="12" />
                                    </g>
                                </svg>
                            </Link>
                            <div onClick={() => openSettings(project)} className='cursor-pointer'>
                                <svg width="13" height="14" viewBox="0 0 13 14" fill="none">
                                    <path
                                        fillRule="evenodd"
                                        clipRule="evenodd"
                                        d="M7.5192 0.101493C7.27233 2.98023e-08 6.95933 0 6.33333 0C5.70733 0 5.39433 2.98023e-08 5.14746 0.101493C4.81826 0.23682 4.55672 0.496387 4.42037 0.823087C4.35812 0.972227 4.33377 1.14567 4.32423 1.39866C4.31023 1.77045 4.1181 2.11459 3.79345 2.30062C3.46879 2.48664 3.07242 2.47969 2.74099 2.30584C2.51545 2.18753 2.35193 2.12175 2.19066 2.10068C1.83739 2.05452 1.48012 2.14953 1.19744 2.3648C0.985425 2.52625 0.828925 2.79527 0.515932 3.33329C0.202939 3.87131 0.0464451 4.14032 0.0115651 4.40327C-0.0349482 4.75387 0.0607851 5.10844 0.277698 5.389C0.376705 5.51707 0.515845 5.62467 0.731799 5.75933C1.04927 5.95733 1.25355 6.2946 1.25353 6.66667C1.25351 7.03873 1.04924 7.37593 0.731799 7.57387C0.515812 7.7086 0.376645 7.81627 0.277632 7.94433C0.0607185 8.22487 -0.0350081 8.5794 0.0114985 8.93C0.0463785 9.19293 0.202878 9.462 0.515865 10C0.828858 10.538 0.985358 10.8071 1.19737 10.9685C1.48005 11.1837 1.83733 11.2787 2.19059 11.2326C2.35185 11.2115 2.51536 11.1457 2.74089 11.0275C3.07235 10.8536 3.46873 10.8467 3.79341 11.0327C4.11809 11.2187 4.31022 11.5629 4.32423 11.9347C4.33377 12.1877 4.35812 12.3611 4.42037 12.5103C4.55672 12.8369 4.81826 13.0965 5.14746 13.2319C5.39433 13.3333 5.70733 13.3333 6.33333 13.3333C6.95933 13.3333 7.27233 13.3333 7.5192 13.2319C7.8484 13.0965 8.10993 12.8369 8.24626 12.5103C8.30853 12.3611 8.33293 12.1877 8.34246 11.9347C8.35646 11.5629 8.54853 11.2187 8.8732 11.0327C9.19786 10.8466 9.59426 10.8536 9.92573 11.0275C10.1513 11.1457 10.3147 11.2115 10.476 11.2325C10.8293 11.2787 11.1865 11.1837 11.4692 10.9685C11.6813 10.807 11.8377 10.538 12.1507 9.99993C12.4637 9.46193 12.6202 9.19293 12.6551 8.93C12.7016 8.5794 12.6059 8.2248 12.389 7.94427C12.2899 7.8162 12.1508 7.70853 11.9348 7.57387C11.6174 7.37593 11.4131 7.03867 11.4131 6.6666C11.4131 6.29453 11.6174 5.9574 11.9348 5.75947C12.1509 5.62473 12.29 5.51713 12.3891 5.389C12.6059 5.10849 12.7017 4.75391 12.6552 4.40331C12.6203 4.14037 12.4638 3.87135 12.1508 3.33333C11.8378 2.79531 11.6813 2.5263 11.4693 2.36485C11.1866 2.14957 10.8293 2.05457 10.4761 2.10073C10.3148 2.12179 10.1513 2.18757 9.9258 2.30587C9.59433 2.47973 9.19793 2.48668 8.87327 2.30064C8.5486 2.11461 8.35647 1.77044 8.3424 1.39863C8.33286 1.14565 8.30853 0.97222 8.24626 0.823087C8.10993 0.496387 7.8484 0.23682 7.5192 0.101493ZM6.33333 8.66667C7.44633 8.66667 8.34853 7.77127 8.34853 6.66667C8.34853 5.56207 7.44633 4.66667 6.33333 4.66667C5.22033 4.66667 4.31811 5.56207 4.31811 6.66667C4.31811 7.77127 5.22033 8.66667 6.33333 8.66667Z"
                                        fill="#B1B1B1"
                                    />
                                </svg>
                            </div>

                            <div className='w-3 h-3'>
                                <a href={project.url} target='_blank'>

                                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path fill-rule="evenodd" clip-rule="evenodd" d="M0.732235 9.26775C1.46446 10 2.64297 10 5 10C7.357 10 8.53555 10 9.26775 9.26775C10 8.53555 10 7.357 10 5C10 2.64297 10 1.46446 9.26775 0.732235C8.53555 -5.96046e-08 7.357 0 5 0C2.64297 0 1.46446 -5.96046e-08 0.732235 0.732235C-5.96046e-08 1.46446 0 2.64297 0 5C0 7.357 -5.96046e-08 8.53555 0.732235 9.26775ZM3.75 3.375C2.85253 3.375 2.125 4.10255 2.125 5C2.125 5.89745 2.85253 6.625 3.75 6.625C4.64745 6.625 5.375 5.89745 5.375 5C5.375 4.7929 5.5429 4.625 5.75 4.625C5.9571 4.625 6.125 4.7929 6.125 5C6.125 6.3117 5.0617 7.375 3.75 7.375C2.43832 7.375 1.375 6.3117 1.375 5C1.375 3.68832 2.43832 2.625 3.75 2.625C3.9571 2.625 4.125 2.79289 4.125 3C4.125 3.2071 3.9571 3.375 3.75 3.375ZM7.875 5C7.875 5.89745 7.14745 6.625 6.25 6.625C6.0429 6.625 5.875 6.7929 5.875 7C5.875 7.2071 6.0429 7.375 6.25 7.375C7.5617 7.375 8.625 6.3117 8.625 5C8.625 3.68832 7.5617 2.625 6.25 2.625C4.9383 2.625 3.875 3.68832 3.875 5C3.875 5.2071 4.0429 5.375 4.25 5.375C4.4571 5.375 4.625 5.2071 4.625 5C4.625 4.10255 5.35255 3.375 6.25 3.375C7.14745 3.375 7.875 4.10255 7.875 5Z" fill="#B1B1B1" />
                                    </svg>

                                </a>
                            </div>

                            <div >
                                {progressMap[project.id]?.status === 'running' ? (
                                    <div className={`bg-[#F59106] rounded-[4px] p-2 cursor-pointer`} >
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
                                    </div>


                                ) : (
                                    <div className={`bg-[#0AA947] rounded-[4px] p-2 cursor-pointer`} onClick={() => onScan(project.url, project.id)}>
                                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" >
                                            <path d="M8.7043 3.67629C9.76525 4.25325 9.76525 5.74675 8.7043 6.3237L2.29831 9.80725C1.26717 10.368 0 9.63815 0 8.48355V1.51645C0 0.36184 1.26718 -0.36799 2.29831 0.19274L8.7043 3.67629Z" fill="white" />
                                        </svg>
                                    </div>
                                )}
                            </div>


                        </div>
                    </div>
                    )
                })}
            </div>

            {/* Модалка */}
            <Modal show={add} onHide={onAdd} title="Новый проект">
                <form onSubmit={onSubmit} className="space-y-4">

                    <div>
                        <Label htmlFor="url">URL сайта</Label>
                        <Input
                            id="url"
                            type="text"
                            value={data.url}
                            onChange={(e) => setData({ 'url': e.target.value, 'name': e.target.value })}
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
            {/*  */}

            {/* Модалка */}

            {selectedProject && <ProjectModals toogle={setting} setToogle={() => openSettings()} project_parent={selectedProject} />}
            {/*  */}


            <ConfirmDialog />

        </AppLayout>
    );
}