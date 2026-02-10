'use client'

import React from 'react'

interface LiveClockProps {
  locale?: string
}

export function LiveClock({ locale }: { locale: string }) {
  const [time, setTime] = React.useState('00:00:00')

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const timeStr = now.toLocaleTimeString('en-US', {
        timeZone: locale,
        hourCycle: 'h23',  // Force 24h (14:30:45)
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
      setTime(timeStr)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [locale])

  return (
    <span
      className="block transition-colors text-black/60"
    >
      {time}
    </span>
  )
}
