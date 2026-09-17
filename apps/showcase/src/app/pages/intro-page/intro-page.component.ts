import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HaBreadcrumb } from '@halolib-ui/angular/breadcrumb';
import type { HaBreadcrumbItem } from '@halolib-ui/angular/breadcrumb';

/** Docs landing page: what halo-ui is, why use it, its design philosophy, and the link into the install guide. */
@Component({
  selector: 'app-intro-page',
  standalone: true,
  imports: [RouterLink, HaBreadcrumb],
  templateUrl: './intro-page.component.html',
  styleUrl: './intro-page.component.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntroPageComponent {
  protected readonly breadcrumbItems: HaBreadcrumbItem[] = [
    { label: 'Documentación', link: '/instalacion' },
    { label: 'Introducción' },
  ];
}
