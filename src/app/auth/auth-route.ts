import { ActivatedRouteSnapshot, ResolveFn } from "@angular/router";
import { VexRoutes } from "@vex/interfaces/vex-route.interface";
import { AppComponent } from "src/app/app.component";
// import { ResponseAppSetting } from "../response-type/Type";
import { inject } from "@angular/core";
import { SettingService } from "./services/setting.service";

// export const AppSettingResolver: ResolveFn<ResponseAppSetting> = (route: ActivatedRouteSnapshot) => {
//     return inject(SettingService).getDataApplicationSetting();
// };

const authRoute: VexRoutes = [
    {
        path: '',
        component: AppComponent,
        children: [
            {
                path: '',
                redirectTo: 'login',
                pathMatch: 'full',
            },
            {
                path: 'login',
                loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
                // resolve: { dataSchool: AppSettingResolver },
            },

            {
                path: 'login-otp',
                loadComponent: () => import('./login-otp/login-otp.component').then((m) => m.LoginOtpComponent),
            },

            {
                path: 'reset-password',
                loadComponent: () => import('./reset-password/reset-password.component').then((m) => m.ResetPasswordComponent),
            },

            {
                path: 'forgot-password',
                loadComponent: () => import('./forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
            },
            {
                path: 'email/verify/:id/:hash',
                loadComponent: () => import('./email-verify/email-verify.component').then((m) => m.EmailVerifyComponent),
            },
        ]
    },
];

export default authRoute;
