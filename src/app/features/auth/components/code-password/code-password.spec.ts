import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodePassword } from './code-password';

describe('CodePassword', () => {
  let component: CodePassword;
  let fixture: ComponentFixture<CodePassword>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodePassword]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CodePassword);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
