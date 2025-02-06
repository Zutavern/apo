"use client"

import * as React from "react"
import { addDays, format } from "date-fns"
import { de } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  className?: string
  date: DateRange | undefined
  onDateChange: (date: DateRange | undefined) => void
  disabled?: boolean
  disabledDays?: (date: Date) => boolean
  fromDate?: Date
  toDate?: Date
}

export function DateRangePicker({
  className,
  date,
  onDateChange,
  disabled,
  disabledDays,
  fromDate,
  toDate,
}: DateRangePickerProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[240px] justify-start text-left font-normal text-sm bg-gray-900/50 border-gray-700/50 hover:bg-gray-800 hover:border-blue-500/50 text-gray-100 transition-all duration-200",
              !date && "text-gray-400",
              disabled && "opacity-50 cursor-not-allowed hover:border-gray-700/50",
              date && "border-blue-500/50"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-blue-500" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd.MM.yy", { locale: de })} -{" "}
                  {format(date.to, "dd.MM.yy", { locale: de })}
                </>
              ) : (
                format(date.from, "dd.MM.yy", { locale: de })
              )
            ) : (
              <span>Zeitraum auswählen</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-4 bg-gray-900/95 border-gray-700/50 backdrop-blur-sm shadow-2xl" 
          align="start"
        >
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onDateChange}
            numberOfMonths={2}
            disabled={disabledDays}
            fromDate={fromDate}
            toDate={toDate}
            locale={de}
            className="bg-transparent text-gray-100 rounded-lg select-none"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center text-gray-100 mb-4",
              caption_label: "text-sm font-medium text-gray-100",
              nav: "space-x-1 flex items-center",
              nav_button: "h-7 w-7 bg-gray-800/50 text-gray-100 hover:bg-gray-700 hover:text-blue-500 border border-gray-700/50 hover:border-blue-500/50 rounded-md p-0 transition-colors duration-200",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-gray-400 rounded-md w-9 font-normal text-[0.8rem] uppercase tracking-wider",
              row: "flex w-full mt-2",
              cell: cn(
                "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-gray-800/50",
                "[&:has([aria-selected].day-range-end)]:rounded-r-md",
                "[&:has([aria-selected].day-range-start)]:rounded-l-md",
                "[&:has([aria-selected])]:transition-colors",
                "[&:has([aria-selected])]:duration-200"
              ),
              day: cn(
                "h-9 w-9 p-0 font-normal text-gray-100",
                "hover:bg-gray-800/80 hover:text-blue-500",
                "rounded-md transition-colors duration-200",
                "aria-selected:opacity-100",
                "disabled:text-gray-500 disabled:hover:bg-transparent disabled:cursor-not-allowed"
              ),
              day_range_end: "day-range-end",
              day_selected: "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 hover:text-blue-500 focus:bg-blue-500/30 focus:text-blue-500 rounded-md border border-blue-500/50",
              day_today: "bg-gray-800/30 text-gray-100 border border-gray-700/50",
              day_outside: "text-gray-500 opacity-50",
              day_disabled: "text-gray-500 opacity-50 cursor-not-allowed",
              day_range_middle: "aria-selected:bg-gray-800/30 aria-selected:text-gray-100",
              day_hidden: "invisible",
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
} 