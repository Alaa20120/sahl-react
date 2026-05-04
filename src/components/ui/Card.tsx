import type { ReactNode } from 'react'

interface Props {
  title?: ReactNode
  action?: ReactNode
  children: ReactNode
  style?: React.CSSProperties
  bodyStyle?: React.CSSProperties
}

export default function Card({ title, action, children, style, bodyStyle }: Props) {
  return (
    <div className="card" style={style}>
      {title != null && (
        <div className="card-header">
          <span className="card-title">{title}</span>
          {action}
        </div>
      )}
      <div className="card-body" style={bodyStyle}>{children}</div>
    </div>
  )
}
