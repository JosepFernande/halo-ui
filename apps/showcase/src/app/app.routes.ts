import { Routes } from '@angular/router';
import { BreadcrumbPageComponent } from './pages/breadcrumb-page/breadcrumb-page.component';
import { ButtonPageComponent } from './pages/button-page/button-page.component';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { IconPageComponent } from './pages/icon-page/icon-page.component';
import { InputTextPageComponent } from './pages/input-text-page/input-text-page.component';
import { InstallPageComponent } from './pages/install-page/install-page.component';
import { IntroPageComponent } from './pages/intro-page/intro-page.component';
import { SelectPageComponent } from './pages/select-page/select-page.component';
import { DocsLayoutComponent } from './shared/docs-layout/docs-layout.component';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  {
    path: '',
    component: DocsLayoutComponent,
    children: [
      { path: 'instalacion', component: IntroPageComponent },
      { path: 'configuracion', component: InstallPageComponent },
      { path: 'componentes/boton', component: ButtonPageComponent },
      { path: 'componentes/input-text', component: InputTextPageComponent },
      { path: 'componentes/select', component: SelectPageComponent },
      { path: 'componentes/iconos', component: IconPageComponent },
      { path: 'componentes/breadcrumb', component: BreadcrumbPageComponent },
    ],
  },
];
