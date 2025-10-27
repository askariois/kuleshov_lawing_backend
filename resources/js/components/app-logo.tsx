import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square  items-center justify-center rounded-md">
                <AppLogoIcon className="w-full fill-current text-white dark:text-black" />
            </div>

        </>
    );
}
