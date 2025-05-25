import React, { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  striped?: boolean
  hoverable?: boolean
  bordered?: boolean
  compact?: boolean
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  (
    { className, striped = false, hoverable = false, bordered = false, compact = false, ...props },
    ref
  ) => {
    return (
      <div className="w-full overflow-auto">
        <table
          className={cn(
            'w-full text-sm text-left text-gray-700',
            bordered && 'border border-gray-200',
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)

Table.displayName = 'Table'

export interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {}

const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <thead
        className={cn('bg-gray-50 text-gray-700', className)}
        ref={ref}
        {...props}
      />
    )
  }
)

TableHeader.displayName = 'TableHeader'

export interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  striped?: boolean
  hoverable?: boolean
}

const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, striped = false, hoverable = false, ...props }, ref) => {
    return (
      <tbody
        className={cn(
          'divide-y divide-gray-200',
          striped && '[&>tr:nth-child(even)]:bg-gray-50',
          hoverable && '[&>tr:hover]:bg-gray-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

TableBody.displayName = 'TableBody'

export interface TableFooterProps extends HTMLAttributes<HTMLTableSectionElement> {}

const TableFooter = React.forwardRef<HTMLTableSectionElement, TableFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <tfoot
        className={cn('bg-gray-50 font-medium text-gray-900', className)}
        ref={ref}
        {...props}
      />
    )
  }
)

TableFooter.displayName = 'TableFooter'

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, ...props }, ref) => {
    return (
      <tr
        className={cn('border-b border-gray-200', className)}
        ref={ref}
        {...props}
      />
    )
  }
)

TableRow.displayName = 'TableRow'

export interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, ...props }, ref) => {
    return (
      <th
        className={cn(
          'px-6 py-3 text-left text-xs font-medium uppercase tracking-wider',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

TableHead.displayName = 'TableHead'

export interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  compact?: boolean
}

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, compact = false, ...props }, ref) => {
    return (
      <td
        className={cn(
          'px-6 py-4 whitespace-nowrap',
          compact ? 'px-3 py-2' : 'px-6 py-4',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

TableCell.displayName = 'TableCell'

export interface TableCaptionProps extends HTMLAttributes<HTMLTableCaptionElement> {}

const TableCaption = React.forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <caption
        className={cn('mt-4 text-sm text-gray-500', className)}
        ref={ref}
        {...props}
      />
    )
  }
)

TableCaption.displayName = 'TableCaption'

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
}
