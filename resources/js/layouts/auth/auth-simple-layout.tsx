import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({
    children,
}: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6  p-6 ">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link
                            href={"/projects"}
                            className="flex flex-col items-center gap-2 font-medium"
                        >
                            <div >
                                <AppLogoIcon className="fill-current text-[var(--foreground)] dark:text-white" />
                            </div>
                        </Link>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
