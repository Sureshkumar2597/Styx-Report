import type { ReactNode, MouseEventHandler, CSSProperties } from "react";

interface CardProps {
  children: ReactNode;
  className: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
  id?: string;
  style?: CSSProperties;
}

export function Card({ children, className, onClick, id, style }: CardProps) {
  return (
    <div className={className} onClick={onClick} id={id} style={style}>
      {children}
    </div>
  );
}
