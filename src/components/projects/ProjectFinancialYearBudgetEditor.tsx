import React, { useState, useMemo } from 'react';
import { ProjectFinancialYearBudget } from '@/types';
import { useSettings } from '@/context/SettingsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, DollarSign, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProjectFinancialYearBudgetEditorProps {
  budgets: ProjectFinancialYearBudget[];
  legacyBudget?: number;
  onBudgetsChange: (budgets: ProjectFinancialYearBudget[]) => void;
}

const ProjectFinancialYearBudgetEditor: React.FC<
  ProjectFinancialYearBudgetEditorProps
> = ({ budgets, legacyBudget, onBudgetsChange }) => {
  const { config } = useSettings();
  const [validationError, setValidationError] = useState<string | null>(null);

  // Generate available financial years (current + next 3 years)
  const availableFinancialYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];

    for (let i = 0; i < 4; i++) {
      const year = currentYear + i;
      years.push({
        id: `fy-${year}`,
        name: `FY ${year}`,
        startDate: `${year - 1}-10-01`,
        endDate: `${year}-09-30`,
      });
    }

    return years;
  }, []);

  // Calculate total budget
  const totalBudget = useMemo(() => {
    return budgets.reduce((sum, budget) => sum + (budget.amount || 0), 0);
  }, [budgets]);

  // Format currency with abbreviations for large numbers
  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}K`;
    } else {
      return `$${amount.toLocaleString()}`;
    }
  };

  // Add new financial year budget
  const handleAddBudget = () => {
    const newBudget: ProjectFinancialYearBudget = {
      financialYearId: '',
      amount: 0,
    };
    onBudgetsChange([...budgets, newBudget]);
    setValidationError(null);
  };

  // Update budget amount
  const handleAmountChange = (index: number, value: string) => {
    const amount = Math.max(0, parseFloat(value) || 0); // Ensure non-negative
    const updatedBudgets = budgets.map((budget, i) =>
      i === index ? { ...budget, amount } : budget
    );
    onBudgetsChange(updatedBudgets);
    setValidationError(null);
  };

  // Update financial year selection
  const handleFinancialYearChange = (
    index: number,
    financialYearId: string
  ) => {
    // Check for duplicates
    const isDuplicate = budgets.some(
      (budget, i) => i !== index && budget.financialYearId === financialYearId
    );

    if (isDuplicate) {
      const fyName = availableFinancialYears.find(
        fy => fy.id === financialYearId
      )?.name;
      setValidationError(`${fyName} already has a budget assigned.`);
      return;
    }

    const updatedBudgets = budgets.map((budget, i) =>
      i === index ? { ...budget, financialYearId } : budget
    );
    onBudgetsChange(updatedBudgets);
    setValidationError(null);
  };

  // Remove budget
  const handleRemoveBudget = (index: number) => {
    const updatedBudgets = budgets.filter((_, i) => i !== index);
    onBudgetsChange(updatedBudgets);
    setValidationError(null);
  };

  // Migrate legacy budget
  const handleMigrateLegacyBudget = () => {
    if (!legacyBudget || !config?.financialYear) return;

    const currentFyBudget: ProjectFinancialYearBudget = {
      financialYearId: config.financialYear.id,
      amount: legacyBudget,
    };

    onBudgetsChange([currentFyBudget]);
  };

  // Get financial year name
  const getFinancialYearName = (id: string): string => {
    return availableFinancialYears.find(fy => fy.id === id)?.name || id;
  };

  // Get available financial years for dropdown (excluding already selected)
  const getAvailableFinancialYears = (currentIndex: number) => {
    const selectedIds = budgets
      .map((budget, i) => (i !== currentIndex ? budget.financialYearId : null))
      .filter(Boolean);

    return availableFinancialYears.filter(fy => !selectedIds.includes(fy.id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Financial Year Budgets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Legacy Budget Migration */}
        {legacyBudget && legacyBudget > 0 && budgets.length === 0 && (
          <Alert>
            <ArrowRight className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                Migrate legacy budget of {formatCurrency(legacyBudget)} to
                current financial year?
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleMigrateLegacyBudget}
              >
                Migrate Legacy Budget
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Validation Error */}
        {validationError && (
          <Alert variant="destructive">
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}

        {/* Budget Table */}
        {budgets.length > 0 && (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Financial Year</TableHead>
                  <TableHead>Budget Amount</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgets.map((budget, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Select
                        value={budget.financialYearId}
                        onValueChange={value =>
                          handleFinancialYearChange(index, value)
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Select Financial Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableFinancialYears(index).map(fy => (
                            <SelectItem key={fy.id} value={fy.id}>
                              {fy.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">
                          {config?.currencySymbol || '$'}
                        </span>
                        <Input
                          type="number"
                          value={budget.amount || ''}
                          onChange={e =>
                            handleAmountChange(index, e.target.value)
                          }
                          placeholder="0"
                          min="0"
                          step="0.01"
                          className="w-32"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveBudget(index)}
                        aria-label={`Remove budget for ${getFinancialYearName(budget.financialYearId)}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Add Button */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleAddBudget}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Financial Year
          </Button>

          {/* Total Budget Display */}
          <div className="flex items-center space-x-2">
            <Label className="font-medium">Total Budget:</Label>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {formatCurrency(totalBudget)}
            </Badge>
          </div>
        </div>

        {/* Empty State */}
        {budgets.length === 0 && (!legacyBudget || legacyBudget === 0) && (
          <div className="text-center py-6 text-gray-500">
            <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No financial year budgets configured.</p>
            <p className="text-sm">
              Click "Add Financial Year" to get started.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectFinancialYearBudgetEditor;
