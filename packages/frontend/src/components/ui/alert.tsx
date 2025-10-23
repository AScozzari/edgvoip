import * as React from 'react';

type AlertVariant = 'default' | 'destructive' | 'success' | 'warning' | 'info';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

const variantToClasses: Record<AlertVariant, string> = {
  default:
    'border border-gray-200 bg-white text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100',
  destructive:
    'border border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950 dark:text-red-300',
  success:
    'border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950 dark:text-emerald-300',
  warning:
    'border border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950 dark:text-amber-300',
  info:
    'border border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/50 dark:bg-sky-950 dark:text-sky-300',
};

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const classes = `w-full rounded-md px-4 py-3 text-sm ${variantToClasses[variant]} ${className}`.trim();
    return (
      <div ref={ref} role="alert" className={classes} {...props}>
        {children}
      </div>
    );
  }
);
Alert.displayName = 'Alert';

export interface AlertDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const AlertDescription = React.forwardRef<HTMLParagraphElement, AlertDescriptionProps>(
  ({ className = '', children, ...props }, ref) => {
    const classes = `mt-1 leading-relaxed ${className}`.trim();
    return (
      <p ref={ref} className={classes} {...props}>
        {children}
      </p>
    );
  }
);
AlertDescription.displayName = 'AlertDescription';


