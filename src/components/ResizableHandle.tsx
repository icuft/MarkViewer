import { useCallback, useEffect, useRef } from 'react'
import type { SplitDirection } from '../hooks/useSettings'

interface ResizableHandleProps {
  onResize: (ratio: number) => void
  containerRef: React.RefObject<HTMLElement | null>
  direction: SplitDirection
}

export function ResizableHandle({ onResize, containerRef, direction }: ResizableHandleProps) {
  const dragging = useRef(false)
  const isVertical = direction === 'vertical'

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      dragging.current = true
      document.body.style.cursor = isVertical ? 'row-resize' : 'col-resize'
      document.body.style.userSelect = 'none'
    },
    [isVertical],
  )

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const ratio = isVertical
        ? ((e.clientY - rect.top) / rect.height) * 100
        : ((e.clientX - rect.left) / rect.width) * 100
      onResize(Math.min(80, Math.max(20, ratio)))
    }

    const handleMouseUp = () => {
      if (!dragging.current) return
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [containerRef, onResize, isVertical])

  return (
    <div
      role="separator"
      aria-orientation={isVertical ? 'horizontal' : 'vertical'}
      aria-label="Panel boyutunu ayarla"
      onMouseDown={handleMouseDown}
      className={`group relative shrink-0 bg-border hover:bg-accent transition-colors ${
        isVertical
          ? 'h-1.5 w-full cursor-row-resize'
          : 'w-1.5 h-full cursor-col-resize'
      }`}
    >
      <div
        className={`absolute ${
          isVertical ? 'inset-x-0 -top-1.5 -bottom-1.5' : 'inset-y-0 -left-1.5 -right-1.5'
        }`}
      />
    </div>
  )
}
