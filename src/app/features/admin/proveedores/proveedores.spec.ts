import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { AdminProveedoresComponent } from './proveedores';

describe('AdminProveedoresComponent', () => {
  let component: AdminProveedoresComponent;
  let fixture: ComponentFixture<AdminProveedoresComponent>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        AdminProveedoresComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminProveedoresComponent);
    component = fixture.componentInstance;
    mockDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    mockSnackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  // ========== TESTS BÁSICOS ==========
  describe('Inicialización', () => {
    it('debe crear el componente', () => {
      expect(component).toBeTruthy();
    });

    it('debe inicializar con dashboard activo', () => {
      expect(component.activeModule).toBe('dashboard');
    });

    it('debe cargar todos los datos al inicializar', () => {
      spyOn(component as any, 'loadAllData');
      component.ngOnInit();
      expect((component as any).loadAllData).toHaveBeenCalled();
    });
  });

  // ========== TESTS DE NAVEGACIÓN ==========
  describe('Navegación', () => {
    it('debe cambiar el módulo activo', () => {
      component.setActiveModule('proveedores');
      expect(component.activeModule).toBe('proveedores');
    });
  });

  // ========== TESTS DE DATOS ==========
  describe('Carga de Datos', () => {
    it('debe cargar proveedores', () => {
      component.ngOnInit();
      expect(component.proveedoresDataSource.data.length).toBeGreaterThan(0);
    });

    it('debe cargar insumos', () => {
      component.ngOnInit();
      expect(component.insumosDataSource.data.length).toBeGreaterThan(0);
    });

    it('debe cargar productos', () => {
      component.ngOnInit();
      expect(component.productosDataSource.data.length).toBeGreaterThan(0);
    });
  });

  // ========== TESTS CRUD ==========
  describe('Operaciones CRUD', () => {
    it('debe agregar un proveedor', () => {
      component.ngOnInit();
      const initialLength = component.proveedoresDataSource.data.length;
      const newProveedor = {
        nombre: 'Test',
        telefono: '+57 123',
        email: 'test@test.com',
        numero_cuenta: '123'
      };
      
      component.addItem('proveedor', newProveedor);
      
      expect(component.proveedoresDataSource.data.length).toBe(initialLength + 1);
      expect(mockSnackBar.open).toHaveBeenCalled();
    });

    it('debe actualizar un proveedor', () => {
      component.ngOnInit();
      const oldItem = component.proveedoresDataSource.data[0];
      const updatedData = { nombre: 'Actualizado' };
      
      component.updateItem('proveedor', oldItem, updatedData);
      
      expect(component.proveedoresDataSource.data[0].nombre).toBe('Actualizado');
    });

    it('debe eliminar un proveedor', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      component.ngOnInit();
      const testItem = component.proveedoresDataSource.data[0];
      const initialLength = component.proveedoresDataSource.data.length;
      
      component.deleteItem('proveedor', testItem);
      
      expect(component.proveedoresDataSource.data.length).toBe(initialLength - 1);
    });
  });

  // ========== TESTS DE DIÁLOGOS ==========
  describe('Diálogos', () => {
    it('debe abrir diálogo para agregar', () => {
      const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(null) });
      mockDialog.open.and.returnValue(dialogRefSpyObj);
      
      component.openAddDialog('proveedor');
      
      expect(mockDialog.open).toHaveBeenCalled();
    });

    it('debe mostrar advertencia para tipos no implementados', () => {
      component.openAddDialog('pedido');
      
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('desarrollo'),
        'Cerrar',
        jasmine.any(Object)
      );
    });
  });

  // ========== TESTS DE FILTRADO ==========
  describe('Filtrado', () => {
    it('debe filtrar datos correctamente', () => {
      component.ngOnInit();
      const event = { target: { value: 'Distribuidora' } } as any;
      
      component.applyFilter(event, component.proveedoresDataSource);
      
      expect(component.proveedoresDataSource.filter).toBe('distribuidora');
    });
  });
});