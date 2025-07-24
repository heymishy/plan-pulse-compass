/**
 * Smart Form Builder Component
 * Dynamic form generation with validation and accessibility
 */

import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Check, ChevronsUpDown } from 'lucide-react';
import { format } from 'date-fns';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { cn } from '@/lib/utils';

// Field configuration types
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FormFieldConfig {
  /** Unique field name */
  name: string;
  /** Field type */
  type:
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'tel'
    | 'url'
    | 'textarea'
    | 'select'
    | 'multiselect'
    | 'checkbox'
    | 'radio'
    | 'switch'
    | 'date'
    | 'file';
  /** Field label */
  label: string;
  /** Placeholder text */
  placeholder?: string;
  /** Field description/help text */
  description?: string;
  /** Required field */
  required?: boolean;
  /** Zod validation schema */
  validation?: z.ZodSchema;
  /** Options for select/radio fields */
  options?: SelectOption[];
  /** Default value */
  defaultValue?: string | number | boolean | Date | string[];
  /** Field dependencies (show/hide based on other fields) */
  dependencies?: string[];
  /** Conditional visibility function */
  conditional?: (values: Record<string, unknown>) => boolean;
  /** Field width (grid columns) */
  width?: 'full' | 'half' | 'third' | 'quarter';
  /** Disabled state */
  disabled?: boolean;
  /** Custom field props */
  fieldProps?: Record<string, unknown>;
}

export interface SmartFormProps {
  /** Form field configuration */
  schema: FormFieldConfig[];
  /** Initial form values */
  initialValues?: Record<string, unknown>;
  /** Form submission handler */
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
  /** Cancel handler */
  onCancel?: () => void;
  /** Submit button text */
  submitText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Form title */
  title?: string;
  /** Form description */
  description?: string;
  /** Loading state */
  loading?: boolean;
  /** Form layout */
  layout?: 'single' | 'double' | 'auto';
  /** Custom form className */
  className?: string;
}

// Create Zod schema from field configurations
const createZodSchema = (
  fields: FormFieldConfig[]
): z.ZodObject<Record<string, unknown>> => {
  const schemaFields: Record<string, z.ZodSchema> = {};

  fields.forEach(field => {
    let fieldSchema: z.ZodSchema = z.any();

    // Base validation by type
    switch (field.type) {
      case 'email':
        fieldSchema = z.string().email('Invalid email address');
        break;
      case 'url':
        fieldSchema = z.string().url('Invalid URL');
        break;
      case 'number':
        fieldSchema = z.coerce.number();
        break;
      case 'checkbox':
        fieldSchema = z.boolean();
        break;
      case 'switch':
        fieldSchema = z.boolean();
        break;
      case 'date':
        fieldSchema = z.date();
        break;
      case 'multiselect':
        fieldSchema = z.array(z.string());
        break;
      default:
        fieldSchema = z.string();
    }

    // Apply custom validation if provided
    if (field.validation) {
      fieldSchema = field.validation;
    }

    // Handle required fields
    if (field.required) {
      if (field.type === 'checkbox' || field.type === 'switch') {
        fieldSchema = (fieldSchema as z.ZodBoolean).refine(
          val => val === true,
          {
            message: `${field.label} is required`,
          }
        );
      } else if (field.type === 'multiselect') {
        fieldSchema = (fieldSchema as z.ZodArray<z.ZodString>).min(
          1,
          `${field.label} is required`
        );
      } else {
        fieldSchema = (fieldSchema as z.ZodString).min(
          1,
          `${field.label} is required`
        );
      }
    } else {
      // Make optional if not required
      fieldSchema = fieldSchema.optional();
    }

    schemaFields[field.name] = fieldSchema;
  });

  return z.object(schemaFields);
};

