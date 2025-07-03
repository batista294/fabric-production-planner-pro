import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        stamp: "border-transparent bg-stamp text-stamp-foreground hover:bg-stamp/80",
        product: "border-transparent bg-product text-product-foreground hover:bg-product/80",
        employee: "border-transparent bg-employee text-employee-foreground hover:bg-employee/80",
        failure: "border-transparent bg-failure text-failure-foreground hover:bg-failure/80",
        estampa: "border-transparent bg-estampa text-estampa-foreground hover:bg-estampa/80",
        costura: "border-transparent bg-costura text-costura-foreground hover:bg-costura/80",
        corte: "border-transparent bg-corte text-corte-foreground hover:bg-corte/80",
        acabamento: "border-transparent bg-acabamento text-acabamento-foreground hover:bg-acabamento/80",
        qualidade: "border-transparent bg-qualidade text-qualidade-foreground hover:bg-qualidade/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
