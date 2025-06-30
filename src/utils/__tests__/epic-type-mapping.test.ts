import {
  isRunWorkEpicType,
  isChangeWorkEpicType,
} from '../trackingImportUtils';

describe('Epic Type Mapping', () => {
  describe('isRunWorkEpicType', () => {
    it('should return true for Critical Run', () => {
      expect(isRunWorkEpicType('Critical Run')).toBe(true);
    });

    it('should return false for Change Work types', () => {
      expect(isRunWorkEpicType('Feature')).toBe(false);
      expect(isRunWorkEpicType('Platform')).toBe(false);
      expect(isRunWorkEpicType('Tech Debt')).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(isRunWorkEpicType('critical run')).toBe(false);
      expect(isRunWorkEpicType('CRITICAL RUN')).toBe(false);
    });
  });

  describe('isChangeWorkEpicType', () => {
    it('should return true for Change Work types', () => {
      expect(isChangeWorkEpicType('Feature')).toBe(true);
      expect(isChangeWorkEpicType('Platform')).toBe(true);
      expect(isChangeWorkEpicType('Tech Debt')).toBe(true);
    });

    it('should return false for Run Work types', () => {
      expect(isChangeWorkEpicType('Critical Run')).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(isChangeWorkEpicType('feature')).toBe(false);
      expect(isChangeWorkEpicType('FEATURE')).toBe(false);
    });
  });
});
