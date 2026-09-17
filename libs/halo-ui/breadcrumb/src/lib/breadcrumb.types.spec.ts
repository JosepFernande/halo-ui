import { HaBreadcrumbItem, HaBreadcrumbSize } from './breadcrumb.types';

describe('Breadcrumb Types', () => {
  it('should export HaBreadcrumbSize as a union type', () => {
    const sm: HaBreadcrumbSize = 'sm';
    const md: HaBreadcrumbSize = 'md';
    const lg: HaBreadcrumbSize = 'lg';

    expect(sm).toBe('sm');
    expect(md).toBe('md');
    expect(lg).toBe('lg');
  });

  it('should allow a HaBreadcrumbItem with no link', () => {
    const item: HaBreadcrumbItem = { label: 'Inicio' };

    expect(item.label).toBe('Inicio');
    expect(item.link).toBeUndefined();
  });

  it('should allow a HaBreadcrumbItem with a string link', () => {
    const item: HaBreadcrumbItem = { label: 'Componentes', link: '/componentes' };

    expect(item.link).toBe('/componentes');
  });

  it('should allow a HaBreadcrumbItem with a router commands-array link', () => {
    const item: HaBreadcrumbItem = { label: 'Botón', link: ['/componentes', 'boton'] };

    expect(item.link).toEqual(['/componentes', 'boton']);
  });

  it('should allow a HaBreadcrumbItem with an icon', () => {
    const item: HaBreadcrumbItem = { label: 'Inicio', link: '/', icon: 'house' };

    expect(item.icon).toBe('house');
  });

  it('should allow a HaBreadcrumbItem with no icon', () => {
    const item: HaBreadcrumbItem = { label: 'Inicio' };

    expect(item.icon).toBeUndefined();
  });
});
