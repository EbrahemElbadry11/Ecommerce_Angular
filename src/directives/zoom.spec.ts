import { Zoom } from './zoom';

describe('Zoom', () => {
  it('should create an instance', () => {
    const directive = new Zoom({ nativeElement: document.createElement('div') } as any);
    expect(directive).toBeTruthy();
  });
});
    