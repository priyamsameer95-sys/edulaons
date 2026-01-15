import * as React from "react"
import { format, setMonth, setYear } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DatePickerWithYearSelectProps {
    date: Date | undefined
    setDate: (date: Date | undefined) => void
    fromYear?: number
    toYear?: number
    placeholder?: string
    className?: string
}

export function DatePickerWithYearSelect({
    date,
    setDate,
    fromYear = 1900,
    toYear = new Date().getFullYear(),
    placeholder = "Pick a date",
    className,
}: DatePickerWithYearSelectProps) {
    const [month, setMonthInCalendar] = React.useState<Date>(date || new Date())

    // Update internal calendar month when outer date changes
    React.useEffect(() => {
        if (date) {
            setMonthInCalendar(date)
        }
    }, [date])

    const years = React.useMemo(() => {
        const y = []
        for (let i = fromYear; i <= toYear; i++) {
            y.push(i)
        }
        return y.reverse() // Latest years first for DOB usually? Actually for DOB maybe reverse is better if starting from now
    }, [fromYear, toYear])

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]

    const handleMonthChange = (monthStr: string) => {
        const newMonthIndex = months.indexOf(monthStr)
        const newDate = setMonth(month, newMonthIndex)
        setMonthInCalendar(newDate)
    }

    const handleYearChange = (yearStr: string) => {
        const newYear = parseInt(yearStr)
        const newDate = setYear(month, newYear)
        setMonthInCalendar(newDate)
    }

    const handleSelect = (selectedDate: Date | undefined) => {
        if (selectedDate) {
            setDate(selectedDate)
            setMonthInCalendar(selectedDate)
        }
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="flex justify-between p-3 gap-2">
                    <Select
                        value={months[month.getMonth()]}
                        onValueChange={handleMonthChange}
                    >
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map((m) => (
                                <SelectItem key={m} value={m}>
                                    {m}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={month.getFullYear().toString()}
                        onValueChange={handleYearChange}
                    >
                        <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            {years.map((y) => (
                                <SelectItem key={y} value={y.toString()}>
                                    {y}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleSelect}
                    month={month}
                    onMonthChange={setMonthInCalendar}
                    initialFocus
                    disabled={(d) => d > new Date() || d < new Date("1900-01-01")}
                />
            </PopoverContent>
        </Popover>
    )
}
