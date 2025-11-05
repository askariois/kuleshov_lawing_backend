import AuthenticatedSessionController from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { request } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    return (
        <AuthLayout
        >
            <Form
                {...AuthenticatedSessionController.store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6 bg-white p-4 rounded-[16px] w-full"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-2">
                            <h1 className='text-[18px] font-bold text-[#111111] border-b border-[#B1B1B1/30%] pb-4 mb-2'>Добро пожаловать</h1>
                            <div className="grid">
                                <Label htmlFor="email">E-Mail </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="Укажите E-Mail"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid ">
                                <div className="flex items-center">
                                    <Label htmlFor="email">Пароль </Label>
                                    {/* {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm"
                                            tabIndex={5}
                                        >
                                            Forgot password?
                                        </TextLink>
                                    )} */}
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Укажите пароль"
                                />
                                <InputError message={errors.password} />
                            </div>

                            {/* <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />
                                <Label htmlFor="remember">Remember me</Label>
                            </div> */}

                            <Button
                                type="submit"
                                className="mt-4 w-full "
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                                variant="primary"
                                size="lg"
                            >
                                {processing && (
                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                )}
                                Войти
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            У вас нет аккаунта?
                            <TextLink href={register()} tabIndex={5} >
                                Зарегистрироваться
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </AuthLayout>
    );
}