// Field renderer component
const FormFieldRenderer: React.FC<{
  field: FormFieldConfig;
  form: UseFormReturn<Record<string, unknown>>;
  allValues: Record<string, unknown>;
}> = ({ field, form, allValues }) => {
  const renderField = () => {
    switch (field.type) {
      case 'textarea':
        return (
          <Textarea placeholder={field.placeholder} {...field.fieldProps} />
        );

      case 'select':
        return (
          <Select>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  className="justify-between"
                >
                  {form.watch(field.name)?.length
                    ? `${form.watch(field.name).length} selected`
                    : field.placeholder || 'Select items...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search..." />
                <CommandEmpty>No items found.</CommandEmpty>
                <CommandGroup>
                  {field.options?.map(option => (
                    <CommandItem
                      key={option.value}
                      onSelect={() => {
                        const currentValue = form.watch(field.name) || [];
                        const newValue = currentValue.includes(option.value)
                          ? currentValue.filter(
                              (v: string) => v !== option.value
                            )
                          : [...currentValue, option.value];
                        form.setValue(field.name, newValue);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          form.watch(field.name)?.includes(option.value)
                            ? 'opacity-100'
                            : 'opacity-0'
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <FormControl>
              <Checkbox />
            </FormControl>
            <FormLabel className="text-sm font-normal">{field.label}</FormLabel>
          </div>
        );

      case 'switch':
        return (
          <div className="flex items-center space-x-2">
            <FormControl>
              <Switch />
            </FormControl>
            <FormLabel className="text-sm font-normal">{field.label}</FormLabel>
          </div>
        );

      case 'radio':
        return (
          <RadioGroup className="flex flex-col space-y-1">
            {field.options?.map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={option.value} />
                <label
                  htmlFor={option.value}
                  className="text-sm font-normal cursor-pointer"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full pl-3 text-left font-normal',
                    !form.watch(field.name) && 'text-muted-foreground'
                  )}
                >
                  {form.watch(field.name) ? (
                    format(form.watch(field.name), 'PPP')
                  ) : (
                    <span>{field.placeholder || 'Pick a date'}</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={form.watch(field.name)}
                onSelect={date => form.setValue(field.name, date)}
                disabled={date =>
                  date > new Date() || date < new Date('1900-01-01')
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case 'file':
        return <Input type="file" {...field.fieldProps} />;

      default:
        return (
          <Input
            type={field.type}
            placeholder={field.placeholder}
            {...field.fieldProps}
          />
        );
    }
  };

  // Check if field should be visible
  const isVisible = useMemo(() => {
    if (field.conditional) {
      return field.conditional(allValues);
    }
    return true;
  }, [field.conditional, allValues]);

  if (!isVisible) {
    return null;
  }

  const widthClasses = {
    full: 'col-span-full',
    half: 'col-span-6',
    third: 'col-span-4',
    quarter: 'col-span-3',
  };

  return (
    <FormField
      control={form.control}
      name={field.name}
      render={({ field: formField }) => (
        <FormItem className={field.width ? widthClasses[field.width] : ''}>
          {field.type !== 'checkbox' && field.type !== 'switch' && (
            <FormLabel>{field.label}</FormLabel>
          )}
          {renderField()}
          {field.description && (
            <FormDescription>{field.description}</FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export const SmartForm: React.FC<SmartFormProps> = ({
  schema,
  initialValues = {},
  onSubmit,
  onCancel,
  submitText = 'Submit',
  cancelText = 'Cancel',
  title,
  description,
  loading = false,
  layout = 'auto',
  className,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create Zod schema
  const zodSchema = useMemo(() => createZodSchema(schema), [schema]);

  // Initialize form
  const form = useForm({
    resolver: zodResolver(zodSchema),
    defaultValues: {
      ...schema.reduce(
        (acc, field) => {
          acc[field.name] = field.defaultValue;
          return acc;
        },
        {} as Record<string, any>
      ),
      ...initialValues,
    },
  });

  // Watch all form values for conditional rendering
  const allValues = form.watch();

  // Handle form submission
  const handleSubmit = async (values: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine grid layout
  const layoutClasses = {
    single: 'grid-cols-1',
    double: 'grid-cols-1 md:grid-cols-2',
    auto: 'grid-cols-1 md:grid-cols-12',
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Form header */}
      {(title || description) && (
        <div className="space-y-2">
          {title && (
            <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
          )}
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className={cn('grid gap-4', layoutClasses[layout])}>
            {schema.map(field => (
              <FormFieldRenderer
                key={field.name}
                field={field}
                form={form}
                allValues={allValues}
              />
            ))}
          </div>

          {/* Form actions */}
          <div className="flex gap-3 pt-4 border-t">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                {cancelText}
              </Button>
            )}
            <EnhancedButton
              type="submit"
              loading={isSubmitting || loading}
              loadingText="Submitting..."
            >
              {submitText}
            </EnhancedButton>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default SmartForm;
